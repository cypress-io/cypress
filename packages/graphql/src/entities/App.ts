import { nxs, NxsResult } from 'nexus-decorators'
import type { BaseContext } from '../context/BaseContext'
import { Browser } from './Browser'
import { LocalProject } from './LocalProject'

@nxs.objectType({
  description: 'Namespace for information related to the app',
})
export class App {
  private activeProjectRoot?: string
  private _browserCache: Browser[] = []

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
    return this.ctx.localProjects.find((x) => x.projectRoot === this.activeProjectRoot) ?? null
  }

  @nxs.field.nonNull.list.nonNull.type(() => LocalProject, {
    description: 'All known projects for the app',
  })
  get projects (): NxsResult<'App', 'projects'> {
    return this.ctx.localProjects
  }

  setActiveProject (projectRoot: string): void {
    this.activeProjectRoot = projectRoot
  }

  @nxs.field.nonNull.list.nonNull.type(() => Browser, {
    description: 'All known projects for the app',
  })
  async browsers (): Promise<NxsResult<'App', 'browsers'>> {
    if (this.browserCache) {
      return this.browserCache
    }

    const cache = await this.cacheBrowsers()

    return cache
  }

  async cacheBrowsers (): Promise<Browser[]> {
    const found = await this.ctx.actions.getBrowsers()
    const browsers = found.map((x) => new Browser(x))

    this._browserCache = browsers

    return browsers
  }

  get browserCache (): Browser[] | null {
    return this._browserCache.length ? this._browserCache : null
  }
}
