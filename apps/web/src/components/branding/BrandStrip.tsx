import { Link } from "react-router-dom";

export function BrandStrip() {
  return (
    <div className="brand-strip">
      <Link className="product-mark" to="/">
        <img src="/images/logo_nobg.png" alt="Shorir AI Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
        <span>
          <strong>SHORIR AI</strong>
          <small>Team El Bracino</small>
        </span>
      </Link>
      <Link className="competition-link" to="/about-competition">
        Mindsparks 26 / CodeFront
      </Link>
    </div>
  );
}
