import { nonNull, objectType, stringArg } from 'nexus'
import { cloudProjectBySlug } from '../../stitching/remoteGraphQLCalls'
import { TestingTypeEnum, TestingTypeState, CodeGenTypeEnum } from '../enumTypes'
import { ApplicationError } from './gql-ApplicationError'
import { Browser } from './gql-Browser'
import { FileParts } from './gql-FileParts'
import { ProjectPreferences } from './gql-ProjectPreferences'

export const CurrentProject = objectType({
  name: 'CurrentProject',
  description: 'The currently opened Cypress project, represented by a cypress.config.{ts|js} file',
  node: 'projectRoot',
  definition (t) {
    t.implements('ProjectLike')

    t.boolean('needsProjectMigration', {
      description: 'Whether we need to show the Migration screen, if they have a cypress.json file but not cypress.config.js file',
    })

    t.field('currentTestingType', {
      description: 'The mode the interactive runner was launched in',
      type: TestingTypeEnum,
    })

    t.field('e2eSetupState', {
      type: TestingTypeState,
      description: 'For the given "currentTestingType", determine the state of the project',
    })

    t.field('componentSetupState', {
      type: TestingTypeState,
      description: 'For the given "currentTestingType", determine the state of the project',
    })

    t.field('currentBrowser', {
      type: Browser,
      description: 'The currently selected browser for the application',
    })

    t.list.nonNull.field('browsers', {
      type: Browser,
      description: 'Browsers for the project that are configured to run with Cypress. Null if config hasnt been sourced',
      resolve: (source, args, ctx) => {
        return source.loadedConfig()?.browsers ?? null
      },
    })

    t.field('cloudProject', {
      type: 'CloudProject',
      description: 'The remote associated project from Cypress Cloud',
      resolve: async (source, args, ctx, info) => {
        const projectId = source.projectId()

        if (!projectId) {
          return null
        }

        return cloudProjectBySlug(projectId, ctx, info)
      },
    })

    t.string('projectId', {
      description: 'Used to associate project with Cypress cloud',
      resolve: (source, args, ctx) => source.projectId(),
    })

    t.connectionField('specs', {
      description: 'Specs for a project conforming to Relay Connection specification',
      type: 'Spec',
      nodes: (source, args, ctx) => {
        return source.findSpecs(ctx.currentProject?.currentTestingType === 'component' ? 'component' : 'integration')
        .then((val) => val ?? [])
      },
    })

    t.nonNull.boolean('isLoadingConfig', {
      description: 'Whether we are currently loading the config',
    })

    t.field('errorLoadingConfig', {
      type: ApplicationError,
      description: 'An error encountered while loading the config',
      resolve: (o, args, ctx) => ctx.loadingErr(o.data.config),
    })

    t.nonNull.boolean('isLoadingPlugins', {
      description: 'Whether we are currently loading the plugins',
    })

    t.field('errorLoadingPlugins', {
      type: ApplicationError,
      description: 'An error encountered while loading the plugins',
      resolve: (o, args, ctx) => ctx.loadingErr(o.data.pluginLoad),
    })

    t.json('config', {
      description: 'Project configuration, sourced from the config file, or returned from the plugin',
      resolve: (source, args, ctx) => {
        return source.data.config.value ?? null
      },
    })

    t.string('configFilePath', {
      description: 'Config file path',
    })

    t.boolean('configFileExists', {
      description: 'Whether the config file has already been created. Helps determine description',
    })

    t.string('configFileAbsolutePath', {
      description: 'Config File Absolute Path',
      resolve: async (source, args, ctx) => {
        return source.configFilePath
      },
    })

    t.field('preferences', {
      type: ProjectPreferences,
      description: 'Cached preferences for this project',
      resolve: (source, args, ctx) => {
        return source.getProjectPreferences()
      },
    })

    t.field('storybook', {
      type: 'Storybook',
      resolve: (source, args, ctx) => ctx.storybook.loadStorybookInfo(),
    })

    t.string('storybookRoot', {
      description: 'Folder containing storybook configuration files, null if the project does not use storybook',
    })

    t.nonNull.string('codeGenGlob', {
      description: 'Glob pattern for component searching',
      args: {
        type: nonNull(CodeGenTypeEnum),
      },
      resolve: (source, args) => source.getCodeGenGlob(args.type),
    })

    t.list.field('codeGenCandidates', {
      type: FileParts,
      description: 'List of all code generation candidates stories',
      args: {
        glob: nonNull(stringArg()),
      },
      resolve: (source, args) => source.getCodeGenCandidates(args.glob),
    })
  },
})
