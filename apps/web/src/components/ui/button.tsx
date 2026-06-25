import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "destructive" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

function buttonClassName({
  className = "",
  size = "md",
  variant = "default"
}: {
  className?: string | undefined;
  size?: ButtonSize | undefined;
  variant?: ButtonVariant | undefined;
}) {
  return `ui-button ui-button--${variant} ui-button--${size}${className ? ` ${className}` : ""}`;
}

export function Button({
  className,
  size,
  variant,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { size?: ButtonSize; variant?: ButtonVariant }) {
  return <button className={buttonClassName({ className, size, variant })} {...props} />;
}

export function ButtonLink({
  children,
  className,
  size,
  variant,
  ...props
}: LinkProps & { children: ReactNode; className?: string; size?: ButtonSize; variant?: ButtonVariant }) {
  return (
    <Link className={buttonClassName({ className, size, variant })} {...props}>
      {children}
    </Link>
  );
}

export function ExternalButtonLink({
  className,
  size,
  variant,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { size?: ButtonSize; variant?: ButtonVariant }) {
  return <a className={buttonClassName({ className, size, variant })} {...props} />;
}
