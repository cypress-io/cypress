import { PACKAGE_MANAGERS } from '@packages/types'
import { enumType, nonNull, objectType, stringArg } from 'nexus'
import path from 'path'
import { BrowserStatusEnum, FileExtensionEnum } from '..'
import { TestingTypeEnum } from '../enumTypes/gql-WizardEnums'
import { Browser } from './gql-Browser'
import { CodeGenGlobs } from './gql-CodeGenGlobs'
import { FileParts } from './gql-FileParts'
import { ProjectPreferences } from './gql-ProjectPreferences'
import { Spec } from './gql-Spec'

export const PackageManagerEnum = enumType({
  name: 'PackageManagerEnum',
  members: PACKAGE_MANAGERS,
})

export const CurrentProject = objectType({
  name: 'CurrentProject',
  description: 'The currently opened Cypress project, represented by a cypress.config.{js,ts,mjs,cjs} file',
  node: 'projectRoot',
  definition (t) {
    t.implements('ProjectLike')

    t.nonNull.field('packageManager', {
      type: PackageManagerEnum,
      resolve: (source, args, ctx) => ctx.coreData.packageManager,
    })

    t.boolean('isLoadingConfigFile', {
      description: 'Whether we are currently loading the configFile',
    })

    t.boolean('isLoadingNodeEvents', {
      description: 'Whether we are currently loading the setupNodeEvents',
    })

    t.boolean('isFullConfigReady', {
      description: 'Whether or not the full config is ready',
    })

    t.field('currentTestingType', {
      description: 'The mode the interactive runner was launched in',
      type: TestingTypeEnum,
      resolve: (_, args, ctx) => ctx.coreData.currentTestingType,
    })

    t.field('activeBrowser', {
      type: Browser,
      description: 'The currently selected browser for the project',
      resolve: (source, args, ctx) => {
        return ctx.coreData.activeBrowser
      },
    })

    t.list.nonNull.field('browsers', {
      type: Browser,
      description: 'Browsers found that are compatible with Cypress',
    })

    t.field('cloudProject', {
      type: 'CloudProjectResult',
      description: 'The remote associated project from Cypress Dashboard',
      resolve: async (source, args, ctx, info) => {
        const projectId = await ctx.project.projectId()

        if (!projectId) {
          return null
        }

        return ctx.cloud.delegateCloudField({
          field: 'cloudProjectBySlug',
          args: { slug: projectId },
          ctx,
          info,
        })
      },
    })

    t.string('projectId', {
      description: 'Used to associate project with Cypress Dashboard',
      resolve: (source, args, ctx) => ctx.project.projectId(),
    })

    t.boolean('isCTConfigured', {
      description: 'Whether the user configured this project to use Component Testing',
      resolve: (source, args, ctx) => {
        // If the forceReconfigureProject for component is set, we want to notify
        // the client side that the wizard has to start from the beginning
        if (ctx.coreData.forceReconfigureProject?.component) {
          return false
        }

        return ctx.lifecycleManager.isTestingTypeConfigured('component')
      },
    })

    t.boolean('isE2EConfigured', {
      description: 'Whether the user configured this project to use e2e Testing',
      resolve: (source, args, ctx) => {
        // If the forceReconfigureProject for e2e is set, we want to notify
        // the client side that the wizard has to start from the beginning
        if (ctx.coreData.forceReconfigureProject?.e2e) {
          return false
        }

        return ctx.lifecycleManager.isTestingTypeConfigured('e2e')
      },
    })

    t.boolean('needsLegacyConfigMigration', {
      description: 'Whether the project needs to be migrated before proceeding',
      resolve (source, args, ctx) {
        return ctx.migration.needsCypressJsonMigration()
      },
    })

    t.boolean('hasValidConfigFile', {
      description: 'Whether the project has a valid config file',
      resolve (source, args, ctx) {
        return ctx.lifecycleManager.metaState.hasValidConfigFile
      },
    })

    t.boolean('isUsingTypeScript', {
      description: 'Whether the project has Typescript',
      resolve (source, args, ctx) {
        return ctx.lifecycleManager.metaState.isUsingTypeScript
      },
    })

    t.field('fileExtensionToUse', {
      type: FileExtensionEnum,
      description: 'File extension to use based on if the project has typescript or not',
      resolve: (source, args, ctx) => {
        return ctx.lifecycleManager.fileExtensionToUse
      },
    })

    t.string('defaultSpecFileName', {
      description: 'Default spec file name for spec creation, nullable so we can throw if it can\'t be decided',
      resolve: (source, args, ctx) => {
        return ctx.project.defaultSpecFileName()
      },
    })

    t.nonNull.list.nonNull.field('specs', {
      description: 'A list of specs for the currently open testing type of a project',
      type: Spec,
      resolve: (source, args, ctx) => {
        return ctx.project.specs
      },
    })

    t.nonNull.json('config', {
      description: 'Project configuration',
      resolve: (source, args, ctx) => {
        return ctx.project.getResolvedConfigFields()
      },
    })

    t.nonNull.json('serveConfig', {
      description: 'base64 encoded config used on the runner page',
      resolve: (source, args, ctx) => {
        return ctx.html.makeServeConfig()
      },
    })

    t.json('savedState', {
      description: 'Project saved state',
      resolve: (source, args, ctx) => {
        return ctx.project.getCurrentProjectSavedState()
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
        return source.git?.currentBranch ?? null
      },
    })

    t.nonNull.boolean('isDefaultSpecPattern', {
      description: 'True if the project is using the default spec pattern',
      resolve: async (source, args, ctx) => ctx.project.getIsDefaultSpecPattern(),
    })

    t.nonNull.field('browserStatus', {
      type: BrowserStatusEnum,
      description: 'If the browser is open or not',
      resolve: (source, args, ctx) => ctx.coreData.app.browserStatus,
    })
  },
  sourceType: {
    module: '@packages/data-context/src/data/ProjectLifecycleManager',
    export: 'ProjectLifecycleManager',
  },
})
