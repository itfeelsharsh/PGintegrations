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
                <strong className="tracking-wide">Payment Gateway Integrations Playground</strong>
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
