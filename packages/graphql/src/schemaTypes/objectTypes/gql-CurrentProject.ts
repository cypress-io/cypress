import { nonNull, objectType, stringArg } from 'nexus'
import path from 'path'
import { ApplicationError } from '.'
import { cloudProjectBySlug } from '../../stitching/remoteGraphQLCalls'
import { CodeGenTypeEnum } from '../enumTypes/gql-CodeGenTypeEnum'
import { Browser } from './gql-Browser'
import { FileParts } from './gql-FileParts'
import { ProjectPreferences } from './gql-ProjectPreferences'

export const CurrentProject = objectType({
  name: 'CurrentProject',
  description: 'The currently opened Cypress project, represented by a cypress.config.{ts|js} file',
  node: 'projectRoot',
  definition (t) {
    t.implements('ProjectLike')

    t.field('currentTestingType', {
      description: 'The mode the interactive runner was launched in',
      type: 'TestingTypeEnum',
      resolve: (source, args, ctx) => source.currentTestingType ?? null,
    })

    t.field('currentBrowser', {
      type: Browser,
      description: 'The currently selected browser for the application',
      resolve: (source, args, ctx) => source.currentBrowser ?? null,
    })

    t.list.nonNull.field('browsers', {
      type: Browser,
      description: 'Browsers found that are compatible with Cypress',
      resolve: (source, args, ctx) => {
        if (source.isLoadingConfig) {
          return null
        }

        return source.browsers ?? null
      },
    })

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
      resolve: (source, args, ctx) => ctx.project.projectId(source.projectRoot),
    })

    t.string('browserErrorMessage', {
      description: 'An error related to finding a browser',
      resolve: (source, args, ctx) => {
        return source.browserErrorMessage ?? null
      },
    })

    t.nonNull.boolean('isCTConfigured', {
      description: 'Whether the user configured this project to use Component Testing',
      resolve: (source, args, ctx) => {
        return ctx.project.isCTConfigured()
      },
    })

    t.nonNull.boolean('isE2EConfigured', {
      description: 'Whether the user configured this project to use e2e Testing',
      resolve: (source, args, ctx) => {
        return ctx.project.isE2EConfigured()
      },
    })

    t.connectionField('specs', {
      description: 'Specs for a project conforming to Relay Connection specification',
      type: 'Spec',
      nodes: (source, args, ctx) => {
        return ctx.project.findSpecs(ctx.currentProject?.currentTestingType === 'component' ? 'component' : 'integration').then(() => {
          return []
        })
      },
    })

    t.nonNull.boolean('needsOnboarding', {
      description: 'Whether this is a newly setup project and needs onboarding',
      resolve: (source, args, ctx) => ctx.project.needsOnboarding(),
    })

    t.nonNull.boolean('isLoadingConfig', {
      description: 'Whether we are currently loading the config',
    })

    t.field('errorLoadingConfig', {
      type: ApplicationError,
      description: 'An error encountered while loading the config',
    })

    t.nonNull.boolean('isLoadingPlugins', {
      description: 'Whether we are currently loading the plugins',
    })

    t.field('errorLoadingPlugins', {
      type: ApplicationError,
      description: 'An error encountered while loading the plugins',
    })

    t.json('config', {
      description: 'Project configuration',
      resolve: (source, args, ctx) => {
        return ctx.project.getResolvedConfigFields()
      },
    })

    t.string('configFilePath', {
      description: 'Config File Path',
      resolve: async (source, args, ctx) => {
        return source.config?.configFile ?? null
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
      resolve: (source, args, ctx) => {
        return ctx.project.getCodeGenCandidates(args.glob)
      },
    })
  },
  sourceType: {
    module: '@packages/data-context/src/data/coreDataShape',
    export: 'CurrentProjectShape',
  },
})
