import acme from "acme-client";
import Domain from "@/models/Domain";
import connectDB from "./mongodb";

const ACME_DIRECTORY_URL =
  process.env.ACME_DIRECTORY_URL || acme.directory.letsencrypt.production;

async function getOrCreateAccountKey() {
  const accountKey = await acme.crypto.createPrivateKey();
  return accountKey;
}

async function setHttpChallenge(domain, token, keyAuthorization) {
  await connectDB();

  const domainDoc = await Domain.findOne({ domain });
  if (!domainDoc) {
    throw new Error(`Domain ${domain} not found`);
  }

  console.log(`[ACME] Setting HTTP challenge for ${domain}`);
  console.log(`[ACME] Token: ${token}`);
  console.log(`[ACME] KeyAuthorization: ${keyAuthorization.substring(0, 30)}...`);
  console.log(`[ACME] URL: http://${domain}/.well-known/acme-challenge/${token}`);

  // Save challenge to database
  domainDoc.httpProxy.ssl.acmeHttpChallenge = {
    token: token,
    keyAuthorization: keyAuthorization,
  };

  // Inject ACME handler into Lua WAF code
  const userLuaCode = domainDoc.httpProxy.luaCode || "";
  
  console.log(`[ACME] Original Lua code length: ${userLuaCode.length} characters`);
  
  // Check if ACME handler is already injected (shouldn't be, but just in case)
  if (!userLuaCode.includes("-- BEGIN ACME AUTO-INJECT")) {
    const acmeHandler = `-- BEGIN ACME AUTO-INJECT (do not edit this section)
-- ACME HTTP-01 Challenge Handler (auto-injected by Core)
local acme_token = "${token}"
local acme_key_auth = "${keyAuthorization}"

if ngx.var.request_uri == "/.well-known/acme-challenge/" .. acme_token then
    ngx.header["Content-Type"] = "text/plain"
    ngx.say(acme_key_auth)
    return ngx.exit(200)
end
-- END ACME AUTO-INJECT

`;
    
    domainDoc.httpProxy.luaCode = acmeHandler + userLuaCode;
    console.log(`[ACME] ✅ ACME handler injected into Lua WAF code`);
    console.log(`[ACME] Modified Lua code length: ${domainDoc.httpProxy.luaCode.length} characters`);
    
    // Log the final Lua script (first 500 chars for debugging)
    console.log(`[ACME] === Final Lua script (first 500 chars) ===`);
    console.log(domainDoc.httpProxy.luaCode.substring(0, 500));
    console.log(`[ACME] === End of Lua script preview ===`);
  } else {
    console.log(`[ACME] ⚠️  ACME handler already exists in Lua code, skipping injection`);
  }

  await domainDoc.save();
  console.log(`[ACME] ✅ HTTP challenge saved to database`);

  // Verify by re-fetching
  const verifyDoc = await Domain.findOne({ domain });
  if (verifyDoc.httpProxy.ssl.acmeHttpChallenge.token === token) {
    console.log(`[ACME] ✅ Verified: HTTP challenge exists in database`);
  } else {
    console.error(`[ACME] ❌ ERROR: HTTP challenge NOT found in database after save!`);
    throw new Error(`Failed to save HTTP challenge to database`);
  }

  // Wait for ALL active agents to poll and get the challenge
  const maxWaitTime = 90000; // 90 seconds max
  const checkInterval = 5000; // Check every 5 seconds
  const challengeAddedAt = Date.now();
  
  const Agent = (await import("@/models/Agent")).default;
  
  // Get all active agents that need to receive the challenge
  const activeAgents = await Agent.find({ isActive: true });
  const totalAgents = activeAgents.length;
  
  console.log(`[ACME] Waiting for ALL ${totalAgents} active agent(s) to poll and receive the HTTP challenge...`);
  
  if (totalAgents === 0) {
    console.log(`[ACME] ⚠️  No active agents found!`);
    console.log(`[ACME] Proceeding anyway, but verification will likely fail`);
  } else {
    let waited = 0;
    let allAgentsPolled = false;
    
    while (waited < maxWaitTime) {
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
      waited += checkInterval;
      
      // Check how many active agents have polled after we added the challenge
      const agentsPolledAfter = await Agent.find({
        isActive: true,
        lastSeen: { $gte: new Date(challengeAddedAt) }
      });
      
      const polledCount = agentsPolledAfter.length;
      
      console.log(`[ACME] Progress: ${polledCount}/${totalAgents} agents polled (${Math.round(polledCount/totalAgents*100)}%)`);
      
      if (polledCount >= totalAgents) {
        allAgentsPolled = true;
        console.log(`[ACME] ✅ All ${totalAgents} agent(s) have polled after HTTP challenge was added`);
        
        // List which agents polled
        for (const agent of agentsPolledAfter) {
          console.log(`[ACME]    ✓ ${agent.name} (last seen: ${agent.lastSeen.toISOString()})`);
        }
        
        console.log(`[ACME] Waiting additional 5 seconds for propagation...`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        break;
      }
      
      const remaining = Math.ceil((maxWaitTime - waited) / 1000);
      if (waited % 15000 === 0) { // Log every 15 seconds
        console.log(`[ACME] Still waiting for all agents to poll... (${remaining}s remaining)`);
      }
    }
    
    if (!allAgentsPolled) {
      console.log(`[ACME] ⚠️  Not all agents polled within ${maxWaitTime / 1000}s`);
      console.log(`[ACME] Only ${agentsPolledAfter.length}/${totalAgents} agents received the challenge`);
      console.log(`[ACME] Proceeding anyway, but verification may fail if Let's Encrypt queries an outdated agent`);
    }
  }
}

async function removeHttpChallenge(domain) {
  await connectDB();

  const domainDoc = await Domain.findOne({ domain });
  if (!domainDoc) {
    console.log(`[ACME] Domain ${domain} not found for cleanup`);
    return;
  }

  console.log(`[ACME] Removing HTTP challenge for ${domain}`);
  
  domainDoc.httpProxy.ssl.acmeHttpChallenge = {
    token: "",
    keyAuthorization: "",
  };

  // Remove ACME handler from Lua WAF code
  const currentLuaCode = domainDoc.httpProxy.luaCode || "";
  
  console.log(`[ACME] Current Lua code length: ${currentLuaCode.length} characters`);
  
  // Find and remove the auto-injected section
  const beginMarker = "-- BEGIN ACME AUTO-INJECT (do not edit this section)";
  const endMarker = "-- END ACME AUTO-INJECT";
  
  const beginIndex = currentLuaCode.indexOf(beginMarker);
  const endIndex = currentLuaCode.indexOf(endMarker);
  
  if (beginIndex !== -1 && endIndex !== -1) {
    console.log(`[ACME] Found ACME handler at position ${beginIndex}-${endIndex + endMarker.length}`);
    
    // Remove the ACME handler section (including the end marker and following newline)
    const before = currentLuaCode.substring(0, beginIndex);
    const after = currentLuaCode.substring(endIndex + endMarker.length);
    
    // Clean up: remove the newline after END marker if it exists
    const cleanedAfter = after.startsWith("\n") ? after.substring(1) : after;
    
    domainDoc.httpProxy.luaCode = before + cleanedAfter;
    console.log(`[ACME] ✅ ACME handler removed from Lua WAF code`);
    console.log(`[ACME] Restored Lua code length: ${domainDoc.httpProxy.luaCode.length} characters`);
    
    // Log the restored Lua script (first 500 chars for debugging)
    console.log(`[ACME] === Restored Lua script (first 500 chars) ===`);
    console.log(domainDoc.httpProxy.luaCode.substring(0, 500));
    console.log(`[ACME] === End of Lua script preview ===`);
  } else {
    console.log(`[ACME] ⚠️  ACME handler markers not found in Lua code, nothing to remove`);
  }

  await domainDoc.save();
  console.log(`[ACME] ✅ HTTP challenge removed`);
}

export async function issueCertificate(domain, email) {
  console.log(`[ACME] Starting certificate issuance for ${domain}`);

  await connectDB();
  const domainDoc = await Domain.findOne({ domain });

  if (!domainDoc) {
    throw new Error(`Domain ${domain} not found`);
  }

  domainDoc.httpProxy.ssl.renewalStatus = "pending";
  domainDoc.httpProxy.ssl.renewalError = "";
  await domainDoc.save();

  try {
    const accountKey = await getOrCreateAccountKey();
    const client = new acme.Client({
      directoryUrl: ACME_DIRECTORY_URL,
      accountKey: accountKey,
    });

    const [key, csr] = await acme.crypto.createCsr({
      commonName: domain,
    });

    const cert = await client.auto({
      csr,
      email,
      termsOfServiceAgreed: true,
      challengePriority: ["http-01"],
      challengeCreateFn: async (authz, challenge, keyAuthorization) => {
        console.log(`[ACME] Challenge created for ${authz.identifier.value}`);
        console.log(`[ACME] Challenge type: ${challenge.type}`);

        if (challenge.type === "http-01") {
          const token = challenge.token;
          
          console.log(`[ACME] Setting up HTTP-01 challenge`);
          console.log(`[ACME] Token: ${token}`);
          console.log(`[ACME] Challenge URL: http://${authz.identifier.value}/.well-known/acme-challenge/${token}`);
          console.log(`[ACME] Expected response: ${keyAuthorization.substring(0, 30)}...`);

          await setHttpChallenge(domain, token, keyAuthorization);
        }
      },
      challengeRemoveFn: async (authz, challenge, _keyAuthorization) => {
        console.log(`[ACME] Challenge completed for ${authz.identifier.value}`);

        if (challenge.type === "http-01") {
          // Wait a bit before removing to ensure Let's Encrypt has verified
          console.log(`[ACME] Waiting 5 seconds before removing HTTP challenge...`);
          await new Promise((resolve) => setTimeout(resolve, 5000));
          
          await removeHttpChallenge(domain);
        }
      },
    });

    const certificatePem = cert.toString();
    const privateKeyPem = key.toString();

    const certInfo = await acme.crypto.readCertificateInfo(certificatePem);

    domainDoc.httpProxy.ssl.certificate = certificatePem;
    domainDoc.httpProxy.ssl.privateKey = privateKeyPem;
    domainDoc.httpProxy.ssl.expiresAt = certInfo.notAfter;
    domainDoc.httpProxy.ssl.issuer =
      certInfo.issuer.commonName || "Let's Encrypt";
    domainDoc.httpProxy.ssl.lastRenewal = new Date();
    domainDoc.httpProxy.ssl.renewalStatus = "success";
    domainDoc.httpProxy.ssl.enabled = true;
    await domainDoc.save();

    console.log(`[ACME] Certificate issued successfully for ${domain}`);
    console.log(`[ACME] Expires at: ${certInfo.notAfter}`);

    return {
      success: true,
      certificate: certificatePem,
      privateKey: privateKeyPem,
      expiresAt: certInfo.notAfter,
      issuer: certInfo.issuer.commonName,
    };
  } catch (error) {
    console.error(`[ACME] Certificate issuance failed for ${domain}:`, error);

    domainDoc.httpProxy.ssl.renewalStatus = "failed";
    domainDoc.httpProxy.ssl.renewalError = error.message;
    await domainDoc.save();

    throw error;
  }
}

export async function renewCertificate(domain) {
  console.log(`[ACME] Starting certificate renewal for ${domain}`);

  await connectDB();
  const domainDoc = await Domain.findOne({ domain });

  if (!domainDoc) {
    throw new Error(`Domain ${domain} not found`);
  }

  const email = domainDoc.httpProxy.ssl.acmeEmail;
  if (!email) {
    throw new Error(`ACME email not configured for ${domain}`);
  }

  return await issueCertificate(domain, email);
}

export async function checkCertificateExpiry(domain) {
  await connectDB();
  const domainDoc = await Domain.findOne({ domain });

  if (!domainDoc || !domainDoc.httpProxy.ssl.expiresAt) {
    return { needsRenewal: false, daysUntilExpiry: null };
  }

  const expiresAt = new Date(domainDoc.httpProxy.ssl.expiresAt);
  const now = new Date();
  const daysUntilExpiry = Math.floor((expiresAt - now) / (1000 * 60 * 60 * 24));

  const needsRenewal = daysUntilExpiry <= 30;

  return {
    needsRenewal,
    daysUntilExpiry,
    expiresAt,
  };
}

export async function checkAllCertificates() {
  await connectDB();

  const domains = await Domain.find({
    "httpProxy.ssl.enabled": true,
    "httpProxy.ssl.autoRenew": true,
  });

  console.log(
    `[ACME] Checking ${domains.length} domains for certificate renewal`,
  );

  const results = [];

  for (const domain of domains) {
    try {
      const { needsRenewal, daysUntilExpiry } = await checkCertificateExpiry(
        domain.domain,
      );

      if (needsRenewal) {
        console.log(
          `[ACME] Domain ${domain.domain} needs renewal (expires in ${daysUntilExpiry} days)`,
        );

        try {
          const result = await renewCertificate(domain.domain);
          results.push({
            domain: domain.domain,
            status: "renewed",
            result,
          });
        } catch (error) {
          console.error(`[ACME] Failed to renew ${domain.domain}:`, error);
          results.push({
            domain: domain.domain,
            status: "failed",
            error: error.message,
          });
        }
      } else {
        results.push({
          domain: domain.domain,
          status: "valid",
          daysUntilExpiry,
        });
      }
    } catch (error) {
      console.error(`[ACME] Error checking ${domain.domain}:`, error);
      results.push({
        domain: domain.domain,
        status: "error",
        error: error.message,
      });
    }
  }

  return results;
}
