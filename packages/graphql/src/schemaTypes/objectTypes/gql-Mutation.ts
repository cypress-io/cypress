import { arg, booleanArg, enumType, idArg, mutationType, nonNull, stringArg, list } from 'nexus'
import { Wizard } from './gql-Wizard'
import { CodeGenTypeEnum } from '../enumTypes/gql-CodeGenTypeEnum'
import { TestingTypeEnum } from '../enumTypes/gql-WizardEnums'
import { FileDetailsInput } from '../inputTypes/gql-FileDetailsInput'
import { WizardUpdateInput } from '../inputTypes/gql-WizardUpdateInput'
import { CurrentProject } from './gql-CurrentProject'
import { GenerateSpecResponse } from './gql-GenerateSpecResponse'
import { Query } from './gql-Query'
import { ScaffoldedFile } from './gql-ScaffoldedFile'
import { WIZARD_BUNDLERS, WIZARD_FRAMEWORKS } from '@packages/scaffold-config'

export const mutation = mutationType({
  definition (t) {
    t.field('copyTextToClipboard', {
      type: 'Boolean',
      description: 'add the passed text to the local clipboard',
      args: {
        text: nonNull(stringArg()),
      },
      resolve: (_, { text }, ctx) => {
        ctx.electronApi.copyTextToClipboard(text)

        return true
      },
    })

    t.field('resetErrorAndLoadConfig', {
      type: Query,
      description: 'Resets error and attempts to reload the config',
      args: {
        id: nonNull(idArg()),
      },
      resolve: async (_, args, ctx) => {
        ctx.actions.error.clearError(args.id)
        await ctx.lifecycleManager.refreshLifecycle().catch((e) => ctx.lifecycleManager.onLoadError(e))

        return {}
      },
    })

    t.field('devRelaunch', {
      type: 'Boolean',
      description: 'Development only: Triggers or dismisses a prompted refresh by touching the file watched by our development scripts',
      args: {
        action: nonNull(enumType({
          name: 'DevRelaunchAction',
          members: ['trigger', 'dismiss'],
        }).asArg()),
      },
      resolve: async (_, args, ctx) => {
        if (args.action === 'trigger') {
          ctx.actions.dev.triggerRelaunch()
        } else {
          ctx.actions.dev.dismissRelaunch()
        }

        return true
      },
    })

    t.nonNull.boolean('matchesSpecPattern', {
      description: 'Check if a give spec file will match the project spec pattern',
      args: {
        specFile: nonNull(stringArg()),
      },
      resolve: (source, args, ctx) => {
        if (!ctx.currentProject) {
          return false
        }

        return ctx.project.matchesSpecPattern(args.specFile)
      },
    })

    t.field('internal_clearLatestProjectCache', {
      type: 'Boolean',
      resolve: async (_, args, ctx) => {
        await ctx.actions.project.clearLatestProjectCache()

        return true
      },
    })

    t.field('openExternal', {
      type: 'Boolean',
      args: {
        url: nonNull(stringArg()),
        includeGraphqlPort: booleanArg(),
      },
      resolve: (_, args, ctx) => {
        let url = args.url

        // the `port` param is included in external links to create a cloud organization
        // so that the app can be notified when the org has been created
        if (args.includeGraphqlPort && process.env.CYPRESS_INTERNAL_GRAPHQL_PORT) {
          const joinCharacter = args.url.includes('?') ? '&' : '?'

          url = `${args.url}${joinCharacter}port=${process.env.CYPRESS_INTERNAL_GRAPHQL_PORT}`
        }

        ctx.actions.electron.openExternal(url)

        return true
      },
    })

    t.field('internal_clearProjectPreferencesCache', {
      type: 'Boolean',
      args: {
        projectTitle: nonNull(stringArg()),
      },
      resolve: async (_, args, ctx) => {
        await ctx.actions.project.clearProjectPreferencesCache(args.projectTitle)

        return true
      },
    })

    t.field('internal_clearAllProjectPreferencesCache', {
      type: 'Boolean',
      resolve: async (_, args, ctx) => {
        await ctx.actions.project.clearAllProjectPreferencesCache()

        return true
      },
    })

    t.field('scaffoldTestingType', {
      type: 'Query',
      resolve: async (_, args, ctx) => {
        await ctx.actions.wizard.scaffoldTestingType()

        return {}
      },
    })

    t.field('completeSetup', {
      type: 'Query',
      resolve: async (_, args, ctx) => {
        await ctx.actions.wizard.completeSetup()

        return {}
      },
    })

    t.field('clearCurrentProject', {
      type: 'Query',
      description: 'Clears the currently active project',
      resolve: async (_, args, ctx) => {
        await ctx.actions.project.clearCurrentProject()
        ctx.actions.wizard.resetWizard()

        return {}
      },
    })

    t.field('clearCurrentTestingType', {
      type: 'Query',
      resolve: (_, args, ctx) => {
        ctx.lifecycleManager.setAndLoadCurrentTestingType(null)

        return {}
      },
    })

    t.field('setAndLoadCurrentTestingType', {
      type: 'Query',
      args: {
        testingType: nonNull(arg({ type: TestingTypeEnum })),
      },
      resolve: async (source, args, ctx) => {
        ctx.actions.project.setAndLoadCurrentTestingType(args.testingType)

        // if necessary init the wizard for configuration
        if (ctx.coreData.currentTestingType && !ctx.lifecycleManager.isTestingTypeConfigured(ctx.coreData.currentTestingType)) {
          // Component Testing has a wizard to help users configure their project
          if (ctx.coreData.currentTestingType === 'component') {
            ctx.actions.wizard.initialize()
          } else {
            // E2E doesn't have such a wizard, we just create/update their cypress.config.js.
            await ctx.actions.wizard.scaffoldTestingType()
          }
        }

        return {}
      },
    })

    t.field('setPromptShown', {
      type: 'Boolean',
      description: 'Save the prompt-shown state for this project',
      args: { slug: nonNull('String') },
      resolve: (_, args, ctx) => {
        ctx.actions.project.setPromptShown(args.slug)

        return true
      },
    })

    t.field('wizardUpdate', {
      type: Wizard,
      description: 'Updates the different fields of the wizard data store',
      args: {
        input: nonNull(arg({ type: WizardUpdateInput })),
      },
      resolve: async (source, args, ctx) => {
        if (args.input.framework) {
          ctx.actions.wizard.setFramework(WIZARD_FRAMEWORKS.find((x) => x.type === args.input.framework) ?? null)
        }

        if (args.input.bundler) {
          ctx.actions.wizard.setBundler(WIZARD_BUNDLERS.find((x) => x.type === args.input.bundler) ?? null)
        }

        // TODO: remove when live-mutations are implements
        // signal to launchpad to reload the data context
        ctx.emitter.toLaunchpad()

        return ctx.wizardData
      },
    })

    t.field('launchpadSetBrowser', {
      type: CurrentProject,
      description: 'Sets the active browser',
      args: {
        id: nonNull(idArg({
          description: 'ID of the browser that we want to set',
        })),
      },
      async resolve (_, args, ctx) {
        await ctx.actions.browser.setActiveBrowserById(args.id)

        return ctx.lifecycleManager
      },
    })

    t.field('generateSpecFromSource', {
      type: GenerateSpecResponse,
      description: 'Generate spec from source',
      args: {
        codeGenCandidate: nonNull(stringArg()),
        type: nonNull(CodeGenTypeEnum),
        erroredCodegenCandidate: stringArg(),
      },
      resolve: (_, args, ctx) => {
        return ctx.actions.project.codeGenSpec(args.codeGenCandidate, args.type, args.erroredCodegenCandidate)
      },
    })

    t.nonNull.list.nonNull.field('scaffoldIntegration', {
      type: ScaffoldedFile,
      resolve: (src, args, ctx) => {
        return ctx.actions.project.scaffoldIntegration()
      },
    })

    t.field('login', {
      type: Query,
      description: 'Auth with Cypress Dashboard',
      args: {
        utmMedium: nonNull(stringArg()),
        utmSource: nonNull(stringArg()),
      },
      resolve: async (_, args, ctx) => {
        await ctx.actions.auth.login(args.utmSource, args.utmMedium)

        return {}
      },
    })

    t.field('logout', {
      type: Query,
      description: 'Log out of Cypress Dashboard',
      resolve: async (_, args, ctx) => {
        await ctx.actions.auth.logout()

        return {}
      },
    })

    t.field('launchOpenProject', {
      type: CurrentProject,
      description: 'Launches project from open_project global singleton',
      args: {
        specPath: stringArg(),
      },
      resolve: async (_, args, ctx) => {
        await ctx.actions.project.launchProject(ctx.coreData.currentTestingType, {}, args.specPath)

        return ctx.lifecycleManager
      },
    })

    t.field('addProject', {
      type: Query,
      description: 'Add project to projects array and cache it',
      args: {
        path: stringArg(),
        open: booleanArg({ description: 'Whether to open the project when added' }),
      },
      resolve: async (_, args, ctx) => {
        ctx.actions.wizard.resetWizard()
        let path = args.path

        if (!path) {
          await ctx.actions.project.addProjectFromElectronNativeFolderSelect()

          return {}
        }

        await ctx.actions.project.addProject({
          ...args,
          path,
        })

        return {}
      },
    })

    t.field('removeProject', {
      type: Query,
      description: 'Remove project from projects array and cache',
      args: {
        path: nonNull(stringArg()),
      },
      resolve: async (_, args, ctx) => {
        await ctx.actions.project.removeProject(args.path)

        return {}
      },
    })

    t.field('setCurrentProject', {
      type: Query,
      description: 'Set active project to run tests on',
      args: {
        path: nonNull(stringArg()),
      },
      resolve: async (_, args, ctx) => {
        await ctx.actions.project.setCurrentProject(args.path)

        return {}
      },
    })

    t.nonNull.field('setProjectPreferences', {
      type: Query,
      description: 'Save the projects preferences to cache',
      args: {
        testingType: nonNull(TestingTypeEnum),
      },
      async resolve (_, args, ctx) {
        await ctx.actions.project.setProjectPreferences(args)

        return {}
      },
    })

    t.nonNull.field('resetAuthState', {
      type: Query,
      description: 'Reset the Auth State',
      resolve (_, args, ctx) {
        ctx.actions.auth.resetAuthState()

        return {}
      },
    })

    t.nonNull.field('resetWizard', {
      type: 'Boolean',
      description: 'Reset the Wizard to the starting position',
      resolve: (_, args, ctx) => {
        ctx.actions.wizard.resetWizard()
        ctx.actions.electron.refreshBrowserWindow()

        return true
      },
    })

    t.nonNull.field('resetLatestVersionTelemetry', {
      type: 'Boolean',
      description: 'Resets the latest version call to capture additional telemetry for the current user',
      resolve: async (_, args, ctx) => {
        ctx.actions.versions.resetLatestVersionTelemetry()

        return true
      },
    })

    t.nonNull.field('focusActiveBrowserWindow', {
      type: 'Boolean',
      description: 'Sets focus to the active browser window',
      resolve: async (_, args, ctx) => {
        await ctx.actions.browser.focusActiveBrowserWindow()

        return true
      },
    })

    t.nonNull.field('reconfigureProject', {
      type: 'Boolean',
      description: 'show the launchpad windows',
      resolve: async (_, args, ctx) => {
        ctx.actions.project.setForceReconfigureProjectByTestingType({ forceReconfigureProject: true })
        await ctx.actions.project.reconfigureProject()

        return true
      },
    })

    t.field('setPreferences', {
      type: Query,
      description: [
        'Update local preferences (also known as  appData).',
        'The payload, `value`, should be a `JSON.stringified()`',
        'object of the new values you\'d like to persist.',
        'Example: `setPreferences (value: JSON.stringify({ lastOpened: Date.now() }))`',
      ].join(' '),
      args: {
        value: nonNull(stringArg()),
      },
      resolve: async (_, args, ctx) => {
        await ctx.actions.localSettings.setPreferences(args.value)

        return {}
      },
    })

    t.field('openDirectoryInIDE', {
      description: 'Open a path in preferred IDE',
      type: 'Boolean',
      args: {
        path: nonNull(stringArg()),
      },
      resolve: (_, args, ctx) => {
        ctx.actions.project.openDirectoryInIDE(args.path)

        return true
      },
    })

    t.field('openInFinder', {
      description: 'Open a path in the local file explorer',
      type: 'Boolean',
      args: {
        path: nonNull(stringArg()),
      },
      resolve: (_, args, ctx) => {
        ctx.actions.electron.showItemInFolder(args.path)

        return true
      },
    })

    t.field('openFileInIDE', {
      description: 'Open a file on specified line and column in preferred IDE',
      type: 'Boolean',
      args: {
        input: nonNull(arg({
          type: FileDetailsInput,
        })),
      },
      resolve: (_, args, ctx) => {
        ctx.actions.file.openFile(
          args.input.filePath,
          args.input.line || 1,
          args.input.column || 1,
        )

        return true
      },
    })

    t.field('migrateRenameSpecs', {
      description: 'While migrating to 10+ renames files to match the new .cy pattern',
      type: Query,
      args: {
        skip: booleanArg(),
        before: list(nonNull(stringArg({
          description: 'specs to move - current name',
        }))),
        after: list(nonNull(stringArg({
          description: 'specs to move - current name',
        }))),
      },
      resolve: async (_, { skip, before, after }, ctx) => {
        if (!skip && before && after) {
          await ctx.actions.migration.renameSpecFiles(before, after)
        }

        await ctx.actions.migration.nextStep()

        return {}
      },
    })

    t.field('migrateRenameSpecsFolder', {
      description: 'When the user decides to skip specs rename',
      type: Query,
      resolve: async (_, args, ctx) => {
        await ctx.actions.migration.renameSpecsFolder()
        await ctx.actions.migration.nextStep()

        return {}
      },
    })

    t.field('migrateSkipManualRename', {
      description: 'While migrating to 10+ skip manual rename step',
      type: Query,
      resolve: async (_, args, ctx) => {
        await ctx.actions.migration.nextStep()

        return {}
      },
    })

    t.field('migrateCloseManualRenameWatcher', {
      description: 'While migrating to 10+ skip manual rename step',
      type: 'Boolean',
      resolve: async (_, args, ctx) => {
        await ctx.actions.migration.closeManualRenameWatcher()

        return true
      },
    })

    t.field('finishedRenamingComponentSpecs', {
      description: 'user has finished migration component specs - move to next step',
      type: Query,
      resolve: async (_, args, ctx) => {
        await ctx.actions.migration.nextStep()

        return {}
      },
    })

    t.field('migrateRenameSupport', {
      description: 'While migrating to 10+ launch renaming of support file',
      type: Query,
      resolve: async (_, args, ctx) => {
        await ctx.actions.migration.renameSupportFile()
        await ctx.actions.migration.nextStep()

        return {}
      },
    })

    t.field('migrateConfigFile', {
      description: 'Transforms cypress.json file into cypress.config.js file',
      type: Query,
      resolve: async (_, args, ctx) => {
        await ctx.actions.migration.createConfigFile()
        await ctx.actions.migration.nextStep()

        return {}
      },
    })

    t.field('migrateComponentTesting', {
      description: 'Merges the component testing config in cypress.config.{js,ts}',
      type: Query,
      resolve: async (_, args, ctx) => {
        await ctx.actions.migration.nextStep()

        return {}
      },
    })

    t.field('setProjectIdInConfigFile', {
      description: 'Set the projectId field in the config file of the current project',
      type: Query,
      args: {
        projectId: nonNull(stringArg()),
      },
      resolve: async (_, args, ctx) => {
        try {
          await ctx.actions.project.setProjectIdInConfigFile(args.projectId)
        } catch {
          // We were unable to set the project id, the error isn't useful
          // to show the user here, because they're prompted to update the id manually
          return null
        }

        // Wait for the project config to be reloaded
        await ctx.lifecycleManager.refreshLifecycle()

        return {}
      },
    })

    t.field('closeBrowser', {
      description: 'Close active browser',
      type: 'Boolean',
      resolve: async (source, args, ctx) => {
        await ctx.actions.browser.closeBrowser()

        return true
      },
    })

    t.field('switchTestingTypeAndRelaunch', {
      description: 'Switch Testing type and relaunch browser',
      type: 'Boolean',
      args: {
        testingType: nonNull(arg({ type: TestingTypeEnum })),
      },
      resolve: async (source, args, ctx) => {
        await ctx.actions.project.switchTestingTypesAndRelaunch(args.testingType)

        return true
      },
    })

    t.field('dismissWarning', {
      type: Query,
      args: {
        id: nonNull(idArg({})),
      },
      description: `Dismisses a warning displayed by the frontend`,
      resolve: (source, args, ctx) => {
        ctx.actions.error.clearWarning(args.id)

        return {}
      },
    })

    t.field('pingBaseUrl', {
      type: Query,
      description: 'Ping configured Base URL',
      resolve: async (source, args, ctx) => {
        await ctx.actions.project.pingBaseUrl()

        return {}
      },
    })

    t.field('refreshOrganizations', {
      type: Query,
      description: 'Clears the cloudViewer cache to refresh the organizations',
      resolve: async (source, args, ctx) => {
        await ctx.cloud.invalidate('Query', 'cloudViewer')

        return {}
      },
    })

    t.field('refetchRemote', {
      type: Query,
      description: 'Signal that we are explicitly refetching remote data and should not use the server cache',
      resolve: () => {
        return {
          requestPolicy: 'network-only',
        } as const
      },
    })

    t.boolean('_clearCloudCache', {
      description: 'Internal use only, clears the cloud cache',
      resolve: (source, args, ctx) => {
        ctx.cloud.reset()

        return true
      },
    })

    t.json('_showUrqlCache', {
      description: 'Internal use only, clears the cloud cache',
      resolve: async (source, args, ctx) => {
        const { data } = await ctx.cloud.getCache()

        return data
      },
    })
  },
})
