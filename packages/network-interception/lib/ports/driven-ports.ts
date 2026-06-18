export * from './interception-events'

import type { BackendRoute } from '../types/backend-route'

/**
 * Driven port: minimum net-stubbing surface the cy.intercept interceptor needs.
 *
 * Implemented by `NetStubbingState` in `@packages/net-stubbing`.
 */
export interface ForStubbing {
  routes: BackendRoute[]
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
