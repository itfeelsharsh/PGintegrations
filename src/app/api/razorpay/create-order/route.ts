import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency = "INR" } = body;

    let keyId = undefined;
    let keySecret = undefined;

    try {
      const ctx = getCloudflareContext();
      if (ctx && ctx.env) {
        keyId = (ctx.env as any).NEXT_PUBLIC_RAZORPAY_KEY_ID;
        keySecret = (ctx.env as any).RAZORPAY_KEY_SECRET;
      }
    } catch (e) {
      // Ignore if not running in Cloudflare environment
    }

    keyId = keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    keySecret = keySecret || process.env.RAZORPAY_KEY_SECRET;

    // Handle bundler replacement quirks
    if (keyId === "undefined" || keyId === "null") keyId = undefined;
    if (keySecret === "undefined" || keySecret === "null") keySecret = undefined;

    if (!keyId || !keySecret || keyId.includes("yourKeyId") || keySecret.includes("yourKeySecret")) {
      return NextResponse.json(
        {
          error: "Razorpay keys are missing or still contain placeholder values.",
          code: "KEYS_MISSING",
        },
        { status: 400 }
      );
    }

    const receipt = `rcpt_${Math.random().toString(36).substring(2, 15)}`;
    
    // Use native btoa for base64 encoding (supported globally in Node & Workers)
    const credentials = `${keyId}:${keySecret}`;
    const authHeader = `Basic ${btoa(credentials)}`;

    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: Math.round(Number(amount) * 100), // convert to paise
        currency,
        receipt,
      }),
    });

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      console.error("Razorpay API error response:", errorText);
      return NextResponse.json(
        { error: `Razorpay API error: ${errorText}`, code: "RAZORPAY_ERROR" },
        { status: razorpayResponse.status }
      );
    }

    const order = await razorpayResponse.json();
    return NextResponse.json({
      ...order,
      keyId,
    });
  } catch (error: any) {
    console.error("Exception in create-order API:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
