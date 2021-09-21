import { DataActions } from './DataActions'
import { AppDataSource } from './sources/AppDataSource'
import { ProjectDataSource } from './sources/ProjectDataSource'
import { cached } from './util/cached'

interface DataContextConfig {
  cache: unknown
}

export class DataContext {
  constructor (private config: DataContextConfig) {}

  /**
   * All mutations (update / delete / create), fs writes, etc.
   * should run through this namespace. Everything else should be a "getter"
   */
  @cached
  get actions () {
    return new DataActions(this)
  }

  @cached
  get app () {
    return new AppDataSource(this)
  }

  @cached
  get project () {
    return new ProjectDataSource(this)
  }
}
