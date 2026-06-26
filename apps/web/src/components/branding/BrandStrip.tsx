import { Link } from "react-router-dom";

export function BrandStrip() {
  const logos = (
    <div className="event-marks-group">
      <span className="event-mark event-mark--mindsparks">
        <img src="/branding/Mindsparks 26 Logo.png" alt="Mindsparks 26" />
      </span>
      <span className="event-mark event-mark--codefront">
        <img className="logo-invert-dark" src="/branding/Code front.png" alt="CodeFront Challenge" />
      </span>
      <span className="event-mark event-mark--idc">
        <img className="logo-light-only" src="/branding/AUST IDC - Black.png" alt="AUST Innovation and Design Club" />
        <img className="logo-dark-only" src="/branding/AUST IDC - White.png" alt="AUST Innovation and Design Club" />
      </span>
    </div>
  );

  return (
    <div className="brand-strip">
      <Link className="product-mark" to="/">
        <svg width="64" height="24" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="product-mark__logo-svg" aria-label="SHORIR AI logo">
          {/* Circle */}
          <circle cx="20" cy="20" r="15" fill="var(--accent)" stroke="var(--border)" strokeWidth="4" />
          {/* Square */}
          <rect x="46" y="5" width="30" height="30" fill="var(--surface-subtle)" stroke="var(--border)" strokeWidth="4" />
          {/* Triangle */}
          <path d="M100 5 L82 35 L118 35 Z" fill="var(--text)" stroke="var(--border)" strokeWidth="4" strokeLinejoin="miter" />
        </svg>
        <span>
          <strong>SHORIR AI</strong>
          <small>Movement intelligence</small>
        </span>
      </Link>
      <div className="event-marks-ticker" aria-label="Mindsparks 26 CodeFront Challenge by AUST IDC">
        <div className="event-marks-track">
          {logos}
          {/* Duplicate for seamless infinite loop */}
          {logos}
        </div>
      </div>
    </div>
  );
}
