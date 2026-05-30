import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PaytmChecksum } from "../paytm-helper";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required for verification.", code: "MISSING_PARAMS" },
        { status: 400 }
      );
    }

    let mid = undefined;
    let merchantKey = undefined;
    let paytmEnv = undefined;

    try {
      const ctx = getCloudflareContext();
      if (ctx && ctx.env) {
        mid = (ctx.env as any).NEXT_PUBLIC_PAYTM_MID;
        merchantKey = (ctx.env as any).PAYTM_MERCHANT_KEY;
        paytmEnv = (ctx.env as any).NEXT_PUBLIC_PAYTM_ENV;
      }
    } catch (e) {
      // Ignore if not running in Cloudflare environment
    }

    mid = req.headers.get("x-paytm-mid") || mid || process.env.NEXT_PUBLIC_PAYTM_MID;
    merchantKey = req.headers.get("x-paytm-merchant-key") || merchantKey || process.env.PAYTM_MERCHANT_KEY;
    paytmEnv = req.headers.get("x-paytm-env") || paytmEnv || process.env.NEXT_PUBLIC_PAYTM_ENV || "staging";

    if (mid === "undefined" || mid === "null") mid = undefined;
    if (merchantKey === "undefined" || merchantKey === "null") merchantKey = undefined;
    if (paytmEnv === "undefined" || paytmEnv === "null") paytmEnv = "staging";

    // Clean credentials (trim whitespace and strip wrapping quotes)
    if (mid) mid = mid.trim().replace(/^['"]|['"]$/g, '');
    if (merchantKey) merchantKey = merchantKey.trim().replace(/^['"]|['"]$/g, '');
    if (paytmEnv) paytmEnv = paytmEnv.trim().replace(/^['"]|['"]$/g, '');

    if (!mid || !merchantKey) {
      return NextResponse.json(
        { error: "Paytm credentials are not configured.", code: "CONFIG_MISSING" },
        { status: 500 }
      );
    }

    const host = paytmEnv === "staging" ? "securestage.paytmpayments.com" : "secure.paytmpayments.com";

    const paytmParams = {
      body: {
        mid: mid,
        orderId: orderId,
      },
      head: {
        signature: "",
      },
    };

    // Generate Signature for the request body
    const checksum = await PaytmChecksum.generateSignature(
      JSON.stringify(paytmParams.body),
      merchantKey
    );

    paytmParams.head.signature = checksum;

    const statusUrl = `https://${host}/v3/order/status`;

    const response = await fetch(statusUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paytmParams),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Paytm Status API error response:", errorText);
      return NextResponse.json(
        { error: `Paytm status check failed: ${errorText}`, code: "PAYTM_ERROR" },
        { status: response.status }
      );
    }

    const resData: any = await response.json();

    if (!resData.body || !resData.head?.signature) {
      return NextResponse.json(
        { error: "Invalid response structure from Paytm.", code: "INVALID_RESPONSE" },
        { status: 500 }
      );
    }

    // Verify response signature
    const isResponseVerified = PaytmChecksum.verifySignature(
      JSON.stringify(resData.body),
      merchantKey,
      resData.head.signature
    );

    if (!isResponseVerified) {
      console.warn("Paytm response signature verification failed!");
      return NextResponse.json(
        { error: "Response signature verification failed.", code: "SIGNATURE_MISMATCH" },
        { status: 400 }
      );
    }

    const resultInfo = resData.body.resultInfo || {};
    const resultStatus = resultInfo.resultStatus;

    if (resultStatus === "TXN_SUCCESS") {
      return NextResponse.json({
        verified: true,
        txnId: resData.body.txnId,
        amount: resData.body.txnAmount,
        status: resultStatus,
        pgData: resData.body,
      });
    } else {
      return NextResponse.json({
        verified: false,
        status: resultStatus,
        error: resultInfo.resultMsg || `Transaction status: ${resultStatus}`,
        code: "TRANSACTION_FAILED",
        pgData: resData.body,
      });
    }
  } catch (error: any) {
    console.error("Exception in Paytm verify-payment API:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
