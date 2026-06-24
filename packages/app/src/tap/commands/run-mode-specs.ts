import type { FoundSpec } from '@packages/types'

export interface SpecListEntry {
  /** Project-relative spec path — the form `cypress run --spec` accepts. */
  relative: string
  specType: 'integration' | 'component'
}

/**
 * The server embeds `ctx.project.specs` in the runner HTML at serve time
 * (HtmlDataSource.replaceBody): a snapshot from the last page load — spec
 * files added or removed since then won't show until the runner reloads.
 * The global is declared as SpecFile[], but the embedded entries carry the
 * full found-spec shape.
 */
export const readRunModeSpecs = (): FoundSpec[] => {
  return (window.__RUN_MODE_SPECS__ ?? []) as FoundSpec[]
}

export const toSpecListEntry = ({ relative, specType }: FoundSpec): SpecListEntry => {
  return { relative, specType }
}
