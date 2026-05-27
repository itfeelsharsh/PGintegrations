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

async function verifyOrder(orderId: string, baseUrl: string, clientId: string, clientSecret: string): Promise<{ success: boolean; status?: string; error?: string }> {
  try {
    const timestampAuth = new Date().toISOString();
    const requestIdAuth = generateUUID();

    // 1. Get access token
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
    if (!tokenRes.ok || !tokenData.access_token) {
      return { success: false, error: "Failed to generate PineLabs verification token." };
    }

    const accessToken = tokenData.access_token;
    const timestampOrder = new Date().toISOString();
    const requestIdOrder = generateUUID();

    // 2. Query PineLabs order status
    const orderRes = await fetch(`${baseUrl}/api/checkout/v1/orders/${orderId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Request-ID": requestIdOrder,
        "Request-Timestamp": timestampOrder,
        "accept": "application/json",
      },
    });

    const orderData = await orderRes.json();

    if (!orderRes.ok) {
      return { success: false, error: orderData.message || "Failed to fetch order status from PineLabs." };
    }

    // PineLabs response format: response.data.status or response.status
    const orderStatus = orderData.data?.status || orderData.status;

    // Successful payment states for PineLabs Plural
    const isSuccess = ["PROCESSED", "AUTHORIZED", "CHARGED", "SUCCESS"].includes(orderStatus?.toUpperCase());

    return {
      success: isSuccess,
      status: orderStatus,
    };
  } catch (err: any) {
    console.error("Error verifying PineLabs order:", err);
    return { success: false, error: err.message || "Verification request exception." };
  }
}

export async function POST(req: NextRequest) {
  return handleCallback(req);
}

export async function GET(req: NextRequest) {
  return handleCallback(req);
}

async function handleCallback(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const txnid = searchParams.get("txnid") || "";
  const queryStatus = searchParams.get("status") || "";

  let orderId = "";
  let bodyStatus = "";

  // Extract from query parameters
  orderId = searchParams.get("order_id") || 
            searchParams.get("id") || 
            searchParams.get("plural_order_id") ||
            searchParams.get("parent_txn_id") ||
            searchParams.get("ppc_UniqueMerchantTxnID") ||
            "";

  // Extract from request body if POST
  if (req.method === "POST") {
    try {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const body = await req.json();
        orderId = orderId || body.order_id || body.id || body.plural_order_id || body.ppc_UniqueMerchantTxnID || "";
        bodyStatus = body.status || body.txn_status || "";
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        const formData = await req.formData();
        orderId = orderId || 
                  (formData.get("order_id") as string) || 
                  (formData.get("id") as string) || 
                  (formData.get("plural_order_id") as string) ||
                  (formData.get("ppc_UniqueMerchantTxnID") as string) ||
                  "";
        bodyStatus = (formData.get("status") as string) || (formData.get("txn_status") as string) || "";
      }
    } catch (e) {
      console.warn("Could not parse callback POST body:", e);
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_PINELABS_BASE_URL || "https://pluraluat.v2.pinepg.in";
  let clientId = process.env.NEXT_PUBLIC_PINELABS_CLIENT_ID;
  let clientSecret = process.env.PINELABS_CLIENT_SECRET;
  let testMode = process.env.NEXT_PUBLIC_TEST_MODE === "true";

  try {
    const ctx = getCloudflareContext();
    if (ctx && ctx.env) {
      clientId = clientId || (ctx.env as any).NEXT_PUBLIC_PINELABS_CLIENT_ID;
      clientSecret = clientSecret || (ctx.env as any).PINELABS_CLIENT_SECRET;
      testMode = testMode || (ctx.env as any).NEXT_PUBLIC_TEST_MODE === "true";
    }
  } catch (e) {
    // Ignore if not in Cloudflare env
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

  // 1. If explicit failure parameter or query status is failed, redirect to failure page immediately
  if (queryStatus === "failed" || bodyStatus === "failed") {
    return NextResponse.redirect(`${apiBaseUrl}/checkout?status=failed&error=Payment+was+cancelled+or+failed.`);
  }

  // 2. Perform server-to-server verification if orderId is available
  if (orderId && clientId && clientSecret) {
    const verification = await verifyOrder(orderId, baseUrl, clientId, clientSecret);
    if (verification.success) {
      return NextResponse.redirect(`${apiBaseUrl}/checkout?status=success&paymentId=${orderId}`);
    } else {
      // In test mode, if verification API fails but we didn't get an explicit failure, check if we can fallback to simulate success or show failure
      if (testMode) {
        console.warn("PineLabs verification failed in test mode. Falling back to status success for testing.", verification.error);
        return NextResponse.redirect(`${apiBaseUrl}/checkout?status=success&paymentId=${orderId || txnid}`);
      }
      return NextResponse.redirect(`${apiBaseUrl}/checkout?status=failed&error=Verification+failed:+${encodeURIComponent(verification.error || "unknown status")}`);
    }
  }

  // 3. Fallback for test/mock flows if no orderId was resolved
  if (testMode) {
    return NextResponse.redirect(`${apiBaseUrl}/checkout?status=success&paymentId=${txnid || "mock_pinelabs"}`);
  }

  return NextResponse.redirect(`${apiBaseUrl}/checkout?status=failed&error=No+PineLabs+orderId+found+to+verify+transaction.`);
}
