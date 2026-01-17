import type { HTMLAttributes, ReactNode } from "react";
import "./app-shell.css";

type AppShellProps = HTMLAttributes<HTMLDivElement> & {
  sidebar?: ReactNode;
  topbar?: ReactNode;
};

export function AppShell({ sidebar, topbar, children, className, ...props }: AppShellProps) {
  return (
    <div className={className ? `app-shell ${className}` : "app-shell"} {...props}>
      {topbar ? <div className="app-shell__topbar">{topbar}</div> : null}
      <div className="app-shell__body">
        {sidebar ? <div className="app-shell__sidebar">{sidebar}</div> : null}
        <main className="app-shell__content">{children}</main>
      </div>
    </div>
  );
}
