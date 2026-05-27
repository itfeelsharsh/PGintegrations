import Image from "next/image";
import Link from "next/link";
import { GATEWAYS_CONFIG } from "@/app/gateways-config";

export default function Home() {
  return (
    <div className="container">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
   
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
              <h1 className="fw-bold display-5 mb-2">World Class Terrible Shoes</h1>
              <p className="text-muted mb-3">Premium High-Performance Running Sneakers</p>

              

              {/* Price */}
              <div className="d-flex align-items-center mb-4">
                <h2 className="fw-bold text-primary mb-0 me-3">₹8,999.00</h2>

              </div>

              <hr className="my-4" />

              {/* Description */}
              <p className="lead fs-6 text-secondary mb-4">
              Lorem ipsum dolor sit amet,  adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo vuyier. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </p>

            

              {/* Size Selection */}
    
            </div>

            {/* Buttons */}
            <div className="d-grid gap-3 pt-3">
              <Link
                href="/checkout?amount=8999&product=World%20Class%20Terrible%20Shoes"
                className="btn btn-primary btn-lg py-3 shadow-sm d-flex align-items-center justify-content-center gap-2"
              >
                <i className="bi "></i>
                <strong className="fs-5">Purchas</strong>
              </Link>
          
            </div>
          </div>
        </div>
      </div>

      {/* Gateway list anchor */}
      <section id="gateways" className="py-4 border-top">
        <h3 className="fw-bold mb-4">Integrated Payment Gateways</h3>
        <p className="text-secondary">
          This site is set up as a playground to demonstrate integration with multiple Indian Payment Gateways. Select one at checkout to view the flow.<br/><br/><br/> PLEASE GET TEST CARD/UPI DETAILS FOR THE GATEWAY YOU WANT TO TEST BY CLICKING THE BUTTON BELOW.
        </p>
        <div className="row g-3">
          {[
            { id: "razorpay", name: "Razorpay", testUrl: "https://www.google.com/search?q=razorpay+test+card+details" },
            { id: "paytm", name: "PayTM PG", testUrl: "https://www.google.com/search?q=paytm+test+card+details" },
            { id: "payu", name: "PayU", testUrl: "https://www.google.com/search?q=payu+india+test+card+details" },
            { id: "pinelabs", name: "PineLabs", testUrl: "https://www.google.com/search?q=pinelabs+plural+test+card+details" },
            { id: "cashfree", name: "Cashfree", testUrl: "https://www.google.com/search?q=cashfree+test+card+details" },
            { id: "phonepe", name: "PhonePe PG", testUrl: "https://www.google.com/search?q=phonepe+test+upi+ids" }
          ].map((gateway) => {
            const config = GATEWAYS_CONFIG[gateway.id as keyof typeof GATEWAYS_CONFIG];
            const isEnabled = config?.enabled ?? false;

            return (
              <div key={gateway.name} className="col-md-4">
                <div className={`card h-100 bg-white border shadow-sm ${!isEnabled ? "opacity-75" : ""}`}>
                  <div className="card-body d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="d-flex align-items-center">
                          <i className={`bi ${isEnabled ? "" : "bi-dash-circle text-secondary"} me-2 fs-5`}></i>
                          <h5 className="card-title mb-0 fw-bold">{gateway.name}</h5>
                        </div>
                        <span className={`badge ${isEnabled ? "bg-success" : "bg-light text-muted border"} small`}>
                          {isEnabled ? "" : "Under Implementation"}
                        </span>
                      </div>
                    </div>
                    {gateway.testUrl && (
                      <div className="mt-3">
                        <a
                          href={gateway.testUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-dark w-100 py-1"
                        >
                          Test Cards/UPI ids <i className="bi bi-box-arrow-up-right ms-1"></i>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
