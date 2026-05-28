import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, name, email, phone } = body;

    if (!amount) {
      return NextResponse.json(
        { error: "Amount is required.", code: "MISSING_PARAMS" },
        { status: 400 }
      );
    }

    let appId = undefined;
    let secretKey = undefined;
    let cfEnv = undefined;

    try {
      const ctx = getCloudflareContext();
      if (ctx && ctx.env) {
        appId = (ctx.env as any).NEXT_PUBLIC_CASHFREE_APP_ID;
        secretKey = (ctx.env as any).CASHFREE_SECRET_KEY;
        cfEnv = (ctx.env as any).NEXT_PUBLIC_CASHFREE_ENV;
      }
    } catch (e) {
      // Ignore if not running in Cloudflare environment
    }

    appId = appId || process.env.NEXT_PUBLIC_CASHFREE_APP_ID;
    secretKey = secretKey || process.env.CASHFREE_SECRET_KEY;
    cfEnv = cfEnv || process.env.NEXT_PUBLIC_CASHFREE_ENV || "sandbox";

    // Handle bundler replacement quirks
    if (appId === "undefined" || appId === "null") appId = undefined;
    if (secretKey === "undefined" || secretKey === "null") secretKey = undefined;

    if (!appId || !secretKey || appId.includes("yourCashfree") || secretKey.includes("yourCashfree")) {
      return NextResponse.json(
        {
          error: "Cashfree credentials are missing or still contain placeholder values.",
          code: "KEYS_MISSING",
        },
        { status: 400 }
      );
    }

    // Cashfree expects decimal amounts, e.g., 8999.00
    const formattedAmount = Number(amount).toFixed(2);
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const customerId = `cust_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const baseUrl = req.nextUrl.origin;
    const returnUrl = `${baseUrl}/api/cashfree/callback?order_id={order_id}`;

    const host = cfEnv === "production" ? "api.cashfree.com" : "sandbox.cashfree.com";
    const apiEndpoint = `https://${host}/pg/orders`;

    const requestPayload = {
      order_amount: Number(formattedAmount),
      order_currency: "INR",
      order_id: orderId,
      customer_details: {
        customer_id: customerId,
        customer_name: name || "Customer",
        customer_email: email || "customer@example.com",
        customer_phone: phone || "9999999999",
      },
      order_meta: {
        return_url: returnUrl,
      },
      order_note: "VoltGlide Obsidian Pro purchase",
    };

    const cashfreeResponse = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": appId,
        "x-client-secret": secretKey,
      },
      body: JSON.stringify(requestPayload),
    });

    if (!cashfreeResponse.ok) {
      const errorText = await cashfreeResponse.text();
      console.error("Cashfree PG API error response:", errorText);
      return NextResponse.json(
        { error: `Cashfree API error: ${errorText}`, code: "CASHFREE_ERROR" },
        { status: cashfreeResponse.status }
      );
    }

    const orderData = await cashfreeResponse.json();
    return NextResponse.json({
      order_id: orderData.order_id,
      payment_session_id: orderData.payment_session_id,
      env: cfEnv,
    });
  } catch (error: any) {
    console.error("Exception in Cashfree create-order API:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
