import { nxs, NxsResult } from 'nexus-decorators'
import type { BaseContext } from '../context/BaseContext'
import { LocalProject } from './LocalProject'
import { Browser } from './Browser'
import type { FoundBrowser } from '@packages/types'

@nxs.objectType({
  description: 'Namespace for information related to the app',
})
export class App {
  private _browsers: FoundBrowser[] = []

  constructor (private ctx: BaseContext) {}

  @nxs.field.nonNull.boolean({
    description: 'Whether this is the first open of the application or not',
  })
  static get isFirstOpen (): NxsResult<'App', 'isFirstOpen'> {
    return true
  }

  @nxs.field.type(() => LocalProject, {
    description: 'Active project',
  })
  get activeProject (): NxsResult<'App', 'activeProject'> {
    // TODO: Figure out how to model project and dashboard project relationship
    return this.ctx.localProjects[0]!
  }

  @nxs.field.nonNull.list.nonNull.type(() => LocalProject, {
    description: 'All known projects for the app',
  })
  get projects (): NxsResult<'App', 'projects'> {
    return this.ctx.localProjects
  }

  @nxs.field.nonNull.list.nonNull.type(() => Browser, {
    description: 'Browsers found that are compatible with Cypress',
  })
  get browsers (): NxsResult<'App', 'browsers'> {
    return this._browsers.map((x) => new Browser(x))
  }

  setBrowsers (browsers: FoundBrowser[]): void {
    this._browsers = browsers
  }
}
