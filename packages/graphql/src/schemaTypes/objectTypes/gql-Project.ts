import { nonNull, objectType, stringArg } from 'nexus'
import path from 'path'
import { ProjectPreferences } from '.'
import { cloudProjectBySlug } from '../../stitching/remoteGraphQLCalls'
import { CodeGenTypeEnum } from '../enumTypes/gql-CodeGenTypeEnum'
import { FileParts } from './gql-FileParts'

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

        if (!projectId) {
          return null
        }

        return cloudProjectBySlug(projectId, ctx, info)
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
        return ctx.project.isFirstTimeAccessing(source.projectRoot, 'e2e')
      },
    })

    t.field('currentSpec', {
      description: 'Currently selected spec',
      type: 'Spec',
      resolve: (source, args, ctx) => {
        if (!ctx.activeProject || !ctx.activeProject.currentSpecId) {
          return null
        }

        return ctx.project.getCurrentSpecById(source.projectRoot, ctx.activeProject.currentSpecId)
      },
    })

    t.connectionField('specs', {
      description: 'Specs for a project conforming to Relay Connection specification',
      type: 'Spec',
      nodes: (source, args, ctx) => {
        return ctx.project.findSpecs(source.projectRoot, ctx.appData.activeTestingType === 'component' ? 'component' : 'integration')
      },
    })

    t.nonNull.json('config', {
      description: 'Project configuration',
      resolve: (source, args, ctx) => {
        return ctx.project.getResolvedConfigFields(source.projectRoot)
      },
    })

    t.string('configFilePath', {
      description: 'Config File Path',
      resolve: async (source, args, ctx) => {
        const config = await ctx.project.getConfig(source.projectRoot)

        return config.configFile ?? null
      },
    })

    t.field('preferences', {
      type: ProjectPreferences,
      description: 'Cached preferences for this project',
      resolve: (source, args, ctx) => {
        return ctx.project.getProjectPreferences(path.basename(source.projectRoot))
      },
    })

    t.field('storybook', {
      type: 'Storybook',
      resolve: (source, args, ctx) => ctx.storybook.loadStorybookInfo(),
    })

    t.nonNull.string('codeGenGlob', {
      description: 'Glob pattern for component searching',
      args: {
        type: nonNull(CodeGenTypeEnum),
      },
      resolve: (src, args, ctx) => ctx.project.getCodeGenGlob(args.type),
    })

    t.list.field('codeGenCandidates', {
      type: FileParts,
      description: 'List of all code generation candidates stories',
      args: {
        glob: nonNull(stringArg()),
      },
      resolve: async (source, args, ctx) => {
        const result = await ctx.project.getCodeGenCandidates(args.glob)

        return result
      },
    })
  },
  sourceType: {
    module: __dirname,
    export: 'ProjectShape',
  },
})
