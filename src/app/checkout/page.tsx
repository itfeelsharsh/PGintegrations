"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Script from "next/script";
import { GATEWAYS_CONFIG } from "@/app/gateways-config";

const loadScript = (src: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const GATEWAY_LABELS: Record<string, string> = {
  razorpay: "Razorpay",
  paytm: "Paytm PG",
  payu: "PayU",
  pinelabs: "Pine Labs (Plural)",
  cashfree: "Cashfree",
  phonepe: "PhonePe",
};

const GATEWAY_CREDENTIALS_FIELDS: Record<string, { label: string; key: string; placeholder: string }[]> = {
  razorpay: [
    { label: "Razorpay Key ID", key: "keyId", placeholder: "rzp_test_..." },
    { label: "Razorpay Key Secret", key: "keySecret", placeholder: "..." },
  ],
  paytm: [
    { label: "Paytm Merchant ID (MID)", key: "mid", placeholder: "..." },
    { label: "Paytm Merchant Key", key: "merchantKey", placeholder: "..." },
    { label: "Paytm Website", key: "website", placeholder: "WEBSTAGING" },
    { label: "Paytm Environment", key: "env", placeholder: "staging" },
  ],
  payu: [
    { label: "PayU Key", key: "key", placeholder: "..." },
    { label: "PayU Merchant Salt", key: "salt", placeholder: "..." },
    { label: "PayU Environment", key: "env", placeholder: "test" },
  ],
  pinelabs: [
    { label: "PineLabs Merchant ID (MID)", key: "mid", placeholder: "..." },
    { label: "PineLabs Client ID", key: "clientId", placeholder: "..." },
    { label: "PineLabs Client Secret", key: "clientSecret", placeholder: "..." },
    { label: "PineLabs Environment", key: "env", placeholder: "test" },
  ],
  cashfree: [
    { label: "Cashfree App ID", key: "appId", placeholder: "TEST..." },
    { label: "Cashfree Secret Key", key: "secretKey", placeholder: "..." },
    { label: "Cashfree Environment", key: "env", placeholder: "sandbox" },
  ],
  phonepe: [
    { label: "PhonePe Merchant ID", key: "clientId", placeholder: "M22BPAMTMAVQU_..." },
    { label: "PhonePe Client Secret", key: "clientSecret", placeholder: "..." },
    { label: "PhonePe Client Version", key: "clientVersion", placeholder: "1" },
    { label: "PhonePe Environment", key: "env", placeholder: "sandbox" },
  ],
};

function PgDataTable({ data }: { data: Record<string, any> }) {
  const [showRaw, setShowRaw] = useState(false);
  const entries = Object.entries(data);

  if (entries.length === 0) return null;

  const sensitiveKeys = ["key", "salt", "secret", "password", "token", "auth", "signature", "hash"];
  const isSensitive = (k: string) => sensitiveKeys.some((s) => k.toLowerCase().includes(s));

  return (
    <div style={{ marginTop: "1.5rem" }} className="text-start">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h4 className="h6 text-secondary mb-0 fw-bold">Gateway Response Data</h4>
        <button
          className="btn btn-secondary btn-sm"
          type="button"
          onClick={() => setShowRaw(!showRaw)}
        >
          {showRaw ? "Hide Raw JSON" : "Show Raw JSON"}
        </button>
      </div>

      <table className="table table-bordered table-striped table-hover table-sm" style={{ fontSize: "0.85rem" }}>
        <tbody>
          {entries.map(([k, v]) => (
            <tr key={k}>
              <td className="text-secondary font-monospace" style={{ wordBreak: "break-all", width: "40%" }}>
                {k}
              </td>
              <td className="font-monospace" style={{ wordBreak: "break-all" }}>
                {isSensitive(k) ? "••••••••••••" : typeof v === "object" ? JSON.stringify(v) : String(v)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showRaw && (
        <pre className="bg-light p-3 border text-dark" style={{ fontSize: "0.8rem", maxHeight: "250px", overflow: "auto" }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

function PaymentSuccessCard({
  paymentId,
  amount,
  gateway,
  pgData,
  onReset,
}: {
  paymentId: string;
  amount: string;
  gateway: string;
  pgData: Record<string, any> | null;
  onReset: () => void;
}) {
  const gwLabel = GATEWAY_LABELS[gateway] || (gateway ? gateway.toUpperCase() : "Unknown Gateway");
  const ts = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  return (
    <div className="container py-5 text-dark">
      <div className="mx-auto" style={{ maxWidth: "650px" }}>
        <div className="card border-success">
          <div className="card-header bg-success text-white py-3">
            <h3 className="card-title h5 mb-0 fw-bold">Payment Successful</h3>
          </div>
          <div className="card-body p-4 bg-white">
            <div className="alert alert-success">
              <strong>Success!</strong> Your payment has been verified server-side.
            </div>

            <table className="table table-bordered">
              <tbody>
                <tr>
                  <th style={{ width: "35%" }}>Payment ID</th>
                  <td><code className="text-dark">{paymentId || "—"}</code></td>
                </tr>
                <tr>
                  <th>Amount Paid</th>
                  <td><strong>₹{Number(amount).toLocaleString("en-IN")}.00</strong></td>
                </tr>
                <tr>
                  <th>Gateway</th>
                  <td><span className="badge bg-primary">{gwLabel}</span></td>
                </tr>
                <tr>
                  <th>Timestamp</th>
                  <td>{ts}</td>
                </tr>
              </tbody>
            </table>

            {pgData && Object.keys(pgData).length > 0 && <PgDataTable data={pgData} />}

            <div className="mt-4 d-flex gap-2">
              <Link href="/" className="btn btn-success">
                Continue Shopping
              </Link>
              <button onClick={onReset} className="btn btn-outline-secondary" type="button">
                Make Another Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentFailedCard({
  errorMessage,
  gateway,
  pgData,
  onRetry,
}: {
  errorMessage: string;
  gateway: string;
  pgData: Record<string, any> | null;
  onRetry: () => void;
}) {
  const gwLabel = GATEWAY_LABELS[gateway] || (gateway ? gateway.toUpperCase() : "Unknown Gateway");
  const ts = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  return (
    <div className="container py-5 text-dark">
      <div className="mx-auto" style={{ maxWidth: "650px" }}>
        <div className="card border-danger">
          <div className="card-header bg-danger text-white py-3">
            <h3 className="card-title h5 mb-0 fw-bold">Payment Failed</h3>
          </div>
          <div className="card-body p-4 bg-white">
            <div className="alert alert-danger">
              <strong>Error!</strong> {errorMessage || "The payment transaction could not be completed. No charges were made."}
            </div>

            <table className="table table-bordered">
              <tbody>
                <tr>
                  <th style={{ width: "35%" }}>Gateway</th>
                  <td><span className="badge bg-secondary">{gwLabel}</span></td>
                </tr>
                <tr>
                  <th>Timestamp</th>
                  <td>{ts}</td>
                </tr>
              </tbody>
            </table>

            {pgData && Object.keys(pgData).length > 0 && <PgDataTable data={pgData} />}

            <div className="mt-4 d-flex gap-2">
              <button onClick={onRetry} className="btn btn-danger" type="button">
                Try Again
              </button>
              <Link href="/" className="btn btn-outline-secondary">
                Cancel & Return
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const productName = searchParams.get("product") || "VoltGlide Obsidian Pro";
  const amount = searchParams.get("amount") || "8999";

  const initialStatus = searchParams.get("status") || "idle";
  const initialPaymentId = searchParams.get("paymentId") || "";
  const initialError = searchParams.get("error") || "";
  const gatewayParam = searchParams.get("gateway") || "";

  const pgDataParam = searchParams.get("pgData");
  let pgResponseData: Record<string, any> | null = null;
  if (pgDataParam) {
    try {
      pgResponseData = JSON.parse(decodeURIComponent(pgDataParam));
    } catch (e) {
      console.error("Failed to parse pgData", e);
    }
  }

  const [selectedGateway, setSelectedGateway] = useState(gatewayParam);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "success" | "failed" | "keys_missing">(
    initialStatus === "success" || initialStatus === "failed" || initialStatus === "keys_missing" ? (initialStatus as any) : "idle"
  );
  const [paymentId, setPaymentId] = useState(initialPaymentId);
  const [errorMessage, setErrorMessage] = useState(initialError);

  const [formData, setFormData] = useState({
    name: "Narinder Gandhi",
    email: "narinder.gandhi@gmail.gov",
    phone: "4876543210",
    address: "Prahlad Nagar, Satellite",
    city: "Amdavad",
    state: "Gujarat",
    zip: "380015",
  });

  const [customCreds, setCustomCreds] = useState<Record<string, Record<string, string>>>({});
  const [isCredsOpen, setIsCredsOpen] = useState(false);

  // Load custom credentials from localStorage on mount
  useEffect(() => {
    const loaded: Record<string, Record<string, string>> = {};
    Object.keys(GATEWAY_CREDENTIALS_FIELDS).forEach((gw) => {
      const stored = localStorage.getItem(`pg_override_${gw}`);
      if (stored) {
        try {
          loaded[gw] = JSON.parse(stored);
        } catch (_) {}
      }
    });
    setCustomCreds(loaded);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getHeadersForGateway = (gateway: string) => {
    const gwCreds = customCreds[gateway];
    if (!gwCreds) return {};
    const headers: Record<string, string> = {};
    Object.entries(gwCreds).forEach(([k, v]) => {
      if (v) {
        headers[`x-${gateway}-${k.replace(/([A-Z])/g, "-$1").toLowerCase()}`] = v;
      }
    });
    return headers;
  };

  const handleCredChange = (gateway: string, key: string, value: string) => {
    setCustomCreds((prev) => {
      const updatedGateway = { ...(prev[gateway] || {}), [key]: value };
      const updated = { ...prev, [gateway]: updatedGateway };
      localStorage.setItem(`pg_override_${gateway}`, JSON.stringify(updatedGateway));
      return updated;
    });
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGateway) {
      alert("Please select a payment gateway.");
      return;
    }

    const config = GATEWAYS_CONFIG[selectedGateway as keyof typeof GATEWAYS_CONFIG];
    if (!config?.enabled) {
      alert("This payment gateway is currently disabled.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

    const overrideHeaders = getHeadersForGateway(selectedGateway);

    if (selectedGateway === "razorpay") {
      try {
        const orderRes = await fetch("/api/razorpay/create-order", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            ...overrideHeaders
          },
          body: JSON.stringify({ amount, currency: "INR" }),
        });

        const orderData = await orderRes.json();

        if (!orderRes.ok) {
          if (orderData.code === "KEYS_MISSING") {
            setPaymentStatus("keys_missing");
          } else {
            setPaymentStatus("failed");
            setErrorMessage(orderData.error || "Order creation failed.");
          }
          setIsProcessing(false);
          return;
        }

        if (typeof window === "undefined" || !(window as any).Razorpay) {
          setPaymentStatus("failed");
          setErrorMessage("Razorpay SDK failed to load.");
          setIsProcessing(false);
          return;
        }

        const options = {
          key: orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "Payment Gateway Integration",
          description: productName,
          order_id: orderData.id,
          prefill: {
            name: formData.name,
            email: formData.email,
            contact: formData.phone,
          },
          config: {
            display: {
              blocks: {
                all_methods: {
                  name: "All Payment Methods",
                  instruments: [
                    { method: "upi" },
                    { method: "card" },
                    { method: "netbanking" },
                    { method: "wallet" },
                    { method: "emi" },
                    { method: "cardless_emi" },
                    { method: "paylater" },
                    { method: "app" },
                    { method: "bank_transfer" }
                  ]
                }
              },
              sequence: ["block.all_methods"],
              preferences: {
                show_default_blocks: true
              }
            }
          },
          handler: async function (response: any) {
            setIsProcessing(true);
            try {
              const verifyRes = await fetch("/api/razorpay/verify-payment", {
                method: "POST",
                headers: { 
                  "Content-Type": "application/json",
                  ...overrideHeaders
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              const verifyData = await verifyRes.json();

              if (verifyRes.ok && verifyData.verified) {
                setPaymentId(response.razorpay_payment_id);
                setPaymentStatus("success");
              } else {
                setPaymentStatus("failed");
                setErrorMessage(verifyData.error || "Verification failed.");
              }
            } catch (err: any) {
              setPaymentStatus("failed");
              setErrorMessage(err.message || "Verification request failed.");
            } finally {
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            },
          },
          theme: {
            color: "#212529",
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } catch (err: any) {
        setPaymentStatus("failed");
        setErrorMessage(err.message || "An unexpected error occurred.");
        setIsProcessing(false);
      }
    } else if (selectedGateway === "paytm") {
      try {
        const orderRes = await fetch("/api/paytm/create-order", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            ...overrideHeaders
          },
          body: JSON.stringify({ amount }),
        });

        const orderData = await orderRes.json();

        if (!orderRes.ok) {
          if (orderData.code === "KEYS_MISSING") {
            setPaymentStatus("keys_missing");
          } else {
            setPaymentStatus("failed");
            setErrorMessage(orderData.error || "Order creation failed.");
          }
          setIsProcessing(false);
          return;
        }

        const paytmMid = orderData.mid || process.env.NEXT_PUBLIC_PAYTM_MID;
        const paytmEnv = orderData.env || process.env.NEXT_PUBLIC_PAYTM_ENV || "staging";
        const host = paytmEnv === "staging" ? "securestage.paytmpayments.com" : "secure.paytmpayments.com";
        const scriptUrl = `https://${host}/merchantpgpui/checkoutjs/merchants/${paytmMid}.js`;

        const scriptLoaded = await loadScript(scriptUrl);

        if (!scriptLoaded || !(window as any).Paytm || !(window as any).Paytm.CheckoutJS) {
          setPaymentStatus("failed");
          setErrorMessage("Paytm JS SDK failed to load.");
          setIsProcessing(false);
          return;
        }

        const config = {
          root: "",
          flow: "DEFAULT",
          data: {
            orderId: orderData.orderId,
            token: orderData.txnToken,
            tokenType: "TXN_TOKEN",
            amount: orderData.amount,
          },

          handler: {
            transactionStatus: async function (paymentStatus: any) {
              console.log("Paytm transactionStatus callback:", paymentStatus);
              setIsProcessing(true);
              try {
                const verifyRes = await fetch("/api/paytm/verify-payment", {
                  method: "POST",
                  headers: { 
                    "Content-Type": "application/json",
                    ...overrideHeaders
                  },
                  body: JSON.stringify({
                    orderId: paymentStatus.ORDERID,
                  }),
                });

                const verifyData = await verifyRes.json();

                if (verifyRes.ok && verifyData.verified) {
                  setPaymentId(verifyData.txnId || paymentStatus.TXNID || orderData.orderId);
                  setPaymentStatus("success");
                } else {
                  setPaymentStatus("failed");
                  setErrorMessage(verifyData.error || "Verification failed.");
                }
              } catch (err: any) {
                setPaymentStatus("failed");
                setErrorMessage(err.message || "Verification request failed.");
              } finally {
                setIsProcessing(false);
                if ((window as any).Paytm && (window as any).Paytm.CheckoutJS) {
                  (window as any).Paytm.CheckoutJS.close();
                }
              }
            },
            notifyMerchant: function (eventName: string, data: any) {
              console.log("Paytm notifyMerchant event:", eventName, data);
              if (eventName === "MERCHANT_CLOSED" || eventName === "CLOSE") {
                setIsProcessing(false);
              }
            },
          },
          merchant: {
            mid: paytmMid,
            redirect: false,
          },
        };

        const checkout = (window as any).Paytm.CheckoutJS;
        checkout.onLoad(function executeAfterCompleteLoad() {
          checkout.init(config)
            .then(function onSuccess() {
              checkout.invoke();
            })
            .catch(function onError(error: any) {
              console.error("Paytm CheckoutJS init error:", error);
              setPaymentStatus("failed");
              setErrorMessage(error.message || "Failed to initialize Paytm Checkout.");
              setIsProcessing(false);
            });
        });
      } catch (err: any) {
        setPaymentStatus("failed");
        setErrorMessage(err.message || "An unexpected error occurred.");
        setIsProcessing(false);
      }
    } else if (selectedGateway === "payu") {
      try {
        const orderRes = await fetch("/api/payu/create-order", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            ...overrideHeaders
          },
          body: JSON.stringify({
            amount,
            productInfo: productName,
            firstname: formData.name || "Customer",
            email: formData.email || "customer@example.com",
            phone: formData.phone || "9999999999",
          }),
        });

        const orderData = await orderRes.json();

        if (!orderRes.ok) {
          if (orderData.code === "KEYS_MISSING") {
            setPaymentStatus("keys_missing");
          } else {
            setPaymentStatus("failed");
            setErrorMessage(orderData.error || "Order creation failed.");
          }
          setIsProcessing(false);
          return;
        }

        const payuEnv = orderData.env || process.env.NEXT_PUBLIC_PAYU_ENV || "test";
        const scriptUrl = payuEnv === "production" || payuEnv === "live"
          ? "https://jssdk.payu.in/bolt/bolt.min.js"
          : "https://jssdk-uat.payu.in/bolt/bolt.min.js";

        const scriptLoaded = await loadScript(scriptUrl);

        if (!scriptLoaded || !(window as any).bolt) {
          setPaymentStatus("failed");
          setErrorMessage("PayU Bolt JS SDK failed to load.");
          setIsProcessing(false);
          return;
        }

        (window as any).bolt.launch(
          {
            key: orderData.key,
            txnid: orderData.txnid,
            hash: orderData.hash,
            amount: orderData.amount,
            firstname: orderData.firstname,
            email: orderData.email,
            phone: orderData.phone,
            productinfo: orderData.productinfo,
            surl: orderData.surl,
            furl: orderData.furl,
          },
          {
            responseHandler: async function (BOLT: any) {
              console.log("PayU Bolt response:", BOLT);
              setIsProcessing(true);
              
              if (BOLT.response.txnStatus === "SUCCESS") {
                try {
                  const verifyRes = await fetch("/api/payu/verify-payment", {
                    method: "POST",
                    headers: { 
                      "Content-Type": "application/json",
                      ...overrideHeaders
                    },
                    body: JSON.stringify({
                      txnid: BOLT.response.txnid,
                    }),
                  });

                  const verifyData = await verifyRes.json();

                  if (verifyRes.ok && verifyData.verified) {
                    setPaymentId(verifyData.mihpayid || BOLT.response.mihpayid || BOLT.response.txnid);
                    setPaymentStatus("success");
                  } else {
                    setPaymentStatus("failed");
                    setErrorMessage(verifyData.error || "Verification failed.");
                  }
                } catch (err: any) {
                  setPaymentStatus("failed");
                  setErrorMessage(err.message || "Verification request failed.");
                } finally {
                  setIsProcessing(false);
                }
              } else {
                setPaymentStatus("failed");
                setErrorMessage(BOLT.response.error_Message || "Payment failed or cancelled.");
                setIsProcessing(false);
              }
            },
            catchException: function (BOLT: any) {
              console.error("PayU Bolt exception:", BOLT);
              setPaymentStatus("failed");
              setErrorMessage(BOLT.message || "An exception occurred during transaction.");
              setIsProcessing(false);
            },
          }
        );
      } catch (err: any) {
        setPaymentStatus("failed");
        setErrorMessage(err.message || "An unexpected error occurred.");
        setIsProcessing(false);
      }
    } else if (selectedGateway === "pinelabs") {
      try {
        const orderRes = await fetch("/api/pinelabs/create-order", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            ...overrideHeaders
          },
          body: JSON.stringify({
            amount,
            productInfo: productName,
            firstname: formData.name || "Customer",
            email: formData.email || "customer@example.com",
            phone: formData.phone || "9999999999",
          }),
        });

        const orderData = await orderRes.json();

        if (!orderRes.ok) {
          if (orderData.code === "KEYS_MISSING") {
            setPaymentStatus("keys_missing");
          } else {
            setPaymentStatus("failed");
            setErrorMessage(orderData.error || "Order creation failed.");
          }
          setIsProcessing(false);
          return;
        }

        if (orderData.redirect_url) {
          window.location.href = orderData.redirect_url;
        } else {
          setPaymentStatus("failed");
          setErrorMessage("Failed to retrieve redirect URL.");
          setIsProcessing(false);
        }
      } catch (err: any) {
        setPaymentStatus("failed");
        setErrorMessage(err.message || "An unexpected error occurred.");
        setIsProcessing(false);
      }
    } else if (selectedGateway === "cashfree") {
      try {
        const orderRes = await fetch("/api/cashfree/create-order", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            ...overrideHeaders
          },
          body: JSON.stringify({
            amount,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
          }),
        });

        const orderData = await orderRes.json();

        if (!orderRes.ok) {
          if (orderData.code === "KEYS_MISSING") {
            setPaymentStatus("keys_missing");
          } else {
            setPaymentStatus("failed");
            setErrorMessage(orderData.error || "Order creation failed.");
          }
          setIsProcessing(false);
          return;
        }

        const scriptLoaded = await loadScript("https://sdk.cashfree.com/js/v3/cashfree.js");

        if (!scriptLoaded || !(window as any).Cashfree) {
          setPaymentStatus("failed");
          setErrorMessage("Cashfree SDK failed to load.");
          setIsProcessing(false);
          return;
        }

        const cashfree = (window as any).Cashfree({
          mode: orderData.env === "production" ? "production" : "sandbox",
        });

        cashfree.checkout({
          paymentSessionId: orderData.payment_session_id,
          redirectTarget: "_self",
        });
      } catch (err: any) {
        setPaymentStatus("failed");
        setErrorMessage(err.message || "An unexpected error occurred.");
        setIsProcessing(false);
      }
    } else if (selectedGateway === "phonepe") {
      try {
        const orderRes = await fetch("/api/phonepe/create-order", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            ...overrideHeaders
          },
          body: JSON.stringify({
            amount,
            phone: formData.phone,
          }),
        });

        const orderData = await orderRes.json();

        if (!orderRes.ok) {
          if (orderData.code === "KEYS_MISSING") {
            setPaymentStatus("keys_missing");
          } else {
            setPaymentStatus("failed");
            setErrorMessage(orderData.error || "Order creation failed.");
          }
          setIsProcessing(false);
          return;
        }

        const phonepeEnv = orderData.env || process.env.NEXT_PUBLIC_PHONEPE_ENV || "sandbox";
        const scriptUrl = phonepeEnv === "production" || phonepeEnv === "live"
          ? "https://mercury.phonepe.com/web/bundle/checkout.js"
          : "https://mercury-stg.phonepe.com/web/bundle/checkout.js";

        const scriptLoaded = await loadScript(scriptUrl);

        if (!scriptLoaded || !(window as any).PhonePeCheckout) {
          setPaymentStatus("failed");
          setErrorMessage("PhonePe SDK failed to load.");
          setIsProcessing(false);
          return;
        }

        (window as any).PhonePeCheckout.transact({
          tokenUrl: orderData.redirectUrl,
          type: "IFRAME",
          callback: async function (response: any) {
            console.log("PhonePe transact callback:", response);
            if (response === "USER_CANCEL") {
              setIsProcessing(false);
            } else if (response === "CONCLUDED") {
              setIsProcessing(true);
              try {
                const verifyRes = await fetch("/api/phonepe/verify-payment", {
                  method: "POST",
                  headers: { 
                    "Content-Type": "application/json",
                    ...overrideHeaders
                  },
                  body: JSON.stringify({
                    orderId: orderData.orderId,
                  }),
                });

                const verifyData = await verifyRes.json();

                if (verifyRes.ok && verifyData.verified) {
                  setPaymentId(orderData.orderId);
                  setPaymentStatus("success");
                } else {
                  setPaymentStatus("failed");
                  setErrorMessage(verifyData.error || "Verification failed.");
                }
              } catch (err: any) {
                setPaymentStatus("failed");
                setErrorMessage(err.message || "Verification request failed.");
              } finally {
                setIsProcessing(false);
              }
            }
          },
        });
      } catch (err: any) {
        setPaymentStatus("failed");
        setErrorMessage(err.message || "An unexpected error occurred.");
        setIsProcessing(false);
      }
    } else {
      setTimeout(() => {
        setIsProcessing(false);
        alert(
          `Demo mode: Payment of ₹${Number(amount).toLocaleString("en-IN")} via ${selectedGateway.toUpperCase()} triggered. Razorpay, Paytm, PayU, PineLabs, Cashfree, and PhonePe are wired for live testing.`
        );
      }, 1000);
    }
  };

  const handleSimulateMockSuccess = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setPaymentId(`pay_mock_${Math.random().toString(36).substring(2, 10)}`);
      setPaymentStatus("success");
      setIsProcessing(false);
    }, 500);
  };

  const gateways: { id: string; name: string; badge?: string }[] = [
    {
      id: "razorpay",
      name: "Razorpay",
    },
    {
      id: "paytm",
      name: "PayTM PG",
    },
    {
      id: "payu",
      name: "PayU",
    },
    {
      id: "pinelabs",
      name: "PineLabs",
    },
    {
      id: "cashfree",
      name: "Cashfree",
    },
    {
      id: "phonepe",
      name: "PhonePe PG",
    },
  ];

  const resetToIdle = () => {
    setPaymentStatus("idle");
    setPaymentId("");
    setErrorMessage("");
  };

  if (paymentStatus === "success") {
    return (
      <PaymentSuccessCard
        paymentId={paymentId}
        amount={amount}
        gateway={selectedGateway}
        pgData={pgResponseData}
        onReset={resetToIdle}
      />
    );
  }

  if (paymentStatus === "keys_missing") {
    const isCashfree = selectedGateway === "cashfree";
    const isPhonepe = selectedGateway === "phonepe";
    const isPaytm = selectedGateway === "paytm";
    const isPayu = selectedGateway === "payu";
    const isPinelabs = selectedGateway === "pinelabs";

    const keysMessage = isCashfree
      ? "Cashfree API credentials are not set in the environment files. Please configure the variables below or enter your test keys below to test the live SDK."
      : isPhonepe
      ? "PhonePe API credentials are not set in the environment files. Please configure the variables below or enter your test keys below to test the live SDK."
      : isPaytm
      ? "Paytm API credentials are not set in the environment files. Please configure the variables below or enter your test keys below to test the live SDK."
      : isPayu
      ? "PayU API credentials are not set in the environment files. Please configure the variables below or enter your test keys below to test the live SDK."
      : isPinelabs
      ? "PineLabs API credentials are not set in the environment files. Please configure the variables below or enter your test keys below to test the live SDK."
      : "Razorpay API credentials are not set in the `.env` file. Please configure the variables below or enter your test keys below to test the live SDK.";

    const vars = isCashfree
      ? ["NEXT_PUBLIC_CASHFREE_APP_ID=TESTxxxxxx", "CASHFREE_SECRET_KEY=cfsk_ma_xxxxxx", "NEXT_PUBLIC_CASHFREE_ENV=sandbox"]
      : isPhonepe
      ? ["PHONEPE_CLIENT_ID=M22BPAMTMAVQU_xxxxxx", "PHONEPE_CLIENT_SECRET=xxxxxx", "NEXT_PUBLIC_PHONEPE_CLIENT_VERSION=1", "NEXT_PUBLIC_PHONEPE_ENV=sandbox"]
      : isPaytm
      ? ["NEXT_PUBLIC_PAYTM_MID=xxxxxx", "PAYTM_MERCHANT_KEY=xxxxxx", "NEXT_PUBLIC_PAYTM_WEBSITE=WEBSTAGING", "NEXT_PUBLIC_PAYTM_ENV=staging"]
      : isPayu
      ? ["NEXT_PUBLIC_PAYU_KEY=xxxxxx", "PAYU_MERCHANT_SALT=xxxxxx", "NEXT_PUBLIC_PAYU_ENV=test"]
      : isPinelabs
      ? ["NEXT_PUBLIC_PINELABS_CLIENT_ID=xxxxxx", "PINELABS_CLIENT_SECRET=xxxxxx", "NEXT_PUBLIC_PINELABS_MID=xxxxxx", "NEXT_PUBLIC_PINELABS_ENV=test"]
      : ["NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxx", "RAZORPAY_KEY_SECRET=xxxxxx"];

    return (
      <div className="container py-5 text-dark">
        <div className="mx-auto" style={{ maxWidth: "600px" }}>
          <div className="card border-warning">
            <div className="card-header bg-warning text-dark py-3">
              <h3 className="card-title h5 mb-0 fw-bold">Environment Keys Missing</h3>
            </div>
            <div className="card-body p-4 bg-white text-start">
              <p className="small mb-4">{keysMessage}</p>

              <div className="bg-light p-3 rounded text-start mb-4 font-monospace small border">
                {vars.map((v) => <div key={v}>{v}</div>)}
              </div>

              {/* Quick Config override inside warning screen */}
              {selectedGateway && GATEWAY_CREDENTIALS_FIELDS[selectedGateway] && (
                <div className="card mb-4 border bg-light">
                  <div className="card-body p-3">
                    <h6 className="fw-bold mb-3 small text-secondary">Local Overrides for {GATEWAY_LABELS[selectedGateway]}</h6>
                    <div className="row g-2">
                      {GATEWAY_CREDENTIALS_FIELDS[selectedGateway].map((field) => (
                        <div key={field.key} className="col-12">
                          <label className="form-label small fw-semibold text-secondary mb-1">{field.label}</label>
                          <input
                            type="text"
                            className="form-control form-control-sm font-monospace"
                            placeholder={field.placeholder}
                            value={customCreds[selectedGateway]?.[field.key] || ""}
                            onChange={(e) => handleCredChange(selectedGateway, field.key, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="d-grid gap-2">
                <button
                  onClick={() => {
                    setPaymentStatus("idle");
                  }}
                  className="btn btn-primary py-2"
                  type="button"
                >
                  Retry with Local Keys
                </button>
                <button
                  onClick={handleSimulateMockSuccess}
                  disabled={isProcessing}
                  className="btn btn-warning text-dark py-2"
                  type="button"
                >
                  {isProcessing ? "Processing..." : "Simulate Successful Payment (Mock)"}
                </button>
                <button
                  onClick={resetToIdle}
                  className="btn btn-outline-secondary py-2"
                  type="button"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === "failed") {
    return (
      <PaymentFailedCard
        errorMessage={errorMessage}
        gateway={selectedGateway}
        pgData={pgResponseData}
        onRetry={resetToIdle}
      />
    );
  }

  return (
    <div className="container">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <h2 className="fw-bold mb-4">Checkout</h2>

      <form onSubmit={handlePay}>
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card shadow-sm border mb-4 bg-white">
              <div className="card-header bg-white py-3">
                <h5 className="mb-0 fw-bold">1. Delivery Info</h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary">Phone Number</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">+91</span>
                      <input
                        type="tel"
                        name="phone"
                        className="form-control"
                        pattern="[0-9]{10}"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-semibold text-secondary">Email</label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-semibold text-secondary">Address</label>
                    <input
                      type="text"
                      name="address"
                      className="form-control"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold text-secondary">City</label>
                    <input
                      type="text"
                      name="city"
                      className="form-control"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold text-secondary">State</label>
                    <input
                      type="text"
                      name="state"
                      className="form-control"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold text-secondary">PIN</label>
                    <input
                      type="text"
                      name="zip"
                      className="form-control"
                      pattern="[0-9]{6}"
                      value={formData.zip}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card shadow-sm border bg-white mb-4">
              <div className="card-header bg-white py-3">
                <h5 className="mb-0 fw-bold">2. Payment Method</h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  {gateways.map((gw) => {
                    const config = GATEWAYS_CONFIG[gw.id as keyof typeof GATEWAYS_CONFIG];
                    const isEnabled = config?.enabled ?? false;

                    return (
                      <div key={gw.id} className="col-md-6">
                        <label className={`w-100 h-100 m-0 ${!isEnabled ? "opacity-50" : ""}`}>
                          <input
                            type="radio"
                            name="gateway"
                            value={gw.id}
                            className="gateway-radio d-none"
                            checked={selectedGateway === gw.id}
                            disabled={!isEnabled}
                            onChange={() => isEnabled && setSelectedGateway(gw.id)}
                          />
                          <div className={`gateway-card border rounded p-3 h-100 d-flex flex-column justify-content-between gateway-card-inner bg-white ${!isEnabled ? "bg-light text-muted border-dashed" : ""}`} style={{ cursor: isEnabled ? "pointer" : "not-allowed" }}>
                            <div>
                              <div className="d-flex align-items-center justify-content-between mb-2">
                                <div className="d-flex align-items-center">
                                  <h6 className="mb-0 fw-bold text-dark">{gw.name}</h6>
                                </div>
                                <span className={`badge ${!isEnabled ? "bg-light text-muted border" : gw.id === 'razorpay' ? 'bg-primary' : 'bg-light text-dark'} border small`}>
                                  {isEnabled ? gw.badge : "Under Implementation"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Collapsible local credential configuration drawer */}
            <div className="card shadow-sm border bg-white mb-4">
              <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center cursor-pointer" onClick={() => setIsCredsOpen(!isCredsOpen)} style={{ cursor: "pointer" }}>
                <h5 className="mb-0 fw-bold text-dark">⚙️ Developer Config: Sandbox Credentials Overrides</h5>
                <span className="text-secondary small">{isCredsOpen ? "Hide" : "Show"}</span>
              </div>
              {isCredsOpen && (
                <div className="card-body border-top">
                  <p className="text-secondary small mb-3">
                    Input keys here to test checkout using your own sandbox keys instead of setting system environment variables. Saved to browser storage.
                  </p>
                  <div className="row g-4">
                    {gateways.map((gw) => {
                      const fields = GATEWAY_CREDENTIALS_FIELDS[gw.id];
                      if (!fields) return null;

                      return (
                        <div key={gw.id} className="col-md-6 border-bottom pb-3">
                          <h6 className="fw-bold mb-2 text-primary small">{gw.name} Configuration</h6>
                          <div className="row g-2">
                            {fields.map((field) => (
                              <div key={field.key} className="col-12">
                                <label className="form-label small fw-semibold text-secondary mb-1" style={{ fontSize: "0.75rem" }}>{field.label}</label>
                                <input
                                  type="text"
                                  className="form-control form-control-sm font-monospace"
                                  placeholder={field.placeholder}
                                  value={customCreds[gw.id]?.[field.key] || ""}
                                  onChange={(e) => handleCredChange(gw.id, field.key, e.target.value)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card shadow-sm border bg-white position-sticky" style={{ top: "20px" }}>
              <div className="card-header bg-white py-3">
                <h5 className="mb-0 fw-bold">Order Summary</h5>
              </div>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 className="mb-0 fw-bold text-truncate" style={{ maxWidth: "180px" }}>{productName}</h6>
                    <small className="text-muted">Qty: 1 &bull; Size: UK 9</small>
                  </div>
                  <span className="fw-semibold">₹{Number(amount).toLocaleString("en-IN")}.00</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between small mb-2 text-secondary">
                  <span>Subtotal</span>
                  <span>₹{Number(amount).toLocaleString("en-IN")}.00</span>
                </div>
                <div className="d-flex justify-content-between small mb-2 text-secondary">
                  <span>Shipping</span>
                  <span className="text-success">FREE</span>
                </div>
                <div className="d-flex justify-content-between small mb-3 text-secondary">
                  <span>GST (18% Incl.)</span>
                  <span>₹{Math.round(Number(amount) * 0.18).toLocaleString("en-IN")}.00</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <span className="fw-bold">Total</span>
                  <span className="fs-4 fw-bold text-primary">₹{Number(amount).toLocaleString("en-IN")}.00</span>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || !selectedGateway}
                  className="btn btn-dark btn-lg w-100 py-3 d-flex align-items-center justify-content-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {selectedGateway 
                          ? `Test using ${gateways.find(g => g.id === selectedGateway)?.name}` 
                          : "Select Payment Gateway"
                        }
                      </span>
                    </>
                  )}
                </button>

                <div className="text-center mt-3">
                  <Link href="/" className="text-decoration-none small text-secondary">
                    Cancel and return
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="container text-center py-5">
        <div className="spinner-border text-dark" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
