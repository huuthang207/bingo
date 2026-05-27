import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  narrow?: boolean;
};

export function PageShell({ children, className = "", narrow = false }: PageShellProps) {
  return (
    <main className={`pixel-shell ${className}`}>
      <div className={`pixel-container ${narrow ? "max-w-5xl" : ""}`}>{children}</div>
    </main>
  );
}

type PixelPanelProps<T extends ElementType = "section"> = {
  as?: T;
  children: ReactNode;
  className?: string;
  dark?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function PixelPanel<T extends ElementType = "section">({ as, children, className = "", dark = false, ...props }: PixelPanelProps<T>) {
  const Component = as ?? "section";
  return (
    <Component className={`${dark ? "pixel-panel-dark" : "pixel-panel"} ${className}`} {...props}>
      {children}
    </Component>
  );
}

type PixelButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost";
};

const buttonVariants = {
  primary: "pixel-button-primary",
  secondary: "pixel-button-secondary",
  danger: "pixel-button-danger",
  success: "pixel-button-success",
  ghost: "pixel-button-ghost",
};

export function PixelButton({ className = "", variant = "primary", type = "button", ...props }: PixelButtonProps) {
  return <button className={`pixel-button ${buttonVariants[variant]} ${className}`} type={type} {...props} />;
}

type PixelLinkButtonProps = ComponentPropsWithoutRef<"a"> & {
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost";
};

export function PixelLinkButton({ className = "", variant = "primary", ...props }: PixelLinkButtonProps) {
  return <a className={`pixel-button ${buttonVariants[variant]} ${className}`} {...props} />;
}

type StatusBadgeProps = {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  className?: string;
};

const badgeTones = {
  neutral: "bg-pixel-paper",
  success: "bg-pixel-green",
  warning: "bg-pixel-gold",
  danger: "bg-pixel-pink",
  info: "bg-pixel-cyan",
};

export function StatusBadge({ children, tone = "neutral", className = "" }: StatusBadgeProps) {
  return <span className={`pixel-badge ${badgeTones[tone]} ${className}`}>{children}</span>;
}

type AlertBoxProps = {
  children: ReactNode;
  tone?: "info" | "success" | "warning" | "danger";
  className?: string;
};

const alertTones = {
  info: "border-pixel-blue bg-blue-100 text-pixel-ink",
  success: "border-green-700 bg-green-100 text-pixel-ink",
  warning: "border-yellow-700 bg-yellow-100 text-pixel-ink",
  danger: "border-rose-800 bg-rose-100 text-pixel-ink",
};

export function AlertBox({ children, tone = "info", className = "" }: AlertBoxProps) {
  return <div className={`border-4 p-4 font-bold shadow-[4px_4px_0_#10101f] ${alertTones[tone]} ${className}`}>{children}</div>;
}

type StatCardProps = {
  label: string;
  value: ReactNode;
  tone?: "cyan" | "gold" | "pink" | "green" | "paper";
  className?: string;
  compact?: boolean;
};

const statTones = {
  cyan: "bg-pixel-cyan",
  gold: "bg-pixel-gold",
  pink: "bg-pixel-pink",
  green: "bg-pixel-green",
  paper: "bg-pixel-paper",
};

export function StatCard({ label, value, tone = "paper", className = "", compact = false }: StatCardProps) {
  return (
    <div className={`border-4 border-pixel-ink text-pixel-ink shadow-[4px_4px_0_#10101f] ${compact ? "px-2 py-2 text-center" : "p-4"} ${statTones[tone]} ${className}`}>
      <p className={`${compact ? "text-[0.58rem]" : "pixel-label"} font-pixel font-black uppercase tracking-[0.08em] text-pixel-ink/75`}>{label}</p>
      <div className={`${compact ? "mt-1 text-xl sm:text-2xl" : "mt-2 text-2xl sm:text-3xl"} font-pixel font-black leading-none`}>{value}</div>
    </div>
  );
}
