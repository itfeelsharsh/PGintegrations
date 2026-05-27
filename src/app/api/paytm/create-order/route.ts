import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import PaytmChecksum from "paytmchecksum";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount } = body;

    if (!amount) {
      return NextResponse.json(
        { error: "Amount is required.", code: "MISSING_PARAMS" },
        { status: 400 }
      );
    }

    let mid = process.env.NEXT_PUBLIC_PAYTM_MID;
    let merchantKey = process.env.PAYTM_MERCHANT_KEY;
    let website = process.env.NEXT_PUBLIC_PAYTM_WEBSITE || "WEBSTAGING";
    let channelId = process.env.NEXT_PUBLIC_PAYTM_CHANNEL_ID || "WEB";
    let paytmEnv = process.env.NEXT_PUBLIC_PAYTM_ENV || "staging";

    try {
      const ctx = getCloudflareContext();
      if (ctx && ctx.env) {
        mid = mid || (ctx.env as any).NEXT_PUBLIC_PAYTM_MID;
        merchantKey = merchantKey || (ctx.env as any).PAYTM_MERCHANT_KEY;
        website = website || (ctx.env as any).NEXT_PUBLIC_PAYTM_WEBSITE || "WEBSTAGING";
        channelId = channelId || (ctx.env as any).NEXT_PUBLIC_PAYTM_CHANNEL_ID || "WEB";
        paytmEnv = paytmEnv || (ctx.env as any).NEXT_PUBLIC_PAYTM_ENV || "staging";
      }
    } catch (e) {
      // Ignore if not running in Cloudflare environment
    }

    if (mid === "undefined" || mid === "null") mid = undefined;
    if (merchantKey === "undefined" || merchantKey === "null") merchantKey = undefined;

    if (!mid || !merchantKey) {
      return NextResponse.json(
        {
          error: "Paytm keys are missing or still contain placeholder values.",
          code: "KEYS_MISSING",
        },
        { status: 400 }
      );
    }

    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const host = paytmEnv === "staging" ? "securestage.paytmpayments.com" : "secure.paytmpayments.com";
    const callbackUrl = `https://${host}/theia/paytmCallback?ORDER_ID=${orderId}`;

    const paytmParams = {
      body: {
        requestType: "Payment",
        mid: mid,
        websiteName: website,
        orderId: orderId,
        callbackUrl: callbackUrl,
        txnAmount: {
          value: Number(amount).toFixed(2),
          currency: "INR",
        },
        userInfo: {
          custId: `CUST_${Date.now()}`,
        },
        enablePaymentMode: [
          { mode: "UPI" },
          { mode: "BALANCE" },
          { mode: "CC" },
          { mode: "DC" },
          { mode: "NB" },
          { mode: "EMI" },
          { mode: "PPBL" }
        ],
      },
      head: {
        version: "v1",
        channelId: channelId,
        requestTimestamp: Date.now().toString(),
        signature: "",
      },
    };

    // Generate Signature using body
    const checksum = await PaytmChecksum.generateSignature(
      JSON.stringify(paytmParams.body),
      merchantKey
    );

    paytmParams.head.signature = checksum;

    const initiateUrl = `https://${host}/theia/api/v1/initiateTransaction?mid=${mid}&orderId=${orderId}`;

    const response = await fetch(initiateUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paytmParams),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Paytm API error response:", errorText);
      return NextResponse.json(
        { error: `Paytm API error: ${errorText}`, code: "PAYTM_ERROR" },
        { status: response.status }
      );
    }

    const resData: any = await response.json();
    
    // Check if Paytm returned a failure resultInfo in the body
    if (resData.body?.resultInfo?.resultStatus === "F") {
      return NextResponse.json(
        {
          error: resData.body.resultInfo.resultMsg || "Initiate Transaction failed.",
          code: "PAYTM_API_FAILED",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      orderId: orderId,
      txnToken: resData.body.txnToken,
      amount: Number(amount).toFixed(2),
      mid: mid,
    });
  } catch (error: any) {
    console.error("Exception in Paytm create-order API:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
