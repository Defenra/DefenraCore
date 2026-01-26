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

  // For subdomains, we need to find the main domain in database
  // e.g., if domain is "api.ghost-cheats.com", we need to find "ghost-cheats.com"
  let domainDoc = await Domain.findOne({ domain });
  
  if (!domainDoc) {
    // Try to find parent domain for subdomains
    const parts = domain.split('.');
    if (parts.length > 2) {
      const parentDomain = parts.slice(1).join('.');
      domainDoc = await Domain.findOne({ domain: parentDomain });
      if (domainDoc) {
        console.log(`[ACME] Using parent domain ${parentDomain} for subdomain ${domain}`);
      }
    }
  }

  if (!domainDoc) {
    throw new Error(`Domain ${domain} not found`);
  }

  console.log(`[ACME] Setting HTTP challenge for ${domain}`);
  console.log(`[ACME] Token: ${token}`);
  console.log(
    `[ACME] KeyAuthorization: ${keyAuthorization.substring(0, 30)}...`,
  );
  console.log(
    `[ACME] URL: http://${domain}/.well-known/acme-challenge/${token}`,
  );

  // Migrate old acmeHttpChallenge structure to new object structure
  // This handles the case where old structure has token/keyAuthorization directly
  if (domainDoc.httpProxy.ssl.acmeHttpChallenge) {
    const challenge = domainDoc.httpProxy.ssl.acmeHttpChallenge;
    
    // Check if it's the old structure (has token/keyAuthorization directly)
    if (challenge.token !== undefined || challenge.keyAuthorization !== undefined) {
      console.log(`[ACME] Migrating old acmeHttpChallenge structure to new object format`);
      
      // Force clear the old structure by unsetting the field completely
      await Domain.updateOne(
        { _id: domainDoc._id },
        { $unset: { "httpProxy.ssl.acmeHttpChallenge": "" } }
      );
      
      // Reload the document to get the clean state
      const reloadedDoc = await Domain.findById(domainDoc._id);
      domainDoc = reloadedDoc;
      
      console.log(`[ACME] ✅ Cleared old acmeHttpChallenge structure`);
    }
  }

  // Initialize acmeHttpChallenge as empty object if not exists
  if (!domainDoc.httpProxy.ssl.acmeHttpChallenge) {
    domainDoc.httpProxy.ssl.acmeHttpChallenge = {};
  }
  
  // Store challenge with domain-specific key to support multiple challenges
  const challengeKey = domain.replace(/\./g, '_'); // Replace dots with underscores for MongoDB field names
  domainDoc.httpProxy.ssl.acmeHttpChallenge[challengeKey] = {
    token: token,
    keyAuthorization: keyAuthorization,
  };

  console.log(`[ACME] Stored challenge for ${domain} with key: ${challengeKey}`);

  // Inject ACME handler into Lua WAF code
  const userLuaCode = domainDoc.httpProxy.luaCode || "";

  console.log(
    `[ACME] Original Lua code length: ${userLuaCode.length} characters`,
  );

  // Check if ACME handler is already injected
  if (!userLuaCode.includes("-- BEGIN ACME AUTO-INJECT")) {
    // Create handler for all stored challenges
    let acmeHandlers = '';
    const allChallenges = domainDoc.httpProxy.ssl.acmeHttpChallenge;
    
    for (const [key, challenge] of Object.entries(allChallenges)) {
      if (challenge.token && challenge.keyAuthorization) {
        acmeHandlers += `
-- Challenge for ${key.replace(/_/g, '.')}
if ngx.var.request_uri == "/.well-known/acme-challenge/${challenge.token}" then
    ngx.header["Content-Type"] = "text/plain"
    ngx.say("${challenge.keyAuthorization}")
    return ngx.exit(200)
end`;
      }
    }

    const acmeHandler = `-- BEGIN ACME AUTO-INJECT (do not edit this section)
-- ACME HTTP-01 Challenge Handler (auto-injected by Core)${acmeHandlers}
-- END ACME AUTO-INJECT

`;

    domainDoc.httpProxy.luaCode = acmeHandler + userLuaCode;
    console.log(`[ACME] ✅ ACME handler injected into Lua WAF code`);
    console.log(
      `[ACME] Modified Lua code length: ${domainDoc.httpProxy.luaCode.length} characters`,
    );

    // Log the final Lua script (first 500 chars for debugging)
    console.log(`[ACME] === Final Lua script (first 500 chars) ===`);
    console.log(domainDoc.httpProxy.luaCode.substring(0, 500));
    console.log(`[ACME] === End of Lua script preview ===`);
  } else {
    console.log(
      `[ACME] ⚠️  ACME handler already exists in Lua code, updating challenges`,
    );
    
    // Update existing handler with new challenges
    const beginMarker = "-- BEGIN ACME AUTO-INJECT (do not edit this section)";
    const endMarker = "-- END ACME AUTO-INJECT";
    
    const currentLuaCode = domainDoc.httpProxy.luaCode;
    const beginIndex = currentLuaCode.indexOf(beginMarker);
    const endIndex = currentLuaCode.indexOf(endMarker);
    
    if (beginIndex !== -1 && endIndex !== -1) {
      const before = currentLuaCode.substring(0, beginIndex);
      const after = currentLuaCode.substring(endIndex + endMarker.length);
      
      // Create updated handler for all challenges
      let acmeHandlers = '';
      const allChallenges = domainDoc.httpProxy.ssl.acmeHttpChallenge;
      
      for (const [key, challenge] of Object.entries(allChallenges)) {
        if (challenge.token && challenge.keyAuthorization) {
          acmeHandlers += `
-- Challenge for ${key.replace(/_/g, '.')}
if ngx.var.request_uri == "/.well-known/acme-challenge/${challenge.token}" then
    ngx.header["Content-Type"] = "text/plain"
    ngx.say("${challenge.keyAuthorization}")
    return ngx.exit(200)
end`;
        }
      }

      const acmeHandler = `-- BEGIN ACME AUTO-INJECT (do not edit this section)
-- ACME HTTP-01 Challenge Handler (auto-injected by Core)${acmeHandlers}
-- END ACME AUTO-INJECT`;

      domainDoc.httpProxy.luaCode = before + acmeHandler + after;
      console.log(`[ACME] ✅ ACME handler updated with all challenges`);
      console.log(
        `[ACME] Updated Lua code length: ${domainDoc.httpProxy.luaCode.length} characters`,
      );
    }
  }

  await domainDoc.save();
  console.log(`[ACME] ✅ HTTP challenge saved to database`);

  // Verify by re-fetching
  const verifyDoc = await Domain.findOne({ domain: domainDoc.domain });
  const verifyChallengeKey = domain.replace(/\./g, '_');
  if (verifyDoc.httpProxy.ssl.acmeHttpChallenge && 
      verifyDoc.httpProxy.ssl.acmeHttpChallenge[verifyChallengeKey] &&
      verifyDoc.httpProxy.ssl.acmeHttpChallenge[verifyChallengeKey].token === token) {
    console.log(`[ACME] ✅ Verified: HTTP challenge exists in database for ${domain}`);
  } else {
    console.error(
      `[ACME] ❌ ERROR: HTTP challenge NOT found in database after save for ${domain}!`,
    );
    throw new Error(`Failed to save HTTP challenge to database for ${domain}`);
  }

  // Wait for ALL active agents to poll and get the challenge
  const maxWaitTime = 90000; // 90 seconds max
  const checkInterval = 5000; // Check every 5 seconds
  const challengeAddedAt = Date.now();

  const Agent = (await import("@/models/Agent")).default;

  // Get all active agents that need to receive the challenge
  const activeAgents = await Agent.find({ isActive: true });
  const totalAgents = activeAgents.length;

  console.log(
    `[ACME] Waiting for ALL ${totalAgents} active agent(s) to poll and receive the HTTP challenge...`,
  );

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
        lastSeen: { $gte: new Date(challengeAddedAt) },
      });

      const polledCount = agentsPolledAfter.length;

      console.log(
        `[ACME] Progress: ${polledCount}/${totalAgents} agents polled (${Math.round((polledCount / totalAgents) * 100)}%)`,
      );

      if (polledCount >= totalAgents) {
        allAgentsPolled = true;
        console.log(
          `[ACME] ✅ All ${totalAgents} agent(s) have polled after HTTP challenge was added`,
        );

        // List which agents polled
        for (const agent of agentsPolledAfter) {
          console.log(
            `[ACME]    ✓ ${agent.name} (last seen: ${agent.lastSeen.toISOString()})`,
          );
        }

        console.log(`[ACME] Waiting additional 5 seconds for propagation...`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        break;
      }

      const remaining = Math.ceil((maxWaitTime - waited) / 1000);
      if (waited % 15000 === 0) {
        // Log every 15 seconds
        console.log(
          `[ACME] Still waiting for all agents to poll... (${remaining}s remaining)`,
        );
      }
    }

    if (!allAgentsPolled) {
      console.log(
        `[ACME] ⚠️  Not all agents polled within ${maxWaitTime / 1000}s`,
      );
      console.log(
        `[ACME] Only ${agentsPolledAfter.length}/${totalAgents} agents received the challenge`,
      );
      console.log(
        `[ACME] Proceeding anyway, but verification may fail if Let's Encrypt queries an outdated agent`,
      );
    }
  }
}

