import type { SVGProps } from "react";

/**
 * Two outlined hearts, like 💕 — a big one bottom-left and a small one
 * top-right. Drawn from lucide's heart path so it sits with the other nav
 * icons; `non-scaling-stroke` keeps both outlines the same weight even
 * though each heart is scaled differently.
 */
const HEART =
  "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z";

export function HeartsIcon({
  strokeWidth = 2,
  ...props
}: SVGProps<SVGSVGElement> & { strokeWidth?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path
        d={HEART}
        transform="translate(0.5 4.6) scale(0.76)"
        strokeWidth={strokeWidth}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={HEART}
        transform="translate(12.2 1) scale(0.48)"
        strokeWidth={strokeWidth}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
