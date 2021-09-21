import type { GraphQLResolveInfo } from 'graphql'
import { intArg, nonNull, stringArg } from 'nexus'
import { nxs, NxsCtx, NxsResult } from 'nexus-decorators'
import { SpecTypeEnum } from '../constants'
import type { BaseContext } from '../context/BaseContext'
import type { ProjectContract } from '../contracts/ProjectContract'
import type { NexusGenArgTypes } from '../gen/nxs.gen'
import { ResolvedConfig } from './ResolvedConfig'
import { SpecConnection } from './SpecConnection'

@nxs.objectType({
  description: 'A Cypress project is a container',
})
export class Project implements ProjectContract {
  _ctPluginsInitialized: boolean = false
  _e2ePluginsInitialized: boolean = false

  constructor (private _projectRoot: string, protected ctx: BaseContext) {}

  @nxs.field.nonNull.id()
  id (): NxsResult<'Project', 'id'> {
    return this.projectRoot
  }

  @nxs.field.nonNull.string()
  title (): NxsResult<'Project', 'title'> {
    return 'Title'
  }

  @nxs.field.string({
    description: 'Used to associate project with Cypress cloud',
  })
  async projectId (): Promise<NxsResult<'Project', 'projectId'>> {
    try {
      return await this.ctx.actions.getProjectId(this.projectRoot)
    } catch (e) {
      // eslint-disable-next-line
      console.error(e)

      return null
    }
  }

  /**
   * todo(lachlan): decorator to enforce all
   * connections conform to Relay connection spec
   * first/last/before/after
   */
  @nxs.field.type(() => SpecConnection, {
    args: {
      specType: SpecTypeEnum,
      first: nonNull(intArg()),
      last: intArg(),
      before: stringArg(),
      after: stringArg()
    }
  })
  async specs (args: NexusGenArgTypes['Project']['specs']): Promise<NxsResult<'Project', 'specs'>> {
    const config = this.resolvedConfig()
    const specs = await this.ctx.actions.getSpecs({
      projectRoot: this.projectRoot,
      fixturesFolder: config?.fixturesFolder?.value ?? false,
      supportFile: config?.supportFile?.value ?? false,
      testFiles: config?.testFiles?.value ?? [],
      ignoreTestFiles: config?.ignoreTestFiles?.value as string[] ?? [],
      componentFolder: config?.componentFolder?.value ?? false,
      integrationFolder: config?.integrationFolder?.value ?? '',
    })

    return new SpecConnection(args, specs)
  }

  @nxs.field.nonNull.string()
  get projectRoot (): NxsResult<'Project', 'projectRoot'> {
    return this._projectRoot
  }

  @nxs.field.type(() => ResolvedConfig)
  resolvedConfig (): NxsResult<'Project', 'resolvedConfig'> {
    const cfg = this.ctx.actions.resolveOpenProjectConfig()

    if (!cfg) {
      throw Error('openProject.getConfig is null. Have you initialized the current project?')
    }

    return new ResolvedConfig(cfg.resolved)
  }

  @nxs.field.type(() => 'CloudProject')
  async cloudProject (args: unknown, ctx: NxsCtx, info: GraphQLResolveInfo): Promise<NxsResult<'Project', 'cloudProject'>> {
    // TODO: Tim: fix this, we shouldn't be awaiting projectId here
    const projId = await this.projectId()

    if (projId) {
      return this.ctx.cloudProjectsBySlug(projId, info) as any
    }

    return null
  }

  @nxs.field.nonNull.boolean({
    description: 'Whether the user configured this project to use Component Testing',
  })
  get isFirstTimeCT (): NxsResult<'Project', 'isFirstTimeCT'> {
    return this.ctx.actions.isFirstTime(this.projectRoot, 'component')
  }

  @nxs.field.nonNull.boolean({
    description: 'Whether the user configured this project to use e2e Testing',
  })
  get isFirstTimeE2E (): NxsResult<'Project', 'isFirstTimeE2E'> {
    return this.ctx.actions.isFirstTime(this.projectRoot, 'e2e')
  }

  setE2EPluginsInitialized (init: boolean): void {
    this._e2ePluginsInitialized = init
  }

  get e2ePluginsInitialized (): boolean {
    return this._e2ePluginsInitialized
  }

  setCtPluginsInitialized (init: boolean): void {
    this._ctPluginsInitialized = init
  }

  get ctPluginsInitialized (): boolean {
    return this._ctPluginsInitialized
  }
}
