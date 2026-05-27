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
    const { txnid } = body;

    if (!txnid) {
      return NextResponse.json(
        { error: "Transaction ID is required for verification.", code: "MISSING_PARAMS" },
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

    if (!key || !salt) {
      return NextResponse.json(
        { error: "PayU credentials are not configured.", code: "CONFIG_MISSING" },
        { status: 500 }
      );
    }

    // Hash formula for verify_payment: sha512(key|command|var1|salt)
    const command = "verify_payment";
    const hashString = [key, command, txnid, salt].join("|");
    const hash = await generateSha512Hash(hashString);

    const url = payuEnv === "production" || payuEnv === "live"
      ? "https://info.payu.in/merchant/postservice.php?form=2"
      : "https://test.payu.in/merchant/postservice?form=2";

    const formDetails = new URLSearchParams();
    formDetails.append("key", key);
    formDetails.append("command", command);
    formDetails.append("var1", txnid);
    formDetails.append("hash", hash);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formDetails.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("PayU verification API error response:", errorText);
      return NextResponse.json(
        { error: `PayU status check failed: ${errorText}`, code: "PAYU_ERROR" },
        { status: response.status }
      );
    }

    const resData: any = await response.json();

    if (!resData.transaction_details) {
      return NextResponse.json(
        { error: "Invalid response structure from PayU verification API.", code: "INVALID_RESPONSE" },
        { status: 500 }
      );
    }

    const txn = resData.transaction_details[txnid];

    if (txn && txn.status === "success") {
      return NextResponse.json({
        verified: true,
        mihpayid: txn.mihpayid,
        status: txn.status,
        amount: txn.amount,
      });
    } else {
      return NextResponse.json({
        verified: false,
        status: txn?.status || "unknown",
        error: txn?.error_Message || "Transaction not found or failed.",
        code: "TRANSACTION_FAILED",
      });
    }
  } catch (error: any) {
    console.error("Exception in PayU verify-payment API:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
