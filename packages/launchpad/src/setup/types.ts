import type {
  SupportedBundlers,
} from '../generated/graphql'

interface RootOption {
  name: string
  id: string
  isDetected?: boolean
}

export interface FrameworkOption extends RootOption {
  type: string
  supportStatus: Cypress.ResolvedComponentFrameworkDefinition['supportStatus']
  icon?: string
}

interface BundlerOption extends RootOption {
  type: SupportedBundlers
  disabled?: boolean
}

export type Option = FrameworkOption | BundlerOption
