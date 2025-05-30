import type Emitter from 'component-emitter'

export interface CypressInternal extends Cypress.Cypress {
  backendRequestHandler: (backendRequestNamespace: string, emitter: Emitter, eventName: string, ...args: any[]) => Promise<any>
  primaryOriginCommunicator: import('eventemitter2').EventEmitter2 & {
    toSpecBridge: (origin: string, event: string, data?: any, responseEvent?: string) => void
    userInvocationStack?: string
  }
}

export interface CyPromptEventManager {
  ws: Emitter
}

export interface CyPromptOptions {
  Cypress: CypressInternal
  cy: Cypress.cy
  eventManager: CyPromptEventManager
}

export interface CyPromptDriverDefaultShape {
  createCyPrompt: (options: CyPromptOptions) => (text: string, commandOptions?: object) => Promise<void>
}
