#!/usr/bin/env node

/**
 * Cleanup expired global bans from MongoDB
 * Run this script periodically (e.g., via cron every hour)
 */

import mongoose from "mongoose";
import GlobalBan from "../src/models/GlobalBan.js";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/defenra";

async function cleanupExpiredBans() {
  try {
    console.log("[BanCleanup] Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);

    const now = new Date();

    // Count expired bans
    const expiredCount = await GlobalBan.countDocuments({
      expiresAt: { $lt: now },
    });

    if (expiredCount === 0) {
      console.log("[BanCleanup] No expired bans to clean up");
      await mongoose.disconnect();
      return;
    }

    console.log(`[BanCleanup] Found ${expiredCount} expired bans, deleting...`);

    // Delete expired bans
    const result = await GlobalBan.deleteMany({
      expiresAt: { $lt: now },
    });

    console.log(
      `[BanCleanup] Successfully deleted ${result.deletedCount} expired bans`,
    );

    // Show statistics
    const totalActiveBans = await GlobalBan.countDocuments({
      expiresAt: { $gt: now },
    });
    const permanentBans = await GlobalBan.countDocuments({
      isPermanent: true,
    });

    console.log(`[BanCleanup] Statistics:`);
    console.log(`  - Active bans: ${totalActiveBans}`);
    console.log(`  - Permanent bans: ${permanentBans}`);

    await mongoose.disconnect();
    console.log("[BanCleanup] Cleanup complete");
  } catch (error) {
    console.error("[BanCleanup] Error:", error);
    process.exit(1);
  }
}

cleanupExpiredBans();
