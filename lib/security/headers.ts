export function contentSecurityPolicy(
  nonce: string,
  options: {
    development?: boolean;
    secureTransport?: boolean;
    storageUrl?: string;
  } = {},
) {
  if (!/^[A-Za-z0-9+/]{24,}={0,2}$/.test(nonce))
    throw new Error("Invalid CSP nonce.");
  let localStorageOrigin = "";
  try {
    const url = new URL(options.storageUrl || "");
    if (
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    )
      localStorageOrigin = url.origin;
  } catch {
    /* Missing configuration is handled by the DAL's safe recovery state. */
  }
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${options.development ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' ${options.development ? "'unsafe-inline'" : `'nonce-${nonce}'`}`,
    // React image dimensions and validated CMS icon colors use style attributes.
    "style-src-attr 'unsafe-inline'",
    `img-src 'self' https: data:${localStorageOrigin ? ` ${localStorageOrigin}` : ""}`,
    "font-src 'self'",
    `connect-src 'self'${options.development ? " ws: wss:" : ""}`,
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(options.secureTransport ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}
