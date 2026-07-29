import type { RunPoliciesResult } from '../registry/network-policy-registry'

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

  endRequestIfBlocked (
    ctx: unknown,
    runPolicies: () => Promise<RunPoliciesResult>,
  ): Promise<void>
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
 * The state the pipeline's outgoing body must be in: `wire` re-encodes the
 * body to match its content-encoding header (a real socket and a decoding
 * netstack sit downstream), `identity` hands it back fully decoded (nothing
 * downstream will decode, e.g. CDP Fetch.fulfillRequest). Declared per
 * pipeline; a proxy-disabled runtime serves wire (express) and identity (CDP)
 * pipelines side by side.
 */
export type BodyEncoding = 'wire' | 'identity'

/**
 * Driven port: content-encoding negotiation. The implementation is selected
 * per request by the pipeline's declared {@link BodyEncoding}.
 */
export interface ForContentEncoding {
  // Implementations advance the middleware stage themselves (ctx.next()).
  constrainAcceptEncoding (ctx: unknown): void

  compressBody (ctx: unknown): Promise<void>
}

/**
 * Driven port: Test Replay / protocol capture at the proxy boundary.
 */
export interface ForNetworkCapture {
  // Advances the middleware stage itself (ctx.next()).
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
