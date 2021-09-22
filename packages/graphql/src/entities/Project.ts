import { objectType } from 'nexus'

export const Project = objectType({
  name: 'Project',
  description: 'A Cypress Project is represented by a cypress.json file',
  node: 'projectRoot',
  definition (t) {
    t.field('cloudProject', {
      type: 'CloudProject',
      description: 'The remote associated project from Cypress Cloud',
      resolve: (source, args, ctx, info) => {
        return source.projectId ? ctx.cloudProjectBySlug(source.projectId, info) : null
      },
    })

    t.string('projectId', {
      description: 'Used to associate project with Cypress cloud',
    })

    t.nonNull.string('projectRoot')
    t.nonNull.string('title', {
      resolve: () => `TODO: Title`,
    })

    t.nonNull.boolean('isFirstTimeCT', {
      description: 'Whether the user configured this project to use Component Testing',
    })

    t.nonNull.boolean('isFirstTimeE2E', {
      description: 'Whether the user configured this project to use e2e Testing',
    })
  },
})

// @nxs.objectType({
//   description: 'A Cypress project is a container',
// })
// export class Project implements ProjectContract {
//   _ctPluginsInitialized: boolean = false
//   _e2ePluginsInitialized: boolean = false
//   constructor (private _projectRoot: string, protected ctx: BaseContext) {}
//   @nxs.field.nonNull.id()
//   id (): NxsResult<'Project', 'id'> {
//     return this.projectRoot
//   }
//   @nxs.field.nonNull.string()
//   title (): NxsResult<'Project', 'title'> {
//     return 'Title'
//   }
//   @nxs.field.string({
//     description: 'Used to associate project with Cypress cloud',
//   })
//   async projectId (): Promise<NxsResult<'Project', 'projectId'>> {
//     try {
//       return await this.ctx.actions.getProjectId(this.projectRoot)
//     } catch (e) {
//       // eslint-disable-next-line
//       console.error(e)
//       return null
//     }
//   }
//   @nxs.field.nonNull.string()
//   get projectRoot (): NxsResult<'Project', 'projectRoot'> {
//     return this._projectRoot
//   }
//   @nxs.field.type(() => ResolvedConfig)
//   resolvedConfig (): NxsResult<'Project', 'resolvedConfig'> {
//     const cfg = this.ctx.actions.resolveOpenProjectConfig()
//     if (!cfg) {
//       throw Error('openProject.getConfig is null. Have you initialized the current project?')
//     }
//     return new ResolvedConfig(cfg.resolved)
//   }
//   @nxs.field.type(() => 'CloudProject')
//   async cloudProject (args: unknown, ctx: NxsCtx, info: GraphQLResolveInfo): Promise<NxsResult<'Project', 'cloudProject'>> {
//     // TODO: Tim: fix this, we shouldn't be awaiting projectId here
//     const projId = await this.projectId()
//     if (projId) {
//       return this.ctx.cloudProjectsBySlug(projId, info) as any
//     }
//     return null
//   }
//   @nxs.field.nonNull.boolean({
//     description: 'Whether the user configured this project to use Component Testing',
//   })
//   get isFirstTimeCT (): NxsResult<'Project', 'isFirstTimeCT'> {
//     return this.ctx.actions.isFirstTime(this.projectRoot, 'component')
//   }
//   @nxs.field.nonNull.boolean({
//     description: 'Whether the user configured this project to use e2e Testing',
//   })
//   get isFirstTimeE2E (): NxsResult<'Project', 'isFirstTimeE2E'> {
//     return this.ctx.actions.isFirstTime(this.projectRoot, 'e2e')
//   }
//   setE2EPluginsInitialized (init: boolean): void {
//     this._e2ePluginsInitialized = init
//   }
//   get e2ePluginsInitialized (): boolean {
//     return this._e2ePluginsInitialized
//   }
//   setCtPluginsInitialized (init: boolean): void {
//     this._ctPluginsInitialized = init
//   }
//   get ctPluginsInitialized (): boolean {
//     return this._ctPluginsInitialized
//   }
// }
