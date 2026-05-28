import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  return handleCallback(req);
}

export async function GET(req: NextRequest) {
  return handleCallback(req);
}

async function handleCallback(req: NextRequest) {
  const apiBaseUrl = req.nextUrl.origin;

  // Collect all POST fields (PayU posts everything here)
  const pgData: Record<string, any> = {};
  let status = "";
  let txnid = "";
  let mihpayid = "";

  try {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        pgData[key] = value;
      });
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      Object.assign(pgData, body);
    }

    status = (pgData["status"] as string) || "";
    txnid = (pgData["txnid"] as string) || "";
    mihpayid = (pgData["mihpayid"] as string) || "";
  } catch (e) {
    console.warn("Could not parse PayU callback body:", e);
  }

  // Also check query params
  const qStatus = req.nextUrl.searchParams.get("status") || "";
  if (!status) status = qStatus;

  const encodedPgData = encodeURIComponent(JSON.stringify(pgData));
  const paymentId = mihpayid || txnid || "unknown";

  if (status === "success") {
    return NextResponse.redirect(
      `${apiBaseUrl}/checkout?status=success&paymentId=${encodeURIComponent(paymentId)}&gateway=payu&pgData=${encodedPgData}`
    );
  } else if (status === "failure" || status === "failed" || status === "cancel") {
    const errMsg = (pgData["error_Message"] as string) || (pgData["field9"] as string) || "Payment failed or cancelled.";
    return NextResponse.redirect(
      `${apiBaseUrl}/checkout?status=failed&error=${encodeURIComponent(errMsg)}&gateway=payu&pgData=${encodedPgData}`
    );
  } else {
    // Unknown status - pass pgData and let frontend decide
    return NextResponse.redirect(
      `${apiBaseUrl}/checkout?status=failed&error=Unknown+payment+status&gateway=payu&pgData=${encodedPgData}`
    );
  }
}
