import type { FoundSpec } from '@packages/types'

export interface SpecListEntry {
  /** Project-relative spec path — the form `cypress run --spec` accepts. */
  relative: string
  specType: 'integration' | 'component'
}

export const readRunModeSpecs = (): FoundSpec[] => {
  return (window.__RUN_MODE_SPECS__ ?? []) as FoundSpec[]
}

export const toSpecListEntry = ({ relative, specType }: FoundSpec): SpecListEntry => {
  return { relative, specType }
}
