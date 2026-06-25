import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export function Tabs({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`ui-tabs${className ? ` ${className}` : ""}`} {...props} />;
}

export function TabsList({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`ui-tabs__list${className ? ` ${className}` : ""}`} role="tablist" {...props} />;
}

export function TabsTrigger({
  active,
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; children: ReactNode }) {
  return (
    <button
      className={`ui-tabs__trigger${active ? " is-active" : ""}${className ? ` ${className}` : ""}`}
      role="tab"
      aria-selected={active ? "true" : "false"}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`ui-tabs__content${className ? ` ${className}` : ""}`} role="tabpanel" {...props} />;
}
