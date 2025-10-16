// Note: This file is owned by the cloud delivered
// `cy-prompt` bundle. It is downloaded and copied to the app.
// It should not be modified directly in the app.

import type Emitter from 'component-emitter'

export interface SpecDirtyDataModule {
  name: string
}

export interface SpecDirtyDataStore {
  setDirtyStateForKey: (key: string, isDirty: boolean) => void
  getDirtyModules: () => SpecDirtyDataModule[]
}

export interface CypressInternal extends Cypress.Cypress {
  backendRequestHandler: (
    backendRequestNamespace: string,
    eventName: string,
    ...args: any[]
  ) => Promise<any>
  preserveRunState: (testId: string) => Promise<void>
  areSourceMapsAvailable?: boolean
}

export interface GetCodeModalContentsProps {
  Cypress: CypressInternal
  eventManager: CyPromptEventManager
  testId: string
  logId: string
  onClose: () => void
  specDirtyDataStore?: SpecDirtyDataStore
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
  specDirtyDataStore?: SpecDirtyDataStore
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
