import React from "react";

function cx(...classes: Array<string | undefined | false>) {
    return classes.filter(Boolean).join(" ");
}

type Tone = "default" | "danger";

type BaseProps = {
    label: string;
    tone?: Tone;
    right?: React.ReactNode;
    disabled?: boolean;
};

type ButtonProps = BaseProps & {
    onClick: () => void;
    href?: never;
    external?: never;
};

type LinkProps = BaseProps & {
    href: string;
    external?: boolean;
    onClick?: never;
};

export type ListItemProps = ButtonProps | LinkProps;

function ChevronRightIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M9 18l6-6-6-6" />
        </svg>
    );
}

export function ListItem(props: ListItemProps) {
    const { label, tone = "default", right, disabled } = props;

    const textColor =
        tone === "danger" ? "text-[var(--danger)]" : "text-[var(--fg)]";

    const base = cx(
        "w-full flex items-center justify-between px-6 py-5 text-left",
        "transition-opacity disabled:opacity-50",
        textColor,
    );

    const chevron = right ?? (
        <ChevronRightIcon className="h-5 w-5 shrink-0 text-[var(--subtle)]" />
    );

    if ("href" in props) {
        return (
            <a
                href={props.href}
                className={base}
                target={props.external ? "_blank" : undefined}
                rel={props.external ? "noreferrer" : undefined}
                aria-disabled={disabled ? "true" : undefined}
            >
                <span className="text-lg leading-snug">{label}</span>
                {chevron}
            </a>
        );
    }

    return (
        <button
            type="button"
            onClick={props.onClick}
            disabled={disabled}
            className={base}
        >
            <span className="text-lg leading-snug">{label}</span>
            {chevron}
        </button>
    );
}
