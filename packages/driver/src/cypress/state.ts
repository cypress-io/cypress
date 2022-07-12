/// <reference path="../../types/cy/commands/session.d.ts" />
/// <reference path="../../types/cypress/log.d.ts" />

import type Bluebird from 'bluebird'

import type { RouteMap } from '../cy/net-stubbing/types'
import type { $Command } from './command'
import type { XHRRequest, XHRResponse } from '../cy/commands/xhr'
import type { KeyboardModifiers } from '../cy/keyboard'
import type { MouseCoords } from '../cy/mouse'
import type { Server } from './server'

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
  (k: 'assertUsed', v?: boolean): boolean
  (k: 'currentAssertionUserInvocationStack', v?: string): string
  (k: 'responses', v?: XHRResponse[]): XHRResponse[]
  (k: 'aliases', v?: Record<string, any>): Record<string, any>
  (k: 'onBeforeLog', v?: (() => boolean) | null): () => boolean | null
  (k: 'keyboardModifiers', v?: KeyboardModifiers): KeyboardModifiers
  (k: 'mouseLastHoveredEl', v?: HTMLElement | null): HTMLElement | null
  (k: 'mouseCoords', v?: MouseCoords): MouseCoords
  (k: 'server', v?: Server): Server
  (k: 'requests', v?: XHRRequest[]): XHRRequest[]
  (k: 'fetchPolyfilled', v?: boolean): boolean
  (k: 'nestedIndex', v?: number): number
  (k: 'chainerId', v?: string): string
  (k: 'ctx', v?: Mocha.Context): Mocha.Context
  (k: 'commandIntermediateValue', v?: any): any
  (k: 'subject', v?: any): any
  (k: 'onPaused', v?: (fn: any) => void): (fn: any) => void
  (k: 'onCommandFailed', v?: (err: any, queue: any, next: any) => boolean): (err: any, queue: any, next: any) => boolean
  (k: 'promise', v?: Bluebird<unknown>): Bluebird<unknown>
  (k: 'reject', v?: (err: any) => any): (err: any) => any
  (k: 'cancel', v?: () => void): () => void
  (k: string, v?: any): any
  state: StateFunc
  reset: () => Record<string, any>
}
