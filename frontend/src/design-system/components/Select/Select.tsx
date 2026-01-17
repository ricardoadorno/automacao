import type { SelectHTMLAttributes } from "react";
import "./select.css";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export function Select({ label, className, children, ...props }: SelectProps) {
  if (label) {
    return (
      <label className="select-field">
        <span className="select-field__label">{label}</span>
        <select className={className ? `select ${className}` : "select"} {...props}>
          {children}
        </select>
      </label>
    );
  }
  return (
    <select className={className ? `select ${className}` : "select"} {...props}>
      {children}
    </select>
  );
}
