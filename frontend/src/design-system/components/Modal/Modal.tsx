import type { HTMLAttributes, ReactNode } from "react";
import "./modal.css";

type ModalProps = HTMLAttributes<HTMLDivElement> & {
  open: boolean;
  title?: string;
  onClose?: () => void;
  actions?: ReactNode;
};

export function Modal({ open, title, onClose, actions, children, ...props }: ModalProps) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
        {...props}
      >
        {(title || onClose) && (
          <div className="modal__header">
            {title ? <h3 className="modal__title">{title}</h3> : <span />}
            {onClose ? (
              <button className="btn btn--ghost btn--sm" type="button" onClick={onClose}>
                Fechar
              </button>
            ) : null}
          </div>
        )}
        <div className="modal__body">{children}</div>
        {actions ? <div className="modal__actions">{actions}</div> : null}
      </div>
    </div>
  );
}
