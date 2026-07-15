import type { FoundSpec } from '@packages/types'

/** `relative` is the project-relative spec path — the form `cypress run --spec` accepts. */
export type SpecListEntry = Pick<FoundSpec, 'relative' | 'specType'>

export const getRunnableSpecs = (): FoundSpec[] => {
  return (window.__RUN_MODE_SPECS__ ?? []) as FoundSpec[]
}

export const toSpecListEntry = ({ relative, specType }: FoundSpec): SpecListEntry => {
  return { relative, specType }
}
