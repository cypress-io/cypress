// Note: This file is owned by the cloud delivered
// `cy-prompt` bundle. It is downloaded and copied to the app.
// It should not be modified directly in the app.

import type Emitter from 'component-emitter'

interface InternalActions extends Cypress.Actions {
  (
    eventName: 'prompt:backend:request',
    listener: (...args: any[]) => void
  ): Cypress.Cypress
  (
    eventName: 'test:after:run:async',
    listener: (test: { id: string, err: Error }) => void
  ): Cypress.Cypress
}

export interface CypressInternalBase extends Cypress.Cypress {
  backendRequestHandler: (
    backendRequestNamespace: string,
    eventName: string,
    ...args: any[]
  ) => Promise<any>
  on: InternalActions
  once: InternalActions
}

interface CrossOriginCypressInternal extends CypressInternalBase {
  isCrossOriginSpecBridge: true
  handleCrossOriginSocketEvent: (
    Cypress: CypressInternal,
    eventName: string
  ) => void
}

interface SameOriginCypressInternal extends CypressInternalBase {
  isCrossOriginSpecBridge: false
  handlePrimaryOriginSocketEvent: (
    Cypress: CypressInternal,
    eventName: string
  ) => void
}

export type CypressInternal =
  | CrossOriginCypressInternal
  | SameOriginCypressInternal

export interface CyPromptEventManager {
  ws: Emitter
}

export interface CyPromptErrorUtilsOpts {
  message?: string
  args?: unknown
  onFail?: (err: any) => void
  stack?: any
  errProps?: {
    name: string
  }
}

export interface CyPromptErrorUtils {
  extendErrorMessages: (errorMessages: any) => void
  throwErrByPath: (
    errPath: `cloudPrompt.${string}`,
    options?: CyPromptErrorUtilsOpts
  ) => never
}

export interface CyPromptStackLineDetail {
  function: string
  fileUrl: string
  originalFile: string
  relativeFile: string
  absoluteFile: string
  line: number
  column: number
}

export interface CyPromptMoreInfoNeededOptions {
  testId: string
  logId: string
  onSave: () => void
  onCancel: () => void
}

export interface CyPromptOptions {
  Cypress: CypressInternal
  cy: Cypress.cy & { state: (key: string) => any }
  // Note that the eventManager is present in same origin AUTs, but not cross origin
  // so we need to check for it's presence before using it
  eventManager?: CyPromptEventManager
  errorUtils: CyPromptErrorUtils
  getSourceDetailsForFirstLine: (
    stack: string,
    projectRoot?: string
  ) => CyPromptStackLineDetail | undefined
  onMoreInfoNeeded: (options: CyPromptMoreInfoNeededOptions) => void
}

type MaybePromise<T> = T | Promise<T>

export interface CyPromptDriverDefaultShape {
  createCyPrompt: (
    options: CyPromptOptions
  ) => MaybePromise<
    (args: {
      steps: string[]
      commandOptions?: object
      promptCmd: any
    }) => Cypress.Chainable<void>
  >
}
