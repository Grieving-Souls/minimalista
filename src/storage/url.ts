export type UrlResult =
  | { ok: true; url: string; domain: string }
  | { ok: false; error: string };

/** Prepend https:// when the scheme is missing; reject anything that is not http(s). */
export function normalizeUrl(input: string): UrlResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "URL is required." };

  let raw = trimmed;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) {
    raw = `https://${raw}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, error: "That doesn’t look like a valid URL." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Only http and https URLs are allowed." };
  }

  if (!parsed.hostname) {
    return { ok: false, error: "That doesn’t look like a valid URL." };
  }

  const domain = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  return { ok: true, url: parsed.toString(), domain };
}

/** Hostname + path, www/trailing-slash stripped — used for duplicate detection. */
export function canonicalUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.hostname = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    if (parsed.pathname.endsWith("/") && parsed.pathname.length > 1) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    parsed.username = "";
    parsed.password = "";
    return parsed.toString();
  } catch {
    return url.trim().toLowerCase();
  }
}
