import { NextResponse } from "next/server";
import { checkAllCertificates } from "@/lib/acme";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[SSL] Running automatic certificate renewal check");

    const results = await checkAllCertificates();

    const summary = {
      total: results.length,
      renewed: results.filter((r) => r.status === "renewed").length,
      valid: results.filter((r) => r.status === "valid").length,
      failed: results.filter((r) => r.status === "failed").length,
      error: results.filter((r) => r.status === "error").length,
    };

    console.log(`[SSL] Renewal check completed:`, summary);

    return NextResponse.json({
      success: true,
      summary,
      results,
    });
  } catch (error) {
    console.error("Certificate renewal check error:", error);
    return NextResponse.json(
      {
        error: "Failed to check certificate renewals",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  return POST(request);
}
