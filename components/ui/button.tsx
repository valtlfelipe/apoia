import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-brand text-on-brand hover:bg-brand-hover",
  secondary: "border border-line bg-surface text-ink hover:bg-subtle",
  ghost: "text-ink-muted hover:bg-subtle hover:text-ink",
  danger: "bg-danger text-white hover:brightness-110",
};

// Heights match the inputs in this same directory so a button sitting next to
// a field lines up without per-call-site padding tweaks.
const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 px-3 text-xs",
  md: "h-10 gap-2 px-4 text-sm",
  lg: "h-12 gap-2 px-5 text-[15px]",
};

/**
 * Exported so an `<a>` that should look like a button (an external link, a
 * Next `<Link>`) gets the exact same treatment without a second copy of these
 * class strings drifting out of sync.
 */
export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md"): string {
  return cn(
    "inline-flex shrink-0 items-center justify-center rounded-xl font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonClasses(variant, size), className)}
      disabled={disabled}
      {...props}
    />
  );
}
