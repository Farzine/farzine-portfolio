export class AuthorizationError extends Error {
  constructor(public readonly status: 401 | 403) {
    super(status === 401 ? "Please sign in." : "Access denied.");
    this.name = "AuthorizationError";
  }
}
