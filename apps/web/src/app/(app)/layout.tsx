// SPDX-License-Identifier: AGPL-3.0-only
import "@anyplay/tokens/app.css";

/**
 * The signed-in surface. Pages here are client components that call the Rust API with the session
 * cookie and the CSRF header: there is no auth logic in Next.js (no proxy check, no server
 * component reading cookies), so a bug here cannot become a bypass. The API decides.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell" data-direction="a">
      <div className="app-shell__scroll">{children}</div>
    </div>
  );
}
