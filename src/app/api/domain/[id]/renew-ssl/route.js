import { NextResponse } from "next/server";
import { renewCertificate } from "@/lib/acme";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Domain from "@/models/Domain";

export async function POST(_request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = params;

    const domain = await Domain.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    if (!domain.httpProxy.ssl.acmeEmail) {
      return NextResponse.json(
        {
          error: "ACME email not configured. Please issue a certificate first.",
        },
        { status: 400 },
      );
    }

    console.log(`[SSL] Renewing certificate for ${domain.domain}`);

    const result = await renewCertificate(domain.domain);

    return NextResponse.json({
      success: true,
      message: "Certificate renewed successfully",
      certificate: {
        expiresAt: result.expiresAt,
        issuer: result.issuer,
      },
    });
  } catch (error) {
    console.error("Certificate renewal error:", error);
    return NextResponse.json(
      {
        error: "Failed to renew certificate",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