async function removeHttpChallenge(domain) {
  await connectDB();

  // For subdomains, we need to find the main domain in database
  // e.g., if domain is "api.ghost-cheats.com", we need to find "ghost-cheats.com"
  let domainDoc = await Domain.findOne({ domain });
  
  if (!domainDoc) {
    // Try to find parent domain for subdomains
    const parts = domain.split('.');
    if (parts.length > 2) {
      const parentDomain = parts.slice(1).join('.');
      domainDoc = await Domain.findOne({ domain: parentDomain });
      if (domainDoc) {
        console.log(`[ACME] Using parent domain ${parentDomain} for subdomain ${domain} cleanup`);
      }
    }
  }

  if (!domainDoc) {
    console.log(`[ACME] Domain ${domain} not found for cleanup`);
    return;
  }

  console.log(`[ACME] Removing HTTP challenge for ${domain}`);

  // Remove specific challenge for this domain
  const challengeKey = domain.replace(/\./g, '_');
  if (domainDoc.httpProxy.ssl.acmeHttpChallenge && 
      domainDoc.httpProxy.ssl.acmeHttpChallenge[challengeKey]) {
    delete domainDoc.httpProxy.ssl.acmeHttpChallenge[challengeKey];
    console.log(`[ACME] Removed challenge for ${domain} (key: ${challengeKey})`);
  }

  // Check if there are any remaining challenges
  const remainingChallenges = domainDoc.httpProxy.ssl.acmeHttpChallenge || {};
  const hasRemainingChallenges = Object.keys(remainingChallenges).length > 0;

  if (!hasRemainingChallenges) {
    // No more challenges, remove the entire ACME handler
    domainDoc.httpProxy.ssl.acmeHttpChallenge = {};

    // Remove ACME handler from Lua WAF code
    const currentLuaCode = domainDoc.httpProxy.luaCode || "";

    console.log(
      `[ACME] Current Lua code length: ${currentLuaCode.length} characters`,
    );

    // Find and remove the auto-injected section
    const beginMarker = "-- BEGIN ACME AUTO-INJECT (do not edit this section)";
    const endMarker = "-- END ACME AUTO-INJECT";

    const beginIndex = currentLuaCode.indexOf(beginMarker);
    const endIndex = currentLuaCode.indexOf(endMarker);

    if (beginIndex !== -1 && endIndex !== -1) {
      console.log(
        `[ACME] Found ACME handler at position ${beginIndex}-${endIndex + endMarker.length}`,
      );

      // Remove the ACME handler section (including the end marker and following newline)
      const before = currentLuaCode.substring(0, beginIndex);
      const after = currentLuaCode.substring(endIndex + endMarker.length);

      // Clean up: remove the newline after END marker if it exists
      const cleanedAfter = after.startsWith("\n") ? after.substring(1) : after;

      domainDoc.httpProxy.luaCode = before + cleanedAfter;
      console.log(`[ACME] ✅ ACME handler removed from Lua WAF code`);
      console.log(
        `[ACME] Restored Lua code length: ${domainDoc.httpProxy.luaCode.length} characters`,
      );

      // Log the restored Lua script (first 500 chars for debugging)
      console.log(`[ACME] === Restored Lua script (first 500 chars) ===`);
      console.log(domainDoc.httpProxy.luaCode.substring(0, 500));
      console.log(`[ACME] === End of Lua script preview ===`);
    } else {
      console.log(
        `[ACME] ⚠️  ACME handler markers not found in Lua code, nothing to remove`,
      );
    }
  } else {
    // Update ACME handler with remaining challenges
    console.log(`[ACME] Updating ACME handler with ${Object.keys(remainingChallenges).length} remaining challenges`);
    
    const currentLuaCode = domainDoc.httpProxy.luaCode || "";
    const beginMarker = "-- BEGIN ACME AUTO-INJECT (do not edit this section)";
    const endMarker = "-- END ACME AUTO-INJECT";
    
    const beginIndex = currentLuaCode.indexOf(beginMarker);
    const endIndex = currentLuaCode.indexOf(endMarker);
    
    if (beginIndex !== -1 && endIndex !== -1) {
      const before = currentLuaCode.substring(0, beginIndex);
      const after = currentLuaCode.substring(endIndex + endMarker.length);
      
      // Create updated handler for remaining challenges
      let acmeHandlers = '';
      for (const [key, challenge] of Object.entries(remainingChallenges)) {
        if (challenge.token && challenge.keyAuthorization) {
          acmeHandlers += `
-- Challenge for ${key.replace(/_/g, '.')}
if ngx.var.request_uri == "/.well-known/acme-challenge/${challenge.token}" then
    ngx.header["Content-Type"] = "text/plain"
    ngx.say("${challenge.keyAuthorization}")
    return ngx.exit(200)
end`;
        }
      }

      const acmeHandler = `-- BEGIN ACME AUTO-INJECT (do not edit this section)
-- ACME HTTP-01 Challenge Handler (auto-injected by Core)${acmeHandlers}
-- END ACME AUTO-INJECT`;

      domainDoc.httpProxy.luaCode = before + acmeHandler + after;
      console.log(`[ACME] ✅ ACME handler updated with remaining challenges`);
    }
  }

  await domainDoc.save();
  console.log(`[ACME] ✅ HTTP challenge removed`);
}

