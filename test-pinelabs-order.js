const clientId = "d226bcd1-194c-429c-865c-33c366e86719";
const clientSecret = "45603e33249549999d1e42853b707320";
const baseUrl = "https://pluraluat.v2.pinepg.in";
const timestamp = new Date().toISOString();
const requestId = crypto.randomUUID();

async function run() {
  try {
    // 1. Token request
    console.log("Fetching token...");
    const tokenRes = await fetch(`${baseUrl}/api/auth/v1/token`, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "Request-Timestamp": timestamp,
        "Request-ID": requestId,
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
    });

    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;
    console.log("Token retrieved successfully.");

    // 2. Order request
    const txnid = `PL_${Date.now()}_TEST`;
    const orderPayload = {
      merchant_order_reference: txnid,
      order_amount: {
        value: 899900, // paise (8999 INR)
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
      notes: "VoltGlide Obsidian Pro",
      callback_url: `http://localhost:3000/api/pinelabs/callback?txnid=${txnid}`,
      failure_callback_url: `http://localhost:3000/api/pinelabs/callback?txnid=${txnid}&status=failed`,
      purchase_details: {
        customer: {
          email_id: "customer@example.com",
          first_name: "Customer",
          last_name: "Customer",
          mobile_number: "9999999999",
          country_code: "91",
        },
      },
    };

    console.log("Creating order with payload:", JSON.stringify(orderPayload, null, 2));

    const orderRes = await fetch(`${baseUrl}/api/checkout/v1/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Request-ID": crypto.randomUUID(),
        "Request-Timestamp": new Date().toISOString(),
        "accept": "application/json",
      },
      body: JSON.stringify(orderPayload),
    });

    console.log("Status:", orderRes.status);
    console.log("Headers:", Object.fromEntries(orderRes.headers.entries()));
    const orderText = await orderRes.text();
    console.log("Body:", orderText);
  } catch (err) {
    console.error("Error running script:", err);
  }
}

run();
