import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

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

    let keySecret = undefined;

    try {
      const ctx = getCloudflareContext();
      if (ctx && ctx.env) {
        keySecret = (ctx.env as any).RAZORPAY_KEY_SECRET;
      }
    } catch (e) {
      // Ignore if not running in Cloudflare environment
    }

    keySecret = req.headers.get("x-razorpay-key-secret") || keySecret || process.env.RAZORPAY_KEY_SECRET;

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
      // Fetch full payment details from Razorpay
      let pgData: Record<string, any> = {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      };
      try {
        const credentials = `${keySecret ? "" : ""}${keySecret}`;
        // We need keyId too — re-read it
        let keyId2: any;
        try {
          const { getCloudflareContext: getCFCtx2 } = await import("@opennextjs/cloudflare");
          const ctx2 = getCFCtx2();
          if (ctx2 && ctx2.env) keyId2 = (ctx2.env as any).NEXT_PUBLIC_RAZORPAY_KEY_ID;
        } catch (_) {}
        keyId2 = req.headers.get("x-razorpay-key-id") || keyId2 || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        if (keyId2 && keySecret) {
          const paymentRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
            headers: {
              Authorization: `Basic ${btoa(`${keyId2}:${keySecret}`)}`,
            },
          });
          if (paymentRes.ok) {
            const paymentData = await paymentRes.json();
            pgData = { ...pgData, ...paymentData };
          }
        }
      } catch (_) {
        // Non-critical — signature verified, just couldn't fetch full details
      }
      return NextResponse.json({ verified: true, pgData });
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
