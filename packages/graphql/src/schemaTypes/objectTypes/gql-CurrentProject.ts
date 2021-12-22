import { nonNull, objectType, stringArg } from 'nexus'
import path from 'path'
import { BaseError } from '.'
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

    t.field('errorLoadingConfigFile', {
      type: BaseError,
      description: 'If there is an error loading the config file, it is represented here',
    })

    t.field('errorLoadingNodeEvents', {
      type: BaseError,
      description: 'If there is an error related to the node events, it is represented here',
    })

    t.boolean('isLoadingConfigFile', {
      description: 'Whether we are currently loading the configFile',
    })

    t.boolean('isLoadingNodeEvents', {
      description: 'Whether we are currently loading the setupNodeEvents',
    })

    t.field('currentTestingType', {
      description: 'The mode the interactive runner was launched in',
      type: TestingTypeEnum,
      resolve: (_, args, ctx) => ctx.coreData.currentTestingType,
    })

    t.field('currentBrowser', {
      type: Browser,
      description: 'The currently selected browser for the application',
      resolve: (source, args, ctx) => {
        return ctx.coreData.chosenBrowser
      },
    })

    t.list.nonNull.field('browsers', {
      type: Browser,
      description: 'Browsers found that are compatible with Cypress',
    })

    t.field('cloudProject', {
      type: 'CloudProjectResult',
      description: 'The remote associated project from Cypress Cloud',
      resolve: async (source, args, ctx, info) => {
        const projectId = await ctx.project.projectId()

        if (!projectId) {
          return null
        }

        return cloudProjectBySlug(projectId, ctx, info)
      },
    })

    t.string('projectId', {
      description: 'Used to associate project with Cypress cloud',
      resolve: (source, args, ctx) => ctx.project.projectId(),
    })

    t.boolean('isCTConfigured', {
      description: 'Whether the user configured this project to use Component Testing',
      resolve: (source, args, ctx) => {
        return ctx.lifecycleManager.isTestingTypeConfigured('component')
      },
    })

    t.boolean('isE2EConfigured', {
      description: 'Whether the user configured this project to use e2e Testing',
      resolve: (source, args, ctx) => {
        return ctx.lifecycleManager.isTestingTypeConfigured('e2e')
      },
    })

    t.boolean('needsLegacyConfigMigration', {
      description: 'Whether the project needs to be migrated before proceeding',
      resolve (source, args, ctx) {
        return ctx.lifecycleManager.metaState.needsCypressJsonMigration
      },
    })

    // t.list.field('testingTypes', {
    //   type: TestingTypeInfo,
    // })

    t.connectionField('specs', {
      description: 'Specs for a project conforming to Relay Connection specification',
      type: Spec,
      nodes: (source, args, ctx) => {
        return ctx.project.findSpecs(source.projectRoot, ctx.coreData.currentTestingType === 'component' ? 'component' : 'integration')
      },
    })

    t.nonNull.json('config', {
      description: 'Project configuration',
      resolve: (source, args, ctx) => {
        return ctx.project.getResolvedConfigFields()
      },
    })

    t.string('configFile', {
      description: 'Config File, specified by the CLI or ',
      resolve: (source, args, ctx) => {
        return ctx.lifecycleManager.configFile.toString()
      },
    })

    t.string('configFileAbsolutePath', {
      description: 'Config File Absolute Path',
      resolve: async (source, args, ctx) => {
        return ctx.lifecycleManager.configFilePath
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
  sourceType: {
    module: '@packages/data-context/src/data/ProjectLifecycleManager',
    export: 'ProjectLifecycleManager',
  },
})
