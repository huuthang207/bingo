const defaultWebOrigin = "http://localhost:3000";

function normalizeOrigin(origin: string) {
  return origin.trim().replace(/\/+$/, "");
}

export function getAllowedOrigins() {
  const rawOrigins = process.env.WEB_ORIGIN ?? defaultWebOrigin;

  return rawOrigins
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);
}

export function isOriginAllowed(origin: string | undefined) {
  if (!origin) {
    return true;
  }

  return getAllowedOrigins().includes(normalizeOrigin(origin));
}
