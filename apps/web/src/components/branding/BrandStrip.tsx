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
        <span className="event-mark event-mark--mindsparks">
          <img src="/branding/Mindsparks 26 Logo.png" alt="Mindsparks 26" />
        </span>
        <span className="event-mark event-mark--codefront">
          <img src="/branding/Code front.png" alt="CodeFront Challenge" />
        </span>
        <span className="event-mark event-mark--idc">
          <img src="/branding/AUST IDC - Black.png" alt="AUST Innovation and Design Club" />
        </span>
      </div>
    </div>
  );
}
