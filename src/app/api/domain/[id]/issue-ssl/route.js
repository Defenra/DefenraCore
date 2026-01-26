import { NextResponse } from "next/server";
import { issueCertificate } from "@/lib/acme";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Domain from "@/models/Domain";

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const domain = await Domain.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required for Let's Encrypt" },
        { status: 400 },
      );
    }

    domain.httpProxy.ssl.acmeEmail = email;
    await domain.save();

    console.log(
      `[SSL] Issuing certificate for ${domain.domain} with email ${email}`,
    );

    // Log subdomains that will be included
    const subdomains = domain.dnsRecords
      .filter(record => record.name && record.name !== "@" && record.name !== domain.domain)
      .map(record => `${record.name}.${domain.domain}`);
    
    if (subdomains.length > 0) {
      console.log(`[SSL] Certificate will include subdomains: ${subdomains.join(', ')}`);
    } else {
      console.log(`[SSL] Certificate will only include main domain (no subdomains found)`);
    }

    const result = await issueCertificate(domain.domain, email);

    return NextResponse.json({
      success: true,
      message: "Certificate issued successfully",
      certificate: {
        expiresAt: result.expiresAt,
        issuer: result.issuer,
      },
    });
  } catch (error) {
    console.error("Certificate issuance error:", error);
    return NextResponse.json(
      {
        error: "Failed to issue certificate",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
