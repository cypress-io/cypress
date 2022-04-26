/// <reference path="../../types/cy/commands/session.d.ts" />
/// <reference path="../../types/cypress/log.d.ts" />

import type { RouteMap } from '../cy/net-stubbing/types'
import type { $Command } from './command'

export interface StateFunc {
  (): Record<string, any>
  (v: Record<string, any>): Record<string, any>
  (k: 'activeSessions', v?: Cypress.Commands.Session.ActiveSessions): Cypress.Commands.Session.ActiveSessions | undefined
  (k: '$autIframe', v?: JQuery<HTMLIFrameElement>): JQuery<HTMLIFrameElement> | undefined
  (k: 'routes', v?: RouteMap): RouteMap
  (k: 'aliasedRequests', v?: AliasedRequest[]): AliasedRequest[]
  (k: 'document', v?: Document): Document
  (k: 'window', v?: Window): Window
  (k: 'logGroupIds', v?: Array<Cypress.InternalLogConfig['id']>): Array<Cypress.InternalLogConfig['id']>
  (k: 'autOrigin', v?: string): string
  (k: 'originCommandBaseUrl', v?: string): string
  (k: 'currentActiveOriginPolicy', v?: string): string
  (k: 'latestActiveOriginPolicy', v?: string): string
  (k: 'duringUserTestExecution', v?: boolean): boolean
  (k: 'onQueueEnd', v?: () => void): () => void
  (k: 'onFail', v?: (err: Error) => void): (err: Error) => void
  (k: 'specWindow', v?: Window): Window
  (k: 'runnable', v?: CypressRunnable): CypressRunnable
  (k: 'isStable', v?: boolean): boolean
  (k: 'whenStable', v?: null | (() => Promise<any>)): () => Promise<any>
  (k: 'index', v?: number): number
  (k: 'current', v?: $Command): $Command
  (k: 'canceld', v?: boolean): boolean
  (k: 'error', v?: Error): Error
  (k: string, v?: any): any
  state: StateFunc
  reset: () => Record<string, any>
}
