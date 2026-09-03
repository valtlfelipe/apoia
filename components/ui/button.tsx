import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-accent)] text-[var(--color-accent-contrast)] hover:bg-[var(--color-accent-hover)] active:translate-y-px shadow-[0_1px_0_var(--color-accent-strong)]",
  secondary:
    "bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-2)] border border-[var(--color-border)]",
  ghost: "bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
};

export function Button({ variant = "primary", className, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold tracking-tight transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0",
        variantClasses[variant],
        className,
      )}
      disabled={disabled}
      {...props}
    />
  );
}
