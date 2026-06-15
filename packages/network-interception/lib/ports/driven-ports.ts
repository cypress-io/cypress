/**
 * Driven port: correlate pre-requests, continue/fulfill, forward to origin.
 */
export interface ForRequestInterception {
  correlateBrowserPreRequest (ctx: unknown): Promise<void>

  /**
   * HTTP/2 bypass boundary — sends the proxied request to the origin via Node HTTP.
   * Not used on the browser-automation (CDP Fetch) path in the HTTP/2 program.
   */
  forwardToOrigin (ctx: unknown): void
}

/**
 * Driven port: response intercept continuation and stream plumbing.
 */
export interface ForResponseInterception {
  interceptResponse (ctx: unknown): Promise<void>
}

/**
 * Driven port: HTML/JS inject, CSP strip, rewriter application.
 */
export interface ForDocumentPreparation {
  setInjectionLevel (ctx: unknown): Promise<void>

  injectHtml (ctx: unknown): Promise<void>

  removeSecurity (ctx: unknown): Promise<void>
}

/**
 * Driven port: Test Replay / protocol capture at the proxy boundary.
 */
export interface ForNetworkCapture {
  notifyResponseStreamReceived (ctx: unknown): Promise<void>

  notifyResponseEndedWithEmptyBody (ctx: unknown, options: { isCached: boolean }): void
}

/**
 * Driven port: cookie jar read/write for proxied requests.
 */
export interface ForCookieState {
  attachCrossOriginCookies (ctx: unknown): Promise<void>

  copyCookiesFromResponse (ctx: unknown): Promise<void>
}

export type CommandLogInterceptionInput = {
  interception: unknown
  route: unknown
}

export type CommandLogInterceptionResult = {
  setFlag?: (flag: string) => void
} | undefined

/**
 * Driven port: command log entries for intercept provenance.
 */
export interface ForCommandLog {
  notifyIncomingRequest (ctx: unknown): void

  logInterception (input: CommandLogInterceptionInput): CommandLogInterceptionResult
}

/**
 * Driven port: CDP/BiDi session hooks (HTTP/2 program).
 */
export interface ForBrowserNetworkAutomation {
  // Expanded in HTTP/2 epics.
}
