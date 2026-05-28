import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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

    let mid = process.env.NEXT_PUBLIC_PINELABS_MID;
    let clientId = process.env.NEXT_PUBLIC_PINELABS_CLIENT_ID;
    let clientSecret = process.env.PINELABS_CLIENT_SECRET;
    let env = process.env.NEXT_PUBLIC_PINELABS_ENV || "test";
    let baseUrl = process.env.NEXT_PUBLIC_PINELABS_BASE_URL || "https://pluraluat.v2.pinepg.in";

    try {
      const ctx = getCloudflareContext();
      if (ctx && ctx.env) {
        mid = mid || (ctx.env as any).NEXT_PUBLIC_PINELABS_MID;
        clientId = clientId || (ctx.env as any).NEXT_PUBLIC_PINELABS_CLIENT_ID;
        clientSecret = clientSecret || (ctx.env as any).PINELABS_CLIENT_SECRET;
        env = env || (ctx.env as any).NEXT_PUBLIC_PINELABS_ENV || "test";
        baseUrl = baseUrl || (ctx.env as any).NEXT_PUBLIC_PINELABS_BASE_URL || "https://pluraluat.v2.pinepg.in";
      }
    } catch (e) {
      // Ignore if not running in Cloudflare environment
    }

    if (mid === "undefined" || mid === "null") mid = undefined;
    if (clientId === "undefined" || clientId === "null") clientId = undefined;
    if (clientSecret === "undefined" || clientSecret === "null") clientSecret = undefined;

    if (!mid || !clientId || !clientSecret || clientId.includes("yourPinelabs") || clientSecret.includes("yourPinelabs")) {
      return NextResponse.json(
        {
          error: "PineLabs credentials are missing or still contain placeholder values.",
          code: "KEYS_MISSING",
        },
        { status: 400 }
      );
    }

    // Step 1: Generate Access Token
    const timestampAuth = new Date().toISOString();
    const requestIdAuth = generateUUID();

    const tokenRes = await fetch(`${baseUrl}/api/auth/v1/token`, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "Request-Timestamp": timestampAuth,
        "Request-ID": requestIdAuth,
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("PineLabs token generation failed:", tokenData);
      return NextResponse.json(
        { error: tokenData.message || "Failed to generate PineLabs auth token.", code: "AUTH_FAILED" },
        { status: tokenRes.status }
      );
    }

    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token missing from PineLabs auth response.", code: "AUTH_FAILED" },
        { status: 500 }
      );
    }

    // Step 2: Generate Checkout Link
    const txnid = `PL_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const timestampOrder = new Date().toISOString();
    const requestIdOrder = generateUUID();

    const nameParts = firstname.trim().split(/\s+/);
    const firstName = nameParts[0] || "Customer";
    const lastName = nameParts.slice(1).join(" ") || "Customer";

    const apiBaseUrl = req.nextUrl.origin;

    const orderPayload = {
      merchant_order_reference: txnid,
      order_amount: {
        value: Math.round(Number(amount) * 100), // Convert to paise
        currency: "INR",
      },
      integration_mode: "REDIRECT",
      pre_auth: false,
      allowed_payment_methods: [
        "CARD",
        "UPI",
        "NETBANKING",
        "POINTS",
        "WALLET",
        "CREDIT_EMI",
        "DEBIT_EMI",
      ],
      notes: productInfo,
      callback_url: `${apiBaseUrl}/api/pinelabs/callback?txnid=${txnid}`,
      failure_callback_url: `${apiBaseUrl}/api/pinelabs/callback?txnid=${txnid}&status=failed`,
      purchase_details: {
        customer: {
          email_id: email,
          first_name: firstName,
          last_name: lastName,
          mobile_number: phone,
          country_code: "91",
        },
      },
    };

    const orderRes = await fetch(`${baseUrl}/api/checkout/v1/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Request-ID": requestIdOrder,
        "Request-Timestamp": timestampOrder,
        "accept": "application/json",
      },
      body: JSON.stringify(orderPayload),
    });

    const orderData = await orderRes.json();

    if (!orderRes.ok) {
      console.error("PineLabs checkout link generation failed:", orderData);
      return NextResponse.json(
        { error: orderData.message || "Failed to create PineLabs order.", code: "ORDER_FAILED" },
        { status: orderRes.status }
      );
    }

    const redirectUrl = orderData.redirect_url || orderData.challenge_url;

    if (!redirectUrl) {
      return NextResponse.json(
        { error: "No redirect URL found in PineLabs order response.", code: "ORDER_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      redirect_url: redirectUrl,
      txnid,
      amount,
      env,
    });
  } catch (error: any) {
    console.error("Exception in PineLabs create-order API:", error);
    return NextResponse.json(
      { 
        error: error.message || "Internal Server Error", 
        code: "INTERNAL_ERROR",
        details: error.stack || error.toString() 
      },
      { status: 500 }
    );
  }
}
