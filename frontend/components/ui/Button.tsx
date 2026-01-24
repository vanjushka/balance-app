import React from "react";

function cx(...classes: Array<string | undefined | false>) {
    return classes.filter(Boolean).join(" ");
}

type ButtonVariant = "primary" | "secondary" | "danger";
type ButtonSize = "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
};

export function Button({
    className,
    variant = "primary",
    size = "lg",
    isLoading,
    disabled,
    children,
    ...props
}: ButtonProps) {
    const base =
        "inline-flex items-center justify-center rounded-full font-medium transition-[opacity,transform] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 " +
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

    const sizes: Record<ButtonSize, string> = {
        md: "h-12 px-6 text-sm",
        lg: "h-14 px-6 text-sm",
    };

    const variants: Record<ButtonVariant, string> = {
        primary: "w-full bg-[var(--primary)] text-[var(--primary-fg)]",
        secondary:
            "w-full bg-transparent border border-[var(--border)] text-[var(--fg)]",
        danger: "bg-[var(--danger)] text-[var(--danger-fg)] px-6 h-12 text-sm",
    };

    return (
        <button
            className={cx(base, sizes[size], variants[variant], className)}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <span className="opacity-80">Loading…</span>
            ) : (
                children
            )}
        </button>
    );
}
