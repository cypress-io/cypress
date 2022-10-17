import dedent from 'dedent'
import { interfaceType } from 'nexus'

export const ProjectLike = interfaceType({
  name: 'ProjectLike',
  description: 'Common base fields inherited by GlobalProject / CurrentProject',
  definition (t) {
    t.nonNull.string('projectRoot', {
      description: 'Absolute path to the project on the filesystem',
    })

    t.string('projectId', {
      description: 'Used to associate project with Cypress Dashboard',
      resolve: (source, args, ctx) => ctx.project.maybeGetProjectId(source),
    })

    t.nonNull.string('title', {
      resolve: (source, args, ctx) => ctx.project.projectTitle(source.projectRoot),
    })

    t.remoteField('cloudProjectRemote', {
      type: 'CloudProjectResult',
      remoteQueryField: 'cloudProjectBySlug',
      description: dedent`
        A refetchable remote field implementation to fetch the cloudProject,
        this can safely be used when rendering a list of projects
      `,
      queryArgs: async (source, args, ctx) => {
        const projectId = await ctx.project.maybeGetProjectId(source)

        if (projectId) {
          return { slug: projectId }
        }

        return false
      },
    })
  },
  resolveType (root) {
    return 'GlobalProject'
  },
  sourceType: {
    module: '@packages/data-context/src/data/coreDataShape',
    export: 'ProjectShape',
  },
})
