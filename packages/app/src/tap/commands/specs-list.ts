import type { FoundSpec } from '@packages/types'

export interface SpecListEntry {
  /** Project-relative spec path — the form `cypress run --spec` accepts. */
  relativePath: string
  /** Whether the spec is an end-to-end (integration) or component spec. */
  specType: FoundSpec['specType']
}

export const getRunnableSpecs = (): FoundSpec[] => {
  return (window.__RUN_MODE_SPECS__ ?? []) as FoundSpec[]
}

export const toSpecListEntry = ({ relative, specType }: FoundSpec): SpecListEntry => {
  return { relativePath: relative, specType }
}
