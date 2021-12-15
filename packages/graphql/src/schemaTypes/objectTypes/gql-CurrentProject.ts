import { nonNull, objectType, stringArg } from 'nexus'
import path from 'path'
import { cloudProjectBySlug } from '../../stitching/remoteGraphQLCalls'
import { TestingTypeEnum } from '../enumTypes/gql-WizardEnums'
import { Browser } from './gql-Browser'
import { CodeGenGlobs } from './gql-CodeGenGlobs'
import { FileParts } from './gql-FileParts'
import { ProjectPreferences } from './gql-ProjectPreferences'
import { Spec } from './gql-Spec'
import { Storybook } from './gql-Storybook'

export const CurrentProject = objectType({
  name: 'CurrentProject',
  description: 'The currently opened Cypress project, represented by a cypress.config.{ts|js} file',
  node: 'projectRoot',
  definition (t) {
    t.implements('ProjectLike')

    t.nonNull.boolean('isRefreshingBrowsers', {
      description: 'Whether we are currently refreshing the browsers list',
      resolve: (source, args, ctx) => Boolean(ctx.appData.refreshingBrowsers),
    })

    t.field('currentTestingType', {
      description: 'The mode the interactive runner was launched in',
      type: TestingTypeEnum,
      resolve: (_, args, ctx) => ctx.wizard.chosenTestingType,
    })

    t.field('currentBrowser', {
      type: Browser,
      description: 'The currently selected browser for the application',
      resolve: (source, args, ctx) => {
        return ctx.wizardData.chosenBrowser
      },
    })

    t.list.nonNull.field('browsers', {
      type: Browser,
      description: 'Browsers found that are compatible with Cypress',
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

    t.nonNull.boolean('isCTConfigured', {
      description: 'Whether the user configured this project to use Component Testing',
      resolve: (source, args, ctx) => {
        return ctx.project.isTestingTypeConfigured(source.projectRoot, 'component')
      },
    })

    t.nonNull.boolean('isE2EConfigured', {
      description: 'Whether the user configured this project to use e2e Testing',
      resolve: (source, args, ctx) => {
        return ctx.project.isTestingTypeConfigured(source.projectRoot, 'e2e')
      },
    })

    t.connectionField('specs', {
      description: 'Specs for a project conforming to Relay Connection specification',
      type: Spec,
      nodes: (source, args, ctx) => {
        return ctx.project.findSpecs(source.projectRoot, ctx.appData.currentTestingType === 'component' ? 'component' : 'integration')
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

    t.string('configFileAbsolutePath', {
      description: 'Config File Absolute Path',
      resolve: async (source, args, ctx) => {
        const config = await ctx.project.getConfig(source.projectRoot)

        if (!ctx.currentProject || !config.configFile) {
          return null
        }

        return path.join(ctx.currentProject.projectRoot, config.configFile)
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
      type: Storybook,
      resolve: (source, args, ctx) => ctx.storybook.loadStorybookInfo(),
    })

    t.nonNull.field('codeGenGlobs', {
      type: CodeGenGlobs,
      resolve: (src, args, ctx) => ctx.project.getCodeGenGlobs(),
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

    t.string('branch', {
      description: 'The current branch of the project',
      resolve: async (source, args, ctx) => {
        const branchName = await ctx.git.getBranch(source.projectRoot)

        return branchName
      },
    })
  },

})
