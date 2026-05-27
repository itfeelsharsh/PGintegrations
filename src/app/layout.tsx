import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "PG Integrations - Indian Payment Gateways Demo",
  description: "Demo of various Indian payment gateway integrations including Razorpay, Paytm, PayU, and PineLabs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="d-flex flex-column min-vh-100 bg-light">
        {/* Navigation Bar */}
        <header>
          <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
            <div className="container">
              <a className="navbar-brand d-flex align-items-center" href="/">
                <i className="bi bi-wallet2 me-2 text-warning fs-4"></i>
                <strong className="tracking-wide">PG Integrations</strong>
                <span className="badge bg-warning text-dark ms-2 fs-6">Demo</span>
              </a>
              <button
                className="navbar-toggler"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#navbarNav"
                aria-controls="navbarNav"
                aria-expanded="false"
                aria-label="Toggle navigation"
              >
                <span className="navbar-toggler-icon"></span>
              </button>
              <div className="collapse navbar-collapse" id="navbarNav">
                <ul className="navbar-nav ms-auto">
                  <li className="nav-item">
                    <a className="nav-link active" href="/">
                      <i className="bi bi-house-door me-1"></i> Home
                    </a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" href="#gateways">
                      <i className="bi bi-credit-card me-1"></i> Gateways
                    </a>
                  </li>
                  <li className="nav-item">
                    <a
                      className="nav-link"
                      href="https://github.com/itfeelsharsh/PGintegrations"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="bi bi-github me-1"></i> GitHub
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-grow-1 py-4">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-dark text-white py-4 mt-auto">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-md-6 text-center text-md-start mb-3 mb-md-0">
                <h5 className="mb-1 text-warning">PG Integrations Demo</h5>
                <p className="text-secondary small mb-0">
                  Demo repository for Indian Payment Gateway integrations.
                </p>
              </div>
              <div className="col-md-6 text-center text-md-end">
                <div className="small text-secondary mb-2">Supported Gateways:</div>
                <div className="d-flex flex-wrap justify-content-center justify-content-md-end gap-2">
                  <span className="badge bg-secondary">Razorpay</span>
                  <span className="badge bg-secondary">Paytm PG</span>
                  <span className="badge bg-secondary">PayU</span>
                  <span className="badge bg-secondary">PineLabs</span>
                  <span className="badge bg-secondary">Cashfree</span>
                  <span className="badge bg-secondary">PhonePe PG</span>
                </div>
              </div>
            </div>
            <hr className="border-secondary my-3" />
            <div className="text-center text-secondary small">
              Made with <i className="bi bi-heart-fill text-danger"></i> by{" "}
              <a
                href="https://harshbanker.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-decoration-underline"
              >
                Harsh Banker
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
