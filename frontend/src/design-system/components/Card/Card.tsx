import type { HTMLAttributes } from "react";
import "./card.css";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return <div className={className ? `card ${className}` : "card"} {...props} />;
}
