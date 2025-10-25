// Force reassign active agent to all GeoDNS locations

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in environment");
  process.exit(1);
}

// Define schemas
const AgentSchema = new mongoose.Schema({
  agentId: String,
  name: String,
  isActive: Boolean,
  ipInfo: Object,
});

const DomainSchema = new mongoose.Schema({}, { strict: false });

const Agent = mongoose.model("Agent", AgentSchema);
const Domain = mongoose.model("Domain", DomainSchema);

async function forceReassign() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get active agent
    const activeAgent = await Agent.findOne({ isActive: true });

    if (!activeAgent) {
      console.log("❌ No active agents found!");
      return;
    }

    console.log(
      `✅ Found active agent: ${activeAgent.name} (${activeAgent.agentId})`,
    );
    console.log(`   IP Info:`, activeAgent.ipInfo);
    console.log("");

    // Determine locations for this agent
    const locations = ["europe"]; // localhost fallback
    console.log(`📍 Target locations: ${locations.join(", ")}\n`);

    // Get all domains for this user
    console.log(`🔍 Looking for domains with userId: ${activeAgent.userId}`);
    const domains = await Domain.find({ userId: activeAgent.userId });
    console.log(`📋 Found ${domains.length} domains for this user`);

    if (domains.length === 0) {
      console.log("\n⚠️  No domains found! Checking all domains...");
      const allDomains = await Domain.find({});
      console.log(`📋 Total domains in DB: ${allDomains.length}`);

      if (allDomains.length > 0) {
        console.log("\n🔧 Will reassign for ALL domains (ignoring userId)\n");
        domains.push(...allDomains);
      }
    } else {
      console.log("");
    }

    let totalAssigned = 0;

    for (const domain of domains) {
      console.log(`🔧 Domain: ${domain.domain}`);
      let domainUpdated = false;

      if (!domain.geoDnsConfig || domain.geoDnsConfig.length === 0) {
        console.log(`  ⚠️  No geoDnsConfig found, skipping\n`);
        continue;
      }

      for (const locationCode of locations) {
        const location = domain.geoDnsConfig.find(
          (loc) => loc.code === locationCode,
        );

        if (location) {
          // Remove all old agents
          const oldCount = location.agentIds.length;
          location.agentIds = [];

          // Add active agent
          location.agentIds.push(activeAgent.agentId);

          console.log(
            `  ✓ ${locationCode}: Removed ${oldCount} old, assigned ${activeAgent.name}`,
          );
          totalAssigned++;
          domainUpdated = true;
        } else {
          console.log(
            `  ⚠️  ${locationCode}: Location not found in geoDnsConfig`,
          );
        }
      }

      if (domainUpdated) {
        await domain.save();
        console.log(`  💾 Saved\n`);
      }
    }

    console.log("═══════════════════════════════════════");
    console.log(`✅ Reassignment complete!`);
    console.log(`📊 Total assignments: ${totalAssigned}`);
    console.log("═══════════════════════════════════════");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

forceReassign();
