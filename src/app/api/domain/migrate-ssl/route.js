import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Domain from "@/models/Domain";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    console.log("[SSL Migration] Starting migration of acmeHttpChallenge structures...");

    // Find all domains with old acmeHttpChallenge structure
    const domains = await Domain.find({
      "httpProxy.ssl.acmeHttpChallenge": { $exists: true }
    });

    let migratedCount = 0;
    let skippedCount = 0;

    for (const domain of domains) {
      const challenge = domain.httpProxy.ssl.acmeHttpChallenge;
      
      // Check if it's the old structure (has token/keyAuthorization directly)
      if (challenge && typeof challenge === 'object' && 
          (challenge.token || challenge.keyAuthorization) &&
          !challenge.constructor.name.includes('Map')) {
        
        console.log(`[SSL Migration] Migrating domain: ${domain.domain}`);
        
        // Clear the old structure
        domain.httpProxy.ssl.acmeHttpChallenge = {};
        
        await domain.save();
        migratedCount++;
        
        console.log(`[SSL Migration] ✅ Migrated ${domain.domain}`);
      } else {
        skippedCount++;
        console.log(`[SSL Migration] ⏭️ Skipped ${domain.domain} (already new format or empty)`);
      }
    }

    console.log(`[SSL Migration] Migration completed: ${migratedCount} migrated, ${skippedCount} skipped`);

    return NextResponse.json({
      success: true,
      message: `SSL migration completed successfully`,
      migrated: migratedCount,
      skipped: skippedCount,
      total: domains.length
    });

  } catch (error) {
    console.error("SSL migration error:", error);
    return NextResponse.json(
      {
        error: "Failed to migrate SSL structures",
        details: error.message,
      },
      { status: 500 },
    );
  }
}