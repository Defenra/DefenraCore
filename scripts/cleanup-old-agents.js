// Script to remove inactive agents from GeoDNS assignments

import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import mongoose from "mongoose";

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
  isConnected: Boolean,
});

const DomainSchema = new mongoose.Schema({
  domain: String,
  geoDnsConfig: [
    {
      code: String,
      name: String,
      type: String,
      agentIds: [String],
    },
  ],
});

const Agent = mongoose.model("Agent", AgentSchema);
const Domain = mongoose.model("Domain", DomainSchema);

async function cleanupOldAgents() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get all agents
    const allAgents = await Agent.find({});
    const activeAgentIds = allAgents
      .filter((a) => a.isActive && a.isConnected)
      .map((a) => a.agentId);

    console.log(`📊 Found ${allAgents.length} total agents`);
    console.log(`✅ Active agents: ${activeAgentIds.length}`);
    console.log(
      `❌ Inactive agents: ${allAgents.length - activeAgentIds.length}\n`,
    );

    console.log("Active agent IDs:");
    activeAgentIds.forEach((id) => console.log(`  - ${id}`));
    console.log("");

    // Get all domains
    const domains = await Domain.find({});
    console.log(`📋 Checking ${domains.length} domains...\n`);

    let totalRemoved = 0;
    let domainsUpdated = 0;

    for (const domain of domains) {
      let domainUpdated = false;
      let removedFromDomain = 0;

      console.log(`🔍 Domain: ${domain.domain}`);

      for (const location of domain.geoDnsConfig || []) {
        const before = location.agentIds.length;

        // Remove inactive agents
        location.agentIds = location.agentIds.filter((agentId) => {
          const isActive = activeAgentIds.includes(agentId);
          if (!isActive) {
            console.log(
              `  ❌ Removing inactive agent from ${location.code}: ${agentId}`,
            );
            removedFromDomain++;
            totalRemoved++;
          }
          return isActive;
        });

        if (location.agentIds.length !== before) {
          domainUpdated = true;
        }
      }

      if (domainUpdated) {
        await domain.save();
        domainsUpdated++;
        console.log(`  💾 Saved (removed ${removedFromDomain} assignments)\n`);
      } else {
        console.log(`  ✓ No changes needed\n`);
      }
    }

    console.log("═══════════════════════════════════════");
    console.log(`✅ Cleanup complete!`);
    console.log(`📊 Domains updated: ${domainsUpdated}`);
    console.log(`🗑️  Total assignments removed: ${totalRemoved}`);
    console.log("═══════════════════════════════════════");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

cleanupOldAgents();
