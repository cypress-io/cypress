/// <reference path="../../types/cy/commands/session.d.ts" />
/// <reference path="../../types/cypress/log.d.ts" />

import type Bluebird from 'bluebird'

import type { RouteMap } from '../cy/net-stubbing/types'
import type { $Command } from './command'
import type { Clock } from '../cypress/clock'
import type { XHRRequest, XHRResponse } from '../cy/commands/xhr'
import type { AutomationCookie } from '@packages/server/lib/automation/cookies'
import type { KeyboardModifiers } from '../cy/keyboard'
import type { MouseCoords } from '../cy/mouse'
import type { Server } from './server'
import type { SetterGetter } from '../cypress/setter_getter'
import type Sinon from 'sinon'

type ChainerId = string

export type State = SetterGetter<{
  $autIframe: JQuery<HTMLIFrameElement> | undefined
  activeSessions: Cypress.Commands.Session.ActiveSessions | undefined
  aliases: Record<string, any>
  aliasedRequests: AliasedRequest[]
  anticipatingCrossOriginResponse: {}
  assertUsed: boolean
  autOrigin: string
  canceled: boolean
  cancel: () => void
  chainerId: ChainerId
  changeEvent: ((id?: string | null, readOnly?: boolean) => boolean) | null
  clock: Clock | null
  commandIntermediateValue: any
  'cross:origin:automation:cookies': AutomationCookie[] | null
  ctx: Mocha.Context
  current: $Command | null
  currentAssertionUserInvocationStack: string
  currentActiveOriginPolicy: string
  document: Document
  done: (err: any) => null
  duringUserTestExecution: boolean
  error: Error
  fetchPolyfilled: boolean
  index: number
  isStable: boolean
  jQuery: JQueryStatic
  keyboardModifiers: KeyboardModifiers | null
  latestActiveOriginPolicy: string
  logGroupIds: Array<Cypress.InternalLogConfig['id']>
  mouseLastHoveredEl: HTMLElement | null
  mouseCoords: MouseCoords
  navHistoryDelta: number | undefined
  nestedIndex: number | null
  nextWithinSubject: any | null
  onBeforeLog: (() => boolean) | null
  onCommandFailed: (err: any, queue: any, next: any) => boolean
  onFail: (err: Error) => void
  onInjectCommand?: (cy: any, name: string, ...args: any[]) => boolean
  onPaused: (fn: any) => void
  onPageLoadErr: (err: any) => any // return updated errors
  onResume: ((resumeAll: boolean) => void) | null
  onSignal: () => void
  onQueueEnd: () => void
  originCommandBaseUrl: string
  promise: Bluebird<unknown>
  reject: (err: any) => any
  requests: XHRRequest[]
  responses: XHRResponse[]
  returnedCustomPromise: boolean
  runnable: CypressRunnable
  routes: RouteMap
  sandbox: Sinon.SinonSandbox
  screenshotPaths: string[]
  server: Server
  specWindow: Window
  subject: any
  subjectLinks: Record<ChainerId, ChainerId>
  subjects: ChainerId[]
  urlPosition: number
  url: string
  urls: string[] | undefined
  viewportHeight: number
  viewportWidth: number
  whenAnticipatingCrossOriginResponse?: (() => any) | null
  whenStable?: (() => Promise<any> | void) | null
  withinSubject: any | null
  window: Window
}>
