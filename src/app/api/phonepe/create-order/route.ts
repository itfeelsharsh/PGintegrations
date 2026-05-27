import { NextRequest, NextResponse } from "next/server";
import { getPhonePeConfig, getPhonePeToken } from "../phonepe-helper";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, phone } = body;

    if (!amount) {
      return NextResponse.json(
        { error: "Amount is required.", code: "MISSING_PARAMS" },
        { status: 400 }
      );
    }

    const config = getPhonePeConfig();

    console.log("PhonePe configuration state - Client ID:", config.clientId ? `${config.clientId.substring(0, 8)}...` : "Missing", "Secret status:", config.clientSecret ? "Configured" : "Missing", "Environment:", config.peEnv);

    if (!config.isValid) {
      return NextResponse.json(
        {
          error: "PhonePe credentials are missing or not set in the environment variables.",
          code: "KEYS_MISSING",
        },
        { status: 400 }
      );
    }

    // Generate a unique order ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Generate authorization token
    let token: string;
    try {
      token = await getPhonePeToken(config);
    } catch (tokenErr: any) {
      console.error("Error generating PhonePe token:", tokenErr);
      return NextResponse.json(
        { error: `PhonePe authentication failed: ${tokenErr.message}`, code: "AUTH_FAILED" },
        { status: 500 }
      );
    }

    // Amount in paisa
    const amountInPaisa = Math.round(Number(amount) * 100);

    // Construct return redirect URL
    let baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl || baseUrl.includes("localhost")) {
      if (req.nextUrl.hostname !== "localhost" && req.nextUrl.hostname !== "127.0.0.1") {
        baseUrl = req.nextUrl.origin;
      }
    }
    if (!baseUrl) {
      baseUrl = "https://payments.itfeelsharsh.workers.dev";
    }
    const redirectUrl = `${baseUrl}/api/phonepe/callback?order_id=${orderId}`;

    // Payload for initiating payment
    const payload = {
      merchantOrderId: orderId,
      amount: amountInPaisa,
      expireAfter: 1200,
      paymentFlow: {
        type: "PG_CHECKOUT",
        merchantUrls: {
          redirectUrl: redirectUrl,
        },
      },
      prefillUserLoginDetails: phone
        ? {
            phoneNumber: phone.startsWith("+91") ? phone : `+91${phone}`,
          }
        : undefined,
    };

    console.log("Initiating PhonePe checkout session with payload:", JSON.stringify(payload));

    const response = await fetch(config.payUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `O-Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("PhonePe Pay API error response:", errorText);
      return NextResponse.json(
        { error: `PhonePe Pay API error: ${errorText}`, code: "PHONEPE_ERROR" },
        { status: response.status }
      );
    }

    const resData = await response.json();
    return NextResponse.json({
      orderId: orderId,
      phonepeOrderId: resData.orderId,
      redirectUrl: resData.redirectUrl,
      state: resData.state,
      env: config.peEnv,
    });
  } catch (error: any) {
    console.error("Exception in PhonePe create-order API:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
