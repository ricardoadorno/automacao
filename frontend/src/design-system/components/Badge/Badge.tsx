import type { HTMLAttributes } from "react";
import "./badge.css";

type BadgeVariant = "success" | "error" | "warning";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({ variant = "success", className, ...props }: BadgeProps) {
  const classes = ["badge", `badge--${variant}`].join(" ");
  return <span className={className ? `${classes} ${className}` : classes} {...props} />;
}
