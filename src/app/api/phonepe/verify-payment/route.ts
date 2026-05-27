import { NextRequest, NextResponse } from "next/server";
import { getPhonePeConfig, getPhonePeToken } from "../phonepe-helper";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required.", code: "MISSING_PARAMS" },
        { status: 400 }
      );
    }

    const config = getPhonePeConfig();

    if (!config.isValid) {
      return NextResponse.json(
        {
          error: "PhonePe credentials are missing or not set in the environment variables.",
          code: "KEYS_MISSING",
        },
        { status: 400 }
      );
    }

    // Generate authorization token
    let token: string;
    try {
      token = await getPhonePeToken(config);
    } catch (tokenErr: any) {
      console.error("Error generating PhonePe token for verification:", tokenErr);
      return NextResponse.json(
        { error: `PhonePe authentication failed: ${tokenErr.message}`, code: "AUTH_FAILED" },
        { status: 500 }
      );
    }

    // Call PhonePe status endpoint
    const url = `${config.statusUrl(orderId)}?details=false`;
    console.log(`Checking PhonePe order status for ID ${orderId} at: ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `O-Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`PhonePe Order Status API error for ${orderId}:`, errorText);
      return NextResponse.json(
        { error: `PhonePe Order Status error: ${errorText}`, code: "PHONEPE_STATUS_ERROR" },
        { status: response.status }
      );
    }

    const resData = await response.json();
    console.log(`PhonePe order status response for ${orderId}:`, JSON.stringify(resData));

    const state = resData.state;
    if (state === "COMPLETED") {
      return NextResponse.json({
        verified: true,
        orderId: orderId,
        state: state,
      });
    } else {
      return NextResponse.json({
        verified: false,
        orderId: orderId,
        state: state,
        error: resData.message || `Order is in ${state} state`,
      });
    }
  } catch (error: any) {
    console.error("Exception in PhonePe verify-payment API:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
