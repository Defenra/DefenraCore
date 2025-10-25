// Check if geoDnsConfig exists in database

import mongoose from "mongoose";
import "dotenv/config";

const DomainSchema = new mongoose.Schema(
  {
    domain: String,
    isActive: Boolean,
    httpProxy: Object,
    dnsRecords: Array,
    userId: mongoose.Schema.Types.ObjectId,
    description: String,
    geoDnsConfig: Array,
  },
  { timestamps: true, strict: false },
);

const Domain =
  mongoose.models?.Domain || mongoose.model("Domain", DomainSchema);

async function check() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected!");

    const domains = await Domain.find({});
    console.log(`\nFound ${domains.length} domain(s):\n`);

    for (const domain of domains) {
      console.log(`Domain: ${domain.domain}`);
      console.log(`  ID: ${domain._id}`);
      console.log(`  geoDnsConfig exists: ${!!domain.geoDnsConfig}`);
      console.log(`  geoDnsConfig length: ${domain.geoDnsConfig?.length || 0}`);

      if (domain.geoDnsConfig && domain.geoDnsConfig.length > 0) {
        console.log(
          `  Locations: ${domain.geoDnsConfig.map((l) => l.code).join(", ")}`,
        );
      } else {
        console.log(`  ⚠️  No geoDnsConfig!`);
      }
      console.log("");
    }

    // Check raw document
    const rawDomain = await mongoose.connection.db
      .collection("domains")
      .findOne({});
    console.log("\nRaw document from MongoDB:");
    console.log(JSON.stringify(rawDomain, null, 2));

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

check();
