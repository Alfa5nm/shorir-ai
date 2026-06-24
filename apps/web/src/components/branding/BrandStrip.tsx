import { Link } from "react-router-dom";

export function BrandStrip() {
  return (
    <div className="brand-strip">
      <Link className="product-mark" to="/">
        <span className="product-mark__icon">S</span>
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
