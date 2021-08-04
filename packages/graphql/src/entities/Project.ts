import { nxs, NxsResult } from 'nexus-decorators'
import { PluginsState, PluginsStateEnum } from '../constants/projectConstants'
import type { ProjectBaseContract } from '../contracts/ProjectBaseContract'

export interface ProjectConfig {
  isCurrent: boolean
  projectRoot: string
  projectBase: ProjectBaseContract
}

@nxs.objectType({
  description: 'A Cypress project is a container',
})
export class Project implements ProjectBaseContract {
  readonly projectBase: ProjectBaseContract
  private _pluginsState: PluginsState = 'uninitialized'
  private _pluginsErrorMessage?: string
  private _isCurrent: boolean = false

  constructor (private config: ProjectConfig) {
    this.projectBase = config.projectBase
    this._isCurrent = config.isCurrent
  }

  @nxs.field.nonNull.id()
  id (): NxsResult<'Project', 'id'> {
    return this.projectRoot
    // return createHash('sha1').update(this.projectRoot).digest('hex')
  }

  @nxs.field.nonNull.string({
    description: 'The title of the project',
  })
  get title (): NxsResult<'Project', 'title'> {
    return 'design-system' // TODO: make this real
  }

  @nxs.field.nonNull.string()
  get projectRoot (): NxsResult<'Project', 'projectRoot'> {
    return this.config.projectRoot
  }

  @nxs.field.nonNull.boolean()
  get isOpen (): NxsResult<'Project', 'isOpen'> {
    return this.config.projectBase.isOpen
  }

  @nxs.field.nonNull.boolean()
  isCurrent (): NxsResult<'Project', 'isCurrent'> {
    return this._isCurrent
  }

  @nxs.field.type(() => PluginsStateEnum, {
    description: 'Plugin state for a project',
  })
  get pluginsState (): NxsResult<'Project', 'pluginsState'> {
    return this._pluginsState
  }

  @nxs.field.string({
    description: 'If the plugin has errored, contains the associated error message',
  })
  get pluginsErrorMessage (): NxsResult<'Project', 'pluginsErrorMessage'> {
    if (this.pluginsState === 'error') {
      return this._pluginsErrorMessage ?? null
    }

    return null
  }

  createConfigFile ({ code, configFilename }: { code: string, configFilename: string }): void {
    this.projectBase.createConfigFile({ code, configFilename })
  }

  async initializePlugins (): Promise<Project> {
    if (this.pluginsState !== 'uninitialized' && this.pluginsState !== 'error') {
      return this
    }

    try {
      this._pluginsState = 'initializing'
      await this.projectBase.initializePlugins()
      this._pluginsState = 'initialized'
    } catch (e) {
      this._pluginsState = 'error'
      this._pluginsErrorMessage = e.message
    }

    return this
  }
}
