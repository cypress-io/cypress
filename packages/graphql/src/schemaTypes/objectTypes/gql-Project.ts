import { objectType } from 'nexus'
import { cloudProjectBySlug } from '../../stitching/remoteGraphQLCalls'

export interface ProjectShape {
  projectId?: string | null
  projectRoot: string
}

export const Project = objectType({
  name: 'Project',
  description: 'A Cypress Project is represented by a cypress.json file',
  node: 'projectRoot',
  definition (t) {
    t.field('cloudProject', {
      type: 'CloudProject',
      description: 'The remote associated project from Cypress Cloud',
      resolve: async (source, args, ctx, info) => {
        const projectId = await ctx.project.projectId(source.projectRoot)

        return projectId ? cloudProjectBySlug(projectId, ctx, info) : null
      },
    })

    t.string('projectId', {
      description: 'Used to associate project with Cypress cloud',
      resolve: (source, args, ctx) => ctx.project.projectId(source.projectRoot).then((val) => val ?? null),
    })

    t.nonNull.string('projectRoot')
    t.nonNull.string('title', {
      resolve: (source, args, ctx) => ctx.project.projectTitle(source.projectRoot),
    })

    t.nonNull.boolean('isFirstTimeCT', {
      description: 'Whether the user configured this project to use Component Testing',
      resolve: (source, args, ctx) => {
        return ctx.project.isFirstTimeAccessing(source.projectRoot, 'component')
      },
    })

    t.nonNull.boolean('isFirstTimeE2E', {
      description: 'Whether the user configured this project to use e2e Testing',
      resolve: (source, args, ctx) => {
        return ctx.project.isFirstTimeAccessing(source.projectRoot, 'component')
      },
    })
  },
})
