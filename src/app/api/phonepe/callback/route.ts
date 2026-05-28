import { NextRequest, NextResponse } from "next/server";
import { getPhonePeConfig, getPhonePeToken } from "../phonepe-helper";

export async function POST(req: NextRequest) {
  return handleCallback(req);
}

export async function GET(req: NextRequest) {
  return handleCallback(req);
}

async function handleCallback(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  let orderId = searchParams.get("order_id") || "";

  // Extract from request body if POST
  if (!orderId && req.method === "POST") {
    try {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const body = await req.json();
        orderId = body.merchantOrderId || body.order_id || "";
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        const formData = await req.formData();
        orderId = (formData.get("merchantOrderId") as string) || (formData.get("order_id") as string) || "";
      }
    } catch (e) {
      console.warn("Could not parse PhonePe callback POST body:", e);
    }
  }

  const apiBaseUrl = req.nextUrl.origin;

  if (!orderId) {
    return NextResponse.redirect(`${apiBaseUrl}/checkout?status=failed&error=Missing+order_id+in+PhonePe+callback.`);
  }

  const config = getPhonePeConfig();

  if (!config.isValid) {
    return NextResponse.redirect(`${apiBaseUrl}/checkout?status=keys_missing`);
  }

  try {
    // Generate authorization token
    const token = await getPhonePeToken(config);

    // Call PhonePe status endpoint
    const url = `${config.statusUrl(orderId)}?details=false`;
    console.log(`Callback verifying PhonePe order ${orderId} at: ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `O-Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Callback PhonePe Status API error:`, errorText);
      return NextResponse.redirect(
        `${apiBaseUrl}/checkout?status=failed&error=${encodeURIComponent("Verification request failed: " + errorText)}`
      );
    }

    const resData = await response.json();
    const state = resData.state;
    const encodedPgData = encodeURIComponent(JSON.stringify(resData));

    if (state === "COMPLETED") {
      return NextResponse.redirect(
        `${apiBaseUrl}/checkout?status=success&paymentId=${orderId}&gateway=phonepe&pgData=${encodedPgData}`
      );
    } else {
      return NextResponse.redirect(
        `${apiBaseUrl}/checkout?status=failed&error=${encodeURIComponent(`Payment status is ${state}`)}&gateway=phonepe&pgData=${encodedPgData}`
      );
    }
  } catch (error: any) {
    console.error("Exception in PhonePe callback handler:", error);
    return NextResponse.redirect(
      `${apiBaseUrl}/checkout?status=failed&error=${encodeURIComponent(error.message || "Internal server error during callback processing")}`
    );
  }
}
