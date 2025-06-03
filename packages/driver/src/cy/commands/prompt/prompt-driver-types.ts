import type Emitter from 'component-emitter'

interface InternalActions extends Cypress.Actions {
  (
    eventName: 'prompt:backend:request',
    listener: (...args: any[]) => void
  ): Cypress.Cypress
}

export interface CypressInternalBase extends Cypress.Cypress {
  backendRequestHandler: (
    backendRequestNamespace: string,
    eventName: string,
    ...args: any[]
  ) => Promise<any>
  on: InternalActions
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

export interface CyPromptOptions {
  Cypress: CypressInternal
  cy: Cypress.cy
  // Note that the eventManager is present in same origin AUTs, but not cross origin
  // so we need to check for it's presence before using it
  eventManager?: CyPromptEventManager
}

export interface CyPromptDriverDefaultShape {
  createCyPrompt: (
    options: CyPromptOptions
  ) => (text: string, commandOptions?: object) => Promise<void>
}
