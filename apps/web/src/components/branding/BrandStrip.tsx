import { Link } from "react-router-dom";

export function BrandStrip() {
  return (
    <div className="brand-strip">
      <Link className="product-mark" to="/">
        <img className="product-mark__logo" src="/images/logo_nobg.png" alt="SHORIR AI" />
        <span>
          <strong>SHORIR AI</strong>
          <small>Movement intelligence</small>
        </span>
      </Link>
      <div className="event-marks" aria-label="Mindsparks 26 CodeFront Challenge by AUST IDC">
        <Link className="event-mark event-mark--mindsparks" to="/about-competition">
          <img src="/branding/Mindsparks 26 Logo.png" alt="Mindsparks 26" />
        </Link>
        <Link className="event-mark event-mark--codefront" to="/about-competition">
          <img src="/branding/Code front.png" alt="CodeFront Challenge" />
        </Link>
        <Link className="event-mark event-mark--idc" to="/about-competition">
          <img src="/branding/AUST IDC - Black.png" alt="AUST Innovation and Design Club" />
        </Link>
      </div>
    </div>
  );
}
