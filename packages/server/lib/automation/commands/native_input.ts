/**
 * Thrown for `input:actions` and `input:reset` by browsers whose automation
 * cannot dispatch native input yet. It is a plain error rather than
 * `AutomationNotImplemented`, so the request fails instead of falling back to
 * the extension, which cannot dispatch native input either.
 */
export class NativeInputNotSupportedError extends Error {
  constructor (browser: string) {
    super(`Native input is not supported in ${browser} yet.`)
    this.name = 'NativeInputNotSupportedError'
  }
}
