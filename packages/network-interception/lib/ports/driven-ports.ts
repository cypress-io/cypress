/**
 * Driven port: correlate pre-requests, continue/fulfill, forward to origin.
 */
export interface ForRequestInterception {
  // Expanded in Stage 4a.
}

/**
 * Driven port: response intercept continuation and stream plumbing.
 */
export interface ForResponseInterception {
  // Expanded in Stage 4a.
}

/**
 * Driven port: HTML/JS inject into AUT documents.
 *
 * Placeholder — see `ForPageInjection` in docs/page-injection.md.
 */
export interface ForDocumentPreparation {
  // Expanded in Stage 5a; target shape documented in docs/page-injection.md
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
