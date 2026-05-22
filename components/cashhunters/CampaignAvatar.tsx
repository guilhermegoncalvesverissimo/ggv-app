"use client";

import { useEffect, useState } from "react";
import { faviconFor } from "@/lib/cashhunters/favicon";

/**
 * Square favicon avatar with a clean "first letter" fallback. The fallback
 * only renders when there's no URL, no resolvable favicon, or the image
 * fails to load — it does NOT sit on top of a successful image (which is the
 * bug the v0 component had).
 */
export function CampaignAvatar({
  name,
  url,
  size = "h-11 w-11",
  rounded = "rounded-xl",
  iconSize = 96,
  textSize = "text-sm",
}: {
  name: string;
  url?: string;
  /** Tailwind size classes for the outer square (h-* w-*). */
  size?: string;
  rounded?: string;
  /** Pixel size hint passed to Google's favicon service. */
  iconSize?: number;
  textSize?: string;
}) {
  const favicon = faviconFor(url, iconSize);
  const [errored, setErrored] = useState(false);

  // Reset error state if the URL (and therefore the favicon URL) changes.
  useEffect(() => {
    setErrored(false);
  }, [favicon]);

  const initial = name.charAt(0).toUpperCase() || "?";
  const showImage = !!favicon && !errored;

  return (
    <div
      className={`${size} ${rounded} relative shrink-0 overflow-hidden bg-canvas-soft`}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={favicon}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setErrored(true)}
        />
      ) : (
        <span
          className={`flex h-full w-full items-center justify-center font-semibold text-muted ${textSize}`}
          aria-hidden
        >
          {initial}
        </span>
      )}
    </div>
  );
}
