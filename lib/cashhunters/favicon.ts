/**
 * URL helpers for cashhunter campaign rows. Favicons come from Google's
 * `s2/favicons` endpoint — free, cached, reliable, accepts a sz hint.
 * If the user typed `acme.com` without a scheme, we still resolve it.
 */

function normalisedUrl(url: string | undefined): URL | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    return new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
}

export function faviconFor(url: string | undefined, size = 64): string | null {
  const u = normalisedUrl(url);
  if (!u) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
    u.host
  )}&sz=${size}`;
}

export function shortHost(url: string | undefined): string {
  const u = normalisedUrl(url);
  if (!u) return url ?? "";
  return u.host.replace(/^www\./, "");
}
