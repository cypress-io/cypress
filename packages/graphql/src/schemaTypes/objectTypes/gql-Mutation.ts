import { arg, booleanArg, enumType, idArg, mutationType, nonNull, stringArg } from 'nexus'
import { CodeGenTypeEnum } from '../enumTypes/gql-CodeGenTypeEnum'
import { TestingTypeEnum } from '../enumTypes/gql-WizardEnums'
import { FileDetailsInput } from '../inputTypes/gql-FileDetailsInput'
import { WizardUpdateInput } from '../inputTypes/gql-WizardUpdateInput'
import { CodeGenResultWithFileParts } from './gql-CodeGenResult'
import { CurrentProject } from './gql-CurrentProject'
import { GeneratedSpec } from './gql-GeneratedSpec'

export const mutation = mutationType({
  definition (t) {
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
          await ctx.actions.dev.triggerRelaunch()
        } else {
          ctx.actions.dev.dismissRelaunch()
        }

        return true
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
      },
      resolve: (_, args, ctx) => {
        ctx.actions.electron.openExternal(args.url)

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
        ctx.actions.wizard.completeSetup()

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
      resolve: async (_, args, ctx) => {
        ctx.lifecycleManager.setCurrentTestingType(null)

        return {}
      },
    })

    t.field('setCurrentTestingType', {
      type: 'Query',
      args: {
        testingType: nonNull(arg({ type: TestingTypeEnum })),
      },
      resolve: (source, args, ctx) => {
        ctx.actions.project.setCurrentTestingType(args.testingType)

        return {}
      },
    })

    t.liveMutation('wizardUpdate', {
      description: 'Updates the different fields of the wizard data store',
      args: {
        input: nonNull(arg({ type: WizardUpdateInput })),
      },
      resolve: async (source, args, ctx) => {
        if (args.input.bundler !== undefined) {
          ctx.actions.wizard.setBundler(args.input.bundler)
        }

        if (args.input.framework !== undefined) {
          ctx.actions.wizard.setFramework(args.input.framework)
        }

        if (args.input.codeLanguage) {
          ctx.actions.wizard.setCodeLanguage(args.input.codeLanguage)
        }
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
      resolve (_, args, ctx) {
        ctx.actions.app.setActiveBrowserById(args.id)

        return ctx.lifecycleManager
      },
    })

    t.liveMutation('appCreateComponentIndexHtml', {
      args: {
        template: nonNull('String'),
      },
      description: 'Create an Index HTML file for a new component testing project',
      resolve: async (_, args, ctx) => {
        await ctx.actions.project.createComponentIndexHtml(args.template)
      },
    })

    t.liveMutation('generateSpecFromSource', {
      type: GeneratedSpec,
      description: 'Generate spec from source',
      args: {
        codeGenCandidate: nonNull(stringArg()),
        type: nonNull(CodeGenTypeEnum),
      },
      resolve: async (_, args, ctx) => {
        return ctx.actions.project.codeGenSpec(args.codeGenCandidate, args.type)
      },
    })

    t.nonNull.list.nonNull.field('scaffoldIntegration', {
      type: CodeGenResultWithFileParts,
      resolve: (src, args, ctx) => {
        return ctx.actions.project.scaffoldIntegration()
      },
    })

    t.liveMutation('login', {
      description: 'Auth with Cypress Cloud',
      resolve: async (_, args, ctx) => {
        await ctx.actions.auth.login()
      },
    })

    t.liveMutation('logout', {
      description: 'Log out of Cypress Cloud',
      resolve: async (_, args, ctx) => {
        await ctx.actions.auth.logout()
      },
    })

    t.liveMutation('launchOpenProject', {
      description: 'Launches project from open_project global singleton',
      args: {
        specPath: stringArg(),
      },
      resolve: async (_, args, ctx) => {
        try {
          await ctx.actions.project.launchProject(ctx.coreData.currentTestingType, {}, args.specPath)
        } catch (e) {
          ctx.coreData.baseError = e as Error
        }
      },
    })

    t.liveMutation('addProject', {
      description: 'Add project to projects array and cache it',
      args: {
        path: nonNull(stringArg()),
        open: booleanArg({ description: 'Whether to open the project when added' }),
      },
      resolve: async (_, args, ctx) => {
        ctx.actions.wizard.resetWizard()
        await ctx.actions.project.addProject(args)
      },
    })

    t.liveMutation('removeProject', {
      description: 'Remove project from projects array and cache',
      args: {
        path: nonNull(stringArg()),
      },
      resolve: async (_, args, ctx) => {
        await ctx.actions.project.removeProject(args.path)
      },
    })

    t.liveMutation('setCurrentProject', {
      description: 'Set active project to run tests on',
      args: {
        path: nonNull(stringArg()),
      },
      resolve: async (_, args, ctx) => {
        try {
          await ctx.actions.project.setCurrentProject(args.path)
          ctx.coreData.baseError = null
        } catch (error) {
          const e = error as Error

          ctx.coreData.baseError = {
            title: 'Cypress Configuration Error',
            message: e.message,
            stack: e.stack,
          }
        }
      },
    })

    t.nonNull.field('setProjectPreferences', {
      type: 'Query',
      description: 'Save the projects preferences to cache',
      args: {
        testingType: nonNull(TestingTypeEnum),
        browserPath: nonNull(stringArg()),
      },
      async resolve (_, args, ctx) {
        await ctx.actions.project.setProjectPreferences(args)

        return ctx.appData
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

    t.nonNull.field('hideBrowserWindow', {
      type: 'Boolean',
      description: 'Hides the launchpad windows',
      resolve: (_, args, ctx) => {
        ctx.actions.electron.hideBrowserWindow()

        return true
      },
    })

    t.nonNull.field('reconfigureProject', {
      type: 'Boolean',
      description: 'show the launchpad windows',
      resolve: (_, args, ctx) => {
        ctx.actions.project.reconfigureProject()

        return true
      },
    })

    t.liveMutation('setPreferences', {
      type: 'Boolean',
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
      },
    })

    t.liveMutation('showElectronOnAppExit', {
      description: 'show the launchpad at the browser picker step',
      resolve: (_, args, ctx) => {
        ctx.actions.electron.showElectronOnAppExit()
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
          args.input.absolute,
          args.input.line || 1,
          args.input.column || 1,
        )

        return true
      },
    })
  },
})
