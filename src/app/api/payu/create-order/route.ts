import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

async function generateSha512Hash(text: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-512", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      amount,
      productInfo = "VoltGlide Obsidian Pro",
      firstname = "Customer",
      email = "customer@example.com",
      phone = "9999999999",
    } = body;

    if (!amount) {
      return NextResponse.json(
        { error: "Amount is required.", code: "MISSING_PARAMS" },
        { status: 400 }
      );
    }

    let key = process.env.NEXT_PUBLIC_PAYU_KEY;
    let salt = process.env.PAYU_MERCHANT_SALT;
    let payuEnv = process.env.NEXT_PUBLIC_PAYU_ENV || "test";

    try {
      const ctx = getCloudflareContext();
      if (ctx && ctx.env) {
        key = key || (ctx.env as any).NEXT_PUBLIC_PAYU_KEY;
        salt = salt || (ctx.env as any).PAYU_MERCHANT_SALT;
        payuEnv = payuEnv || (ctx.env as any).NEXT_PUBLIC_PAYU_ENV || "test";
      }
    } catch (e) {
      // Ignore if not running in Cloudflare environment
    }

    if (key === "undefined" || key === "null") key = undefined;
    if (salt === "undefined" || salt === "null") salt = undefined;

    if (!key || !salt || key.includes("yourPayuKey") || salt.includes("yourPayuSalt")) {
      return NextResponse.json(
        {
          error: "PayU API keys are missing or still contain placeholder values.",
          code: "KEYS_MISSING",
        },
        { status: 400 }
      );
    }

    const txnid = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Format transaction amount to 2 decimal places as required by PayU
    const formattedAmount = Number(amount).toFixed(2);

    // Build the pipe-separated hash string
    // Format: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10|salt
    const udf1 = "", udf2 = "", udf3 = "", udf4 = "", udf5 = "", udf6 = "", udf7 = "", udf8 = "", udf9 = "", udf10 = "";
    const hashString = [
      key,
      txnid,
      formattedAmount,
      productInfo,
      firstname,
      email,
      udf1,
      udf2,
      udf3,
      udf4,
      udf5,
      udf6,
      udf7,
      udf8,
      udf9,
      udf10,
      salt
    ].join("|");

    const hash = await generateSha512Hash(hashString);

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
    const surl = `${baseUrl}/api/payu/callback`;
    const furl = `${baseUrl}/api/payu/callback`;

    return NextResponse.json({
      key,
      txnid,
      amount: formattedAmount,
      productinfo: productInfo,
      firstname,
      email,
      phone,
      hash,
      surl,
      furl,
      env: payuEnv,
    });
  } catch (error: any) {
    console.error("Exception in PayU create-order API:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
