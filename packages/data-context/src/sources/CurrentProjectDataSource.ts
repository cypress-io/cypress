import type { DataContext } from '..'

export class CurrentProjectDataSource {
  readonly isConfigLoaded = false
  constructor (protected ctx: DataContext, readonly projectRoot: string) {}
}
