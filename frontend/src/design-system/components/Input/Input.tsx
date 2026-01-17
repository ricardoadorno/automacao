import type { InputHTMLAttributes } from "react";
import "./input.css";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Input({ label, className, ...props }: InputProps) {
  if (label) {
    return (
      <label className="input-field">
        <span className="input-field__label">{label}</span>
        <input className={className ? `input ${className}` : "input"} {...props} />
      </label>
    );
  }
  return <input className={className ? `input ${className}` : "input"} {...props} />;
}
