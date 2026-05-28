import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

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
        orderId = body.order_id || "";
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        const formData = await req.formData();
        orderId = (formData.get("order_id") as string) || "";
      }
    } catch (e) {
      console.warn("Could not parse Cashfree callback POST body:", e);
    }
  }

  const apiBaseUrl = req.nextUrl.origin;


  if (!orderId) {
    return NextResponse.redirect(`${apiBaseUrl}/checkout?status=failed&error=Missing+order_id+in+callback.`);
  }

  let appId = process.env.NEXT_PUBLIC_CASHFREE_APP_ID;
  let secretKey = process.env.CASHFREE_SECRET_KEY;
  let cfEnv = process.env.NEXT_PUBLIC_CASHFREE_ENV || "sandbox";

  try {
    const ctx = getCloudflareContext();
    if (ctx && ctx.env) {
      appId = appId || (ctx.env as any).NEXT_PUBLIC_CASHFREE_APP_ID;
      secretKey = secretKey || (ctx.env as any).CASHFREE_SECRET_KEY;
      cfEnv = cfEnv || (ctx.env as any).NEXT_PUBLIC_CASHFREE_ENV || "sandbox";
    }
  } catch (e) {
    // Ignore if not in Cloudflare environment
  }

  if (appId === "undefined" || appId === "null") appId = undefined;
  if (secretKey === "undefined" || secretKey === "null") secretKey = undefined;

  if (!appId || !secretKey) {
    return NextResponse.redirect(
      `${apiBaseUrl}/checkout?status=keys_missing`
    );
  }

  try {
    const host = cfEnv === "production" ? "api.cashfree.com" : "sandbox.cashfree.com";
    const apiEndpoint = `https://${host}/pg/orders/${orderId}`;

    const verificationRes = await fetch(apiEndpoint, {
      method: "GET",
      headers: {
        "x-api-version": "2023-08-01",
        "x-client-id": appId,
        "x-client-secret": secretKey,
      },
    });

    if (!verificationRes.ok) {
      const errorText = await verificationRes.text();
      console.error("Cashfree order verification API error:", errorText);
      return NextResponse.redirect(
        `${apiBaseUrl}/checkout?status=failed&error=Verification+request+failed.`
      );
    }

    const orderData = await verificationRes.json();
    const orderStatus = orderData.order_status || "";
    const encodedPgData = encodeURIComponent(JSON.stringify(orderData));

    if (orderStatus.toUpperCase() === "PAID") {
      return NextResponse.redirect(
        `${apiBaseUrl}/checkout?status=success&paymentId=${orderId}&gateway=cashfree&pgData=${encodedPgData}`
      );
    } else {
      return NextResponse.redirect(
        `${apiBaseUrl}/checkout?status=failed&error=Payment+status+is+${encodeURIComponent(orderStatus)}&gateway=cashfree&pgData=${encodedPgData}`
      );
    }
  } catch (error: any) {
    console.error("Exception in Cashfree callback handler:", error);
    return NextResponse.redirect(
      `${apiBaseUrl}/checkout?status=failed&error=${encodeURIComponent(error.message || "Internal server error during verification")}`
    );
  }
}
