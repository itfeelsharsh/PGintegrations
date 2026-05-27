import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="container">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link href="/">Shop</Link></li>
          <li className="breadcrumb-item"><Link href="/">Footwear</Link></li>
          <li className="breadcrumb-item active" aria-current="page">VoltGlide Obsidian Pro</li>
        </ol>
      </nav>

      {/* Product Detail Section */}
      <div className="row g-4 mb-5">
        {/* Product Image Column */}
        <div className="col-md-6">
          <div className="card shadow-sm product-gallery p-3">
            <div className="text-center bg-white rounded p-3">
              <Image
                src="/sneakers.png"
                alt="VoltGlide Obsidian Pro"
                width={500}
                height={500}
                className="img-fluid rounded product-image"
                priority
              />
            </div>
            <div className="row g-2 mt-2">
              <div className="col-3">
                <div className="border rounded p-1 text-center bg-white cursor-pointer opacity-75">
                  <Image src="/sneakers.png" alt="Thumbnail 1" width={80} height={80} className="img-fluid" />
                </div>
              </div>
              <div className="col-3">
                <div className="border rounded p-1 text-center bg-white cursor-pointer opacity-50">
                  <Image src="/sneakers.png" alt="Thumbnail 2" width={80} height={80} className="img-fluid" />
                </div>
              </div>
              <div className="col-3">
                <div className="border rounded p-1 text-center bg-white cursor-pointer opacity-50">
                  <Image src="/sneakers.png" alt="Thumbnail 3" width={80} height={80} className="img-fluid" />
                </div>
              </div>
              <div className="col-3">
                <div className="border rounded p-1 text-center bg-white cursor-pointer opacity-50">
                  <Image src="/sneakers.png" alt="Thumbnail 4" width={80} height={80} className="img-fluid" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Info Column */}
        <div className="col-md-6">
          <div className="d-flex flex-column h-100 justify-content-between">
            <div>
              <span className="badge bg-danger mb-2">New Release</span>
              <h1 className="fw-bold display-5 mb-2">VoltGlide Obsidian Pro</h1>
              <p className="text-muted mb-3">Premium High-Performance Running Sneakers</p>

              {/* Rating */}
              <div className="d-flex align-items-center mb-3">
                <div className="text-warning me-2">
                  <i className="bi bi-star-fill"></i>
                  <i className="bi bi-star-fill"></i>
                  <i className="bi bi-star-fill"></i>
                  <i className="bi bi-star-fill"></i>
                  <i className="bi bi-star-half"></i>
                </div>
                <span className="text-secondary small">(4.8 / 5.0 based on 124 reviews)</span>
              </div>

              {/* Price */}
              <div className="d-flex align-items-center mb-4">
                <h2 className="fw-bold text-primary mb-0 me-3">₹8,999.00</h2>
                <span className="text-decoration-line-through text-muted fs-5">₹12,499.00</span>
                <span className="badge bg-success ms-2">28% OFF</span>
              </div>

              <hr className="my-4" />

              {/* Description */}
              <p className="lead fs-6 text-secondary mb-4">
                Engineered with revolutionary Zoom-MX responsive cushioning, the VoltGlide Obsidian Pro delivers maximum energy return and comfort. The dynamic Flyknit breathable upper wraps your foot for a secure, adaptive fit. Ideal for long-distance runs, workouts, or sleek athleisure styling.
              </p>

              {/* Color Selection */}
              <div className="mb-3">
                <label className="form-label fw-bold text-dark small uppercase">Select Color</label>
                <div className="d-flex gap-2">
                  <button className="btn btn-outline-dark p-2 rounded-circle d-flex align-items-center justify-content-center active" style={{ width: "32px", height: "32px" }}>
                    <span className="rounded-circle" style={{ backgroundColor: "#d4fc34", width: "18px", height: "18px" }}></span>
                  </button>
                  <button className="btn btn-outline-secondary p-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px" }}>
                    <span className="rounded-circle bg-dark" style={{ width: "18px", height: "18px" }}></span>
                  </button>
                  <button className="btn btn-outline-secondary p-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px" }}>
                    <span className="rounded-circle bg-primary" style={{ width: "18px", height: "18px" }}></span>
                  </button>
                </div>
              </div>

              {/* Size Selection */}
              <div className="mb-4">
                <label className="form-label fw-bold text-dark small uppercase">Select Size (UK)</label>
                <div className="d-flex gap-2 flex-wrap">
                  {["7", "8", "9", "10", "11"].map((size) => (
                    <button
                      key={size}
                      className={`btn btn-sm ${size === "9" ? "btn-dark" : "btn-outline-secondary"}`}
                      style={{ width: "50px" }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="d-grid gap-3 pt-3">
              <Link
                href="/checkout?amount=8999&product=VoltGlide%20Obsidian%20Pro"
                className="btn btn-primary btn-lg py-3 shadow-sm d-flex align-items-center justify-content-center gap-2"
              >
                <i className="bi bi-cart-check-fill fs-5"></i>
                <strong className="fs-5">Buy Now &amp; Checkout</strong>
              </Link>
              <button className="btn btn-outline-dark py-2">
                <i className="bi bi-heart me-2"></i> Add to Wishlist
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gateway list anchor */}
      <section id="gateways" className="py-4 border-top">
        <h3 className="fw-bold mb-4">Supported Demo Integrations</h3>
        <p className="text-secondary">
          This site is set up as a playground to demonstrate integration with multiple Indian Payment Gateways. Select one at checkout to view the flow.
        </p>
        <div className="row g-3">
          {[
            { name: "Razorpay", desc: "Cards, Netbanking, UPI, Wallets" },
            { name: "Paytm PG", desc: "All-in-One SDK, Paytm Wallet, Postpaid" },
            { name: "PayU", desc: "Enterprise Grade Routing, Instant Settlement" },
            { name: "PineLabs", desc: "Plural gateway, Brand EMI, PayLater" },
            { name: "Cashfree", desc: "Auto-collect, Payouts, Cardless EMI" },
            { name: "PhonePe PG", desc: "UPI deep linking, Cards, Safe & Fast" }
          ].map((gateway) => (
            <div key={gateway.name} className="col-md-4">
              <div className="card h-100 bg-white border shadow-sm">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-check-circle-fill text-success me-2 fs-5"></i>
                    <h5 className="card-title mb-0 fw-bold">{gateway.name}</h5>
                  </div>
                  <p className="card-text text-muted small">{gateway.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
