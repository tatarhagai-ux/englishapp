/** A failed call to an external provider, with the HTTP status it returned (or 502/504). */
export class ProviderError extends Error {
  constructor(
    public readonly provider: string,
    public readonly status: number,
    message: string,
  ) {
    super(`${provider}: ${message}`);
    this.name = "ProviderError";
  }
}
