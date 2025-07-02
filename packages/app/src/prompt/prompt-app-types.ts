// Note: This file is owned by the cloud delivered
// cy-prompt bundle. It is downloaded and copied to the app.
// It should not be modified directly in the app.

import type Emitter from 'component-emitter'

export interface CypressInternal extends Cypress.Cypress {
  backendRequestHandler: (
    backendRequestNamespace: string,
    eventName: string,
    ...args: any[]
  ) => Promise<any>
  preserveRunState: (testId: string) => Promise<void>
}

export interface GetCodeModalContentsProps {
  Cypress: CypressInternal
  testId: string
  logId: string
  onClose: () => void
}

export type GetCodeModalContentsShape = (
  props: GetCodeModalContentsProps
) => JSX.Element

export interface CyPromptEventManager {
  ws: Emitter
  localBus: Emitter
  rerunSpec: () => void
}

export interface MoreInfoNeededModalContentsProps {
  Cypress: CypressInternal
  eventManager: CyPromptEventManager
  testId: string
  logId: string
  onClose: () => void
}

export type MoreInfoNeededModalContentsShape = (
  props: MoreInfoNeededModalContentsProps
) => JSX.Element

export interface CyPromptAppDefaultShape {
  // Purposefully do not use React in this signature to avoid conflicts when this type gets
  // transferred to the Cypress app
  GetCodeModalContents: GetCodeModalContentsShape
  MoreInfoNeededModalContents: MoreInfoNeededModalContentsShape
}
