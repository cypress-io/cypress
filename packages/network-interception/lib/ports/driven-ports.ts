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
  // Expanded in Stage 6a.
}

/**
 * Driven port: cookie jar read/write for proxied requests.
 */
export interface ForCookieState {
  // Expanded in Stage 6a.
}

/**
 * Driven port: command log entries for intercept provenance.
 */
export interface ForCommandLog {
  // Expanded in Stage 6a.
}

/**
 * Driven port: CDP/BiDi session hooks (HTTP/2 program).
 */
export interface ForBrowserNetworkAutomation {
  // Expanded in HTTP/2 epics.
}