export async function issueCertificate(domain, email, subdomains = []) {
  console.log(`[ACME] Starting certificate issuance for ${domain}`);
  if (subdomains.length > 0) {
    console.log(`[ACME] Including subdomains: ${subdomains.join(', ')}`);
  }

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

    // Create CSR with subdomains from DNS records
    const csrOptions = {
      commonName: domain,
    };

    // Automatically detect subdomains from DNS records
    const detectedSubdomains = [];
    for (const record of domainDoc.dnsRecords) {
      if (record.name && record.name !== "@" && record.name !== domain) {
        const subdomain = `${record.name}.${domain}`;
        if (!detectedSubdomains.includes(subdomain)) {
          detectedSubdomains.push(subdomain);
        }
      }
    }

    // Combine provided subdomains with detected ones
    const allSubdomains = [...new Set([...subdomains, ...detectedSubdomains])];
    
    if (allSubdomains.length > 0) {
      csrOptions.altNames = allSubdomains;
      console.log(`[ACME] Certificate will include subdomains: ${allSubdomains.join(', ')}`);
    }

    const [key, csr] = await acme.crypto.createCsr(csrOptions);

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
          const challengeDomain = authz.identifier.value;

          console.log(`[ACME] Setting up HTTP-01 challenge for ${challengeDomain}`);
          console.log(`[ACME] Token: ${token}`);
          console.log(
            `[ACME] Challenge URL: http://${challengeDomain}/.well-known/acme-challenge/${token}`,
          );
          console.log(
            `[ACME] Expected response: ${keyAuthorization.substring(0, 30)}...`,
          );

          // For subdomains, we need to set the challenge on the main domain
          // because the agent configuration is stored there
          const mainDomain = challengeDomain.includes('.') && challengeDomain !== domain 
            ? domain  // Use main domain for subdomains
            : challengeDomain; // Use the domain itself for main domain

          await setHttpChallenge(mainDomain, token, keyAuthorization);
        }
      },
      challengeRemoveFn: async (authz, challenge, _keyAuthorization) => {
        console.log(`[ACME] Challenge completed for ${authz.identifier.value}`);

        if (challenge.type === "http-01") {
          // Wait a bit before removing to ensure Let's Encrypt has verified
          console.log(
            `[ACME] Waiting 5 seconds before removing HTTP challenge...`,
          );
          await new Promise((resolve) => setTimeout(resolve, 5000));

          const challengeDomain = authz.identifier.value;
          const mainDomain = challengeDomain.includes('.') && challengeDomain !== domain 
            ? domain  // Use main domain for subdomains
            : challengeDomain; // Use the domain itself for main domain

          await removeHttpChallenge(mainDomain);
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
