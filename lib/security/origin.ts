// Next's listener URL may use localhost behind a proxy; Host is the browser's destination.
export function hasSameOrigin(request: Request): boolean {
  const value = request.headers.get("origin");
  if (!value) return false;
  try {
    const origin = new URL(value);
    const forwarded = request.headers.get("x-forwarded-proto");
    const protocol =
      forwarded === "https" || forwarded === "http"
        ? `${forwarded}:`
        : new URL(request.url).protocol;
    return (
      value === origin.origin &&
      origin.host === request.headers.get("host") &&
      origin.protocol === protocol &&
      ["https:", "http:"].includes(protocol)
    );
  } catch {
    return false;
  }
}
