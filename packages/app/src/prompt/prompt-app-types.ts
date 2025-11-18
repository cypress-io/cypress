// Note: This file is owned by the cloud delivered
// `cy-prompt` bundle. It is downloaded and copied to the app.
// It should not be modified directly in the app.

import type Emitter from 'component-emitter'

const SPEC_DIRTY_DATA_MODULES = Object.freeze({
  STUDIO: {
    name: 'Studio',
  },
})

export type SpecDirtyDataModule =
  (typeof SPEC_DIRTY_DATA_MODULES)[keyof typeof SPEC_DIRTY_DATA_MODULES]

export type SpecDirtyDataModuleKey = keyof typeof SPEC_DIRTY_DATA_MODULES

export interface SpecDirtyDataStore {
  setDirtyStateForKey: (key: SpecDirtyDataModuleKey, isDirty: boolean) => void
  getDirtyStateForKey: (key: SpecDirtyDataModuleKey) => boolean
  getDirtyModules: () => SpecDirtyDataModule[]
  isDirty: () => boolean
  resetDirtyState: () => void
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
