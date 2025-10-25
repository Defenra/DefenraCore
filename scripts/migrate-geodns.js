// Script to migrate existing domains to add default GeoDNS locations

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
  { timestamps: true },
);

const Domain =
  mongoose.models?.Domain || mongoose.model("Domain", DomainSchema);

const defaultGeoDnsConfig = [
  // Continents
  { code: "europe", name: "Европа", type: "continent", agentIds: [] },
  {
    code: "north-america",
    name: "Северная Америка",
    type: "continent",
    agentIds: [],
  },
  {
    code: "south-america",
    name: "Южная Америка",
    type: "continent",
    agentIds: [],
  },
  { code: "africa", name: "Африка", type: "continent", agentIds: [] },
  { code: "asia", name: "Азия", type: "continent", agentIds: [] },
  { code: "oceania", name: "Океания", type: "continent", agentIds: [] },

  // Popular countries
  { code: "us", name: "США", type: "country", agentIds: [] },
  { code: "ca", name: "Канада", type: "country", agentIds: [] },
  { code: "au", name: "Австралия", type: "country", agentIds: [] },
  { code: "jp", name: "Япония", type: "country", agentIds: [] },
  { code: "ir", name: "Иран", type: "country", agentIds: [] },
  { code: "ae", name: "ОАЭ", type: "country", agentIds: [] },
  { code: "tr", name: "Турция", type: "country", agentIds: [] },
  { code: "cn", name: "Китай", type: "country", agentIds: [] },
  { code: "kz", name: "Казахстан", type: "country", agentIds: [] },
  { code: "ru", name: "Россия", type: "country", agentIds: [] },
];

async function migrate() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected!");

    // Find all domains without geoDnsConfig or with empty array
    const domainsToMigrate = await Domain.find({
      $or: [
        { geoDnsConfig: { $exists: false } },
        { geoDnsConfig: { $size: 0 } },
      ],
    });

    console.log(`Found ${domainsToMigrate.length} domains to migrate`);

    for (const domain of domainsToMigrate) {
      domain.geoDnsConfig = defaultGeoDnsConfig;
      await domain.save();
      console.log(`✓ Migrated: ${domain.domain}`);
    }

    console.log(
      `\n✅ Migration completed! ${domainsToMigrate.length} domains updated.`,
    );
    process.exit(0);
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
}

migrate();
