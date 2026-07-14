import React from "react";

export const POLLMEIER_RED = "#e2001a";
export const POLLMEIER_BLACK = "#1d1d1b";

/**
 * Recreation of the Pollmeier logo: flag mark (one red bar above three black
 * bars) plus the wordmark. Used in the app header and, as a string, in the
 * printable report.
 */
export const logoSvg = (height = 28) => `
<svg viewBox="0 0 620 100" height="${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pollmeier">
  <rect x="0" y="0" width="122" height="17" fill="${POLLMEIER_RED}"/>
  <rect x="0" y="27.5" width="122" height="17" fill="${POLLMEIER_BLACK}"/>
  <rect x="0" y="55" width="122" height="17" fill="${POLLMEIER_BLACK}"/>
  <rect x="0" y="82.5" width="122" height="17" fill="${POLLMEIER_BLACK}"/>
  <text x="152" y="88" font-family="'Segoe UI', 'Helvetica Neue', Arial, sans-serif" font-size="92" font-weight="700" letter-spacing="-2" fill="${POLLMEIER_BLACK}">Pollmeier</text>
</svg>`;

export function Logo({ height = 28 }) {
  return (
    <span
      className="logo"
      style={{ height, display: "inline-flex", alignItems: "center" }}
      dangerouslySetInnerHTML={{ __html: logoSvg(height) }}
    />
  );
}
