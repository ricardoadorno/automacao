import type { HTMLAttributes } from "react";
import "./table.css";

type TableProps = HTMLAttributes<HTMLTableElement>;

export function Table({ className, ...props }: TableProps) {
  return <table className={className ? `table ${className}` : "table"} {...props} />;
}
