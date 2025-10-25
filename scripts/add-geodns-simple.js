// Simple script to add GeoDNS config to local.host domain

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

const DomainSchema = new mongoose.Schema({}, { strict: false });
const Domain = mongoose.model("Domain", DomainSchema);

const defaultGeoDnsConfig = [
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

async function addGeoDns() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected\n");

    const domain = await Domain.findOne({ domain: "local.host" });

    if (!domain) {
      console.log("❌ Domain local.host not found!");
      return;
    }

    console.log(`📋 Found domain: ${domain.domain}`);
    console.log(
      `   Current geoDnsConfig: ${domain.geoDnsConfig ? `${domain.geoDnsConfig.length} locations` : "null/undefined"}`,
    );

    domain.geoDnsConfig = defaultGeoDnsConfig;
    await domain.save();

    console.log(`\n✅ Added 16 GeoDNS locations to ${domain.domain}!`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

addGeoDns();
