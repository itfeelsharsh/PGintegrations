"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const productName = searchParams.get("product") || "VoltGlide Obsidian Pro";
  const amount = searchParams.get("amount") || "8999";

  const [selectedGateway, setSelectedGateway] = useState("razorpay");
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "9876543210",
    address: "123, MG Road, Indiranagar",
    city: "Bengaluru",
    state: "Karnataka",
    zip: "560038",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate redirection/integration trigger
    setTimeout(() => {
      setIsProcessing(false);
      alert(
        `[Demo] Initiating payment of ₹${Number(amount).toLocaleString("en-IN")} via ${selectedGateway.toUpperCase()} for customer ${formData.name} (${formData.phone}).\n\n(Actual payment gateway integrations will be set up in the next steps!)`
      );
    }, 1500);
  };

  const gateways = [
    {
      id: "razorpay",
      name: "Razorpay",
      icon: "bi-shield-check text-primary",
      badge: "Popular",
      desc: "Fast checkout via Cards, Netbanking, UPI & Wallets.",
    },
    {
      id: "paytm",
      name: "Paytm PG",
      icon: "bi-wallet2 text-info",
      badge: "UPI Focus",
      desc: "Instant UPI, Paytm Wallet, Postpaid, and Netbanking.",
    },
    {
      id: "payu",
      name: "PayU India",
      icon: "bi-credit-card text-success",
      badge: "Enterprise",
      desc: "Highly reliable card routing and multi-tier EMI checkout.",
    },
    {
      id: "pinelabs",
      name: "PineLabs Plural",
      icon: "bi-building-fill text-warning",
      badge: "Brand EMIs",
      desc: "Best for Brand EMIs, Debit/Credit Card PayLater options.",
    },
    {
      id: "cashfree",
      name: "Cashfree Payment",
      icon: "bi-activity text-danger",
      badge: "Instant Payouts",
      desc: "Supports 120+ payment modes including cardless EMIs.",
    },
    {
      id: "phonepe",
      name: "PhonePe PG",
      icon: "bi-phone-fill text-purple",
      badge: "Direct UPI",
      desc: "Seamless UPI Intent, QR, and saved credit cards.",
    },
  ];

  return (
    <div className="container">
      <h2 className="fw-bold mb-4">Secure Checkout</h2>

      <form onSubmit={handlePay}>
        <div className="row g-4">
          {/* Form Details Column */}
          <div className="col-lg-8">
            {/* Billing Details */}
            <div className="card shadow-sm border mb-4 bg-white">
              <div className="card-header bg-white py-3">
                <h5 className="mb-0 fw-bold">1. Delivery &amp; Contact Details</h5>
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
                    <label className="form-label small fw-semibold text-secondary">Mobile Number (for UPI/SMS)</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">+91</span>
                      <input
                        type="tel"
                        name="phone"
                        className="form-control"
                        placeholder="10-digit number"
                        pattern="[0-9]{10}"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-semibold text-secondary">Email Address</label>
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
                    <label className="form-label small fw-semibold text-secondary">Delivery Address</label>
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
                    <label className="form-label small fw-semibold text-secondary">PIN Code</label>
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

            {/* Gateway Selection */}
            <div className="card shadow-sm border bg-white mb-4">
              <div className="card-header bg-white py-3">
                <h5 className="mb-0 fw-bold">2. Select Payment Gateway</h5>
              </div>
              <div className="card-body">
                <p className="text-secondary small mb-3">
                  Choose a service provider to simulate checkout integration.
                </p>
                <div className="row g-3">
                  {gateways.map((gw) => (
                    <div key={gw.id} className="col-md-6">
                      <label className="w-100 h-100 m-0">
                        <input
                          type="radio"
                          name="gateway"
                          value={gw.id}
                          className="gateway-radio d-none"
                          checked={selectedGateway === gw.id}
                          onChange={() => setSelectedGateway(gw.id)}
                        />
                        <div className="gateway-card border rounded p-3 h-100 d-flex flex-column justify-content-between gateway-card-inner bg-white">
                          <div>
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <div className="d-flex align-items-center">
                                <i className={`bi ${gw.icon} fs-4 me-2`}></i>
                                <h6 className="mb-0 fw-bold">{gw.name}</h6>
                              </div>
                              <span className="badge bg-light text-dark border small">{gw.badge}</span>
                            </div>
                            <p className="text-muted small mb-0">{gw.desc}</p>
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
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
                  <span>Taxes (GST 18% Incl.)</span>
                  <span>₹{Math.round(Number(amount) * 0.18).toLocaleString("en-IN")}.00</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <span className="fw-bold">Total Amount</span>
                  <span className="fs-4 fw-bold text-primary">₹{Number(amount).toLocaleString("en-IN")}.00</span>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="btn btn-primary btn-lg w-100 py-3 d-flex align-items-center justify-content-center gap-2 shadow"
                >
                  {isProcessing ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-shield-lock-fill fs-5"></i>
                      <span>Pay with {gateways.find(g => g.id === selectedGateway)?.name}</span>
                    </>
                  )}
                </button>

                <div className="text-center mt-3">
                  <Link href="/" className="text-decoration-none small">
                    <i className="bi bi-arrow-left me-1"></i> Back to product details
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
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading checkout...</span>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
