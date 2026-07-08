import "./env.js";

const splitList = (value) =>
  (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const authAllowedHosts = splitList(process.env.AUTH_ALLOWED_HOSTS);

if (authAllowedHosts.length === 0) {
  throw new Error("AUTH_ALLOWED_HOSTS must contain at least one host");
}

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const matchesHost = (host, pattern) => {
  const expression = escapeRegex(pattern)
    .replace(/\\\*/g, ".*")
    .replace(/\\\?/g, ".");

  return new RegExp(`^${expression}$`, "i").test(host);
};

export const isAllowedOrigin = (origin) => {
  try {
    const url = new URL(origin);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      authAllowedHosts.some((pattern) => matchesHost(url.host, pattern))
    );
  } catch {
    return false;
  }
};

export const getRequestOrigin = (req) => {
  const forwardedHost = req.get("x-forwarded-host");
  const forwardedProto = req.get("x-forwarded-proto");
  const host = forwardedHost || req.get("host");
  const protocol = forwardedProto || req.protocol;

  if (!host || !["http", "https"].includes(protocol)) {
    throw new Error("Unable to determine request origin");
  }

  const origin = `${protocol}://${host}`;

  if (!isAllowedOrigin(origin)) {
    throw new Error(`Untrusted request origin: ${origin}`);
  }

  return origin;
};
