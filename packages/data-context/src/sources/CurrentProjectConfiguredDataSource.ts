import type { DataContext } from '../DataContext'
import type { CurrentProjectDataSource } from './CurrentProjectDataSource'

/**
 * Current project + loaded config
 */
export class CurrentProjectConfiguredDataSource {
  readonly isConfigLoaded = true
  constructor (
    private ctx: DataContext,
    readonly currentProject: CurrentProjectDataSource,
  ) {}

  //
}
