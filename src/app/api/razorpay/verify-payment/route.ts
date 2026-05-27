import { NextRequest, NextResponse } from "next/server";

async function computeHmacSha256(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message)
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required payment verification parameters.", code: "MISSING_PARAMS" },
        { status: 400 }
      );
    }

    let keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (keySecret === "undefined" || keySecret === "null") keySecret = undefined;

    if (!keySecret) {
      return NextResponse.json(
        { error: "Razorpay Key Secret is not configured.", code: "CONFIG_MISSING" },
        { status: 500 }
      );
    }

    const expectedSignature = await computeHmacSha256(
      `${razorpay_order_id}|${razorpay_payment_id}`,
      keySecret
    );

    if (expectedSignature === razorpay_signature) {
      return NextResponse.json({ verified: true });
    } else {
      console.warn("Signature mismatch. Verification failed.");
      return NextResponse.json(
        { error: "Payment verification failed. Invalid signature.", verified: false },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Exception in verify-payment API:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
