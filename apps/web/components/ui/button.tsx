import type { ComponentProps } from "react";

import { cn } from "../../lib/utils";

type Variant = "primary" | "outline" | "ghost";
type Size = "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-ink/85",
  outline: "border border-line bg-white text-ink hover:bg-surface",
  ghost: "text-ink-muted hover:text-ink",
};

const SIZES: Record<Size, string> = {
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-8 text-base",
};

/**
 * Exported so a `Link` can take the same look without a button wrapping an
 * anchor, which is invalid markup and breaks keyboard navigation.
 */
export const buttonStyles = ({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) =>
  cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors",
    "disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );

export const Button = ({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) => (
  <button className={buttonStyles({ variant, size, className })} {...props} />
);
