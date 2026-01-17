import type { HTMLAttributes } from "react";
import "./sidebar.css";

type SidebarProps = HTMLAttributes<HTMLElement>;

export function Sidebar({ className, ...props }: SidebarProps) {
  return <aside className={className ? `sidebar ${className}` : "sidebar"} {...props} />;
}
