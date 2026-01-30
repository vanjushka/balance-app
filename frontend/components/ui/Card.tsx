import React from "react";

function cx(...classes: Array<string | undefined | false>) {
    return classes.filter(Boolean).join(" ");
}

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
    return (
        <div
            className={cx(
                "rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)]",
                className,
            )}
            {...props}
        />
    );
}

type CardSectionProps = React.HTMLAttributes<HTMLDivElement>;

export function CardHeader({ className, ...props }: CardSectionProps) {
    return <div className={cx("px-6 pt-6", className)} {...props} />;
}

export function CardContent({ className, ...props }: CardSectionProps) {
    return <div className={cx("px-6 pb-6", className)} {...props} />;
}

export function CardBody({ className, ...props }: CardSectionProps) {
    return <div className={cx("p-6", className)} {...props} />;
}

type CardTitleProps = React.HTMLAttributes<HTMLDivElement>;

export function CardTitle({ className, ...props }: CardTitleProps) {
    return (
        <div
            className={cx(
                "text-xs uppercase tracking-[0.12em] text-[var(--subtle)]",
                className,
            )}
            {...props}
        />
    );
}

type CardDividerProps = React.HTMLAttributes<HTMLHRElement>;

export function CardDivider({ className, ...props }: CardDividerProps) {
    return (
        <hr
            className={cx(
                "mx-6 h-px border-0 bg-[var(--border)]",
                "my-4",
                className,
            )}
            {...props}
        />
    );
}
