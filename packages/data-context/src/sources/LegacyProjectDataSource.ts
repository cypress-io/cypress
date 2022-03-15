import type { DataContext } from '..'
import { CurrentProjectDataSource } from './CurrentProjectDataSource'

export class LegacyProjectDataSource extends CurrentProjectDataSource {
  constructor (protected ctx: DataContext, projectRoot: string) {
    super(ctx, projectRoot)
  }
}
