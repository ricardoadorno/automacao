import type { HTMLAttributes } from "react";
import "./topbar.css";

type TopbarProps = HTMLAttributes<HTMLDivElement>;

export function Topbar({ className, ...props }: TopbarProps) {
  return <header className={className ? `topbar ${className}` : "topbar"} {...props} />;
}
