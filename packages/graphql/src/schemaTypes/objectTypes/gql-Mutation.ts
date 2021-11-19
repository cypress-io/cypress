import { arg, booleanArg, enumType, idArg, mutationType, nonNull, stringArg } from 'nexus'
import { CodeGenTypeEnum } from '../enumTypes/gql-CodeGenTypeEnum'
import { CodeLanguageEnum, FrontendFrameworkEnum, SupportedBundlerEnum, TestingTypeEnum } from '../enumTypes/gql-WizardEnums'
import { WizardUpdateInput } from '../inputTypes/gql-WizardUpdateInput'
import { CodeGenResultWithFileParts } from './gql-CodeGenResult'
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

    t.liveMutation('clearActiveProject', {
      resolve: async (_, args, ctx) => {
        await ctx.actions.project.clearActiveProject()
        ctx.actions.wizard.resetWizard()
      },
    })

    t.liveMutation('wizardUpdate', {
      description: 'Updates the different fields of the wizard data store',
      args: {
        input: nonNull(arg({
          type: WizardUpdateInput,
        })),
      },
      resolve: async (_, args, ctx) => {
        if (ctx.coreData.currentProject?.isMissingConfigFile) {
          await ctx.actions.project.createConfigFile(args.input.testingType)
        }

        if (args.input.testingType) {
          ctx.actions.wizard.setTestingType(args.input.testingType)
        }

        if (args.input.direction) {
          ctx.actions.wizard.navigate(args.input.direction)
        }
      },
    })

    t.liveMutation('wizardSetFramework', {
      description: 'Sets the frontend framework we want to use for the project',
      args: { framework: nonNull(FrontendFrameworkEnum) },
      resolve: async (_, args, ctx) => {
        await ctx.actions.wizard.setFramework(args.framework)
      },
    })

    // TODO: Move these 3 to a single wizardUpdate(input: WizardUpdateInput!)
    t.liveMutation('wizardSetBundler', {
      description: 'Sets the frontend bundler we want to use for the project',
      args: {
        bundler: nonNull(SupportedBundlerEnum),
      },
      resolve: async (_, args, ctx) => {
        await ctx.actions.wizard.setBundler(args.bundler)
      },
    })

    t.liveMutation('wizardSetCodeLanguage', {
      description: 'Sets the language we want to use for the config file',
      args: { language: nonNull(CodeLanguageEnum) },
      resolve: async (_, args, ctx) => {
        await ctx.actions.wizard.setCodeLanguage(args.language)
      },
    })

    t.liveMutation('launchpadSetBrowser', {
      description: 'Sets the active browser',
      args: {
        id: nonNull(idArg({
          description: 'ID of the browser that we want to set',
        })),
      },
      resolve: async (_, args, ctx) => {
        await ctx.actions.app.setActiveBrowserById(args.id)
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

    t.liveMutation('initializeOpenProject', {
      description: 'Initializes open_project global singleton to manager current project state',
      resolve: async (_, args, ctx) => {
        try {
          await ctx.actions.wizard.initializeOpenProject()
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

    t.liveMutation('launchOpenProject', {
      description: 'Launches project from open_project global singleton',
      args: {
        specPath: stringArg(),
      },
      resolve: async (_, args, ctx) => {
        await ctx.actions.project.launchProject(ctx.wizardData.chosenTestingType, {}, args.specPath)
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

    t.liveMutation('setActiveProject', {
      description: 'Set active project to run tests on',
      args: {
        path: nonNull(stringArg()),
      },
      resolve: async (_, args, ctx) => {
        try {
          await ctx.actions.project.setActiveProject(args.path)
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

    t.liveMutation('setAutoScrollingEnabled', {
      type: 'Boolean',
      args: {
        value: nonNull(booleanArg()),
      },
      resolve: async (_, args, ctx) => {
        await ctx.actions.localSettings.setDevicePreference('autoScrollingEnabled', args.value)

        return true
      },
    })

    t.liveMutation('setUseDarkSidebar', {
      type: 'Boolean',
      args: {
        value: nonNull(booleanArg()),
      },
      resolve: async (_, args, ctx) => {
        await ctx.actions.localSettings.setDevicePreference('useDarkSidebar', args.value)

        return true
      },
    })

    t.liveMutation('setWatchForSpecChange', {
      type: 'Boolean',
      args: {
        value: nonNull(booleanArg()),
      },
      resolve: async (_, args, ctx) => {
        await ctx.actions.localSettings.setDevicePreference('watchForSpecChange', args.value)

        return true
      },
    })

    t.liveMutation('setPreferredEditorBinary', {
      type: 'Boolean',
      args: {
        value: nonNull(stringArg()),
      },
      resolve: async (_, args, ctx) => {
        await ctx.actions.localSettings.setDevicePreference('preferredEditorBinary', args.value)

        return true
      },
    })

    t.liveMutation('showElectronOnAppExit', {
      description: 'show the launchpad at the browser picker step',
      resolve: (_, args, ctx) => {
        ctx.actions.electron.showElectronOnAppExit()
      },
    })
  },
})
