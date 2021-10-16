import { arg, booleanArg, enumType, idArg, mutationType, nonNull, stringArg } from 'nexus'
import { CodeLanguageEnum, FrontendFrameworkEnum, NavItemEnum, SupportedBundlerEnum } from '../enumTypes/gql-WizardEnums'
import { WizardUpdateInput } from '../inputTypes/gql-WizardUpdateInput'
import { Wizard } from './gql-Wizard'

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

    t.field('internal_triggerIpcToLaunchpad', {
      type: 'Boolean',
      args: {
        msg: nonNull(stringArg()),
      },
      resolve: (_, args, ctx) => {
        ctx.emitter.toLaunchpad(args.msg)

        return true
      },
    })

    t.field('internal_triggerIpcToApp', {
      type: 'Boolean',
      resolve: (_, args, ctx) => {
        ctx.emitter.toApp('someData')

        return true
      },
    })

    t.field('internal_clearLatestProjectCache', {
      type: 'Boolean',
      resolve: (_, args, ctx) => {
        ctx.actions.project.clearLatestProjectCache()

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
        if (args.input.testingType) {
          await ctx.actions.wizard.setTestingType(args.input.testingType)
        }

        if (args.input.direction) {
          await ctx.actions.wizard.navigate(args.input.direction)
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

    t.field('wizardInstallDependencies', {
      type: Wizard,
      description: 'Installs the dependencies for the component testing step',
      resolve: (_, args, ctx) => {
        // ctx.wizardData
        return ctx.wizardData
      },
    })

    t.field('wizardValidateManualInstall', {
      type: Wizard,
      description: 'Validates that the manual install has occurred properly',
      resolve: (_, args, ctx) => {
        ctx.actions.wizard.validateManualInstall()

        return ctx.wizardData
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
        await ctx.actions.app.setActiveBrowser(args.id)
      },
    })

    t.liveMutation('appCreateConfigFile', {
      args: {
        code: nonNull('String'),
        configFilename: nonNull('String'),
      },
      description: 'Create a Cypress config file for a new project',
      resolve: async (_, args, ctx) => {
        await ctx.actions.project.createConfigFile(args)
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

    t.liveMutation('generateSpecFromStory', {
      description: 'Generate spec from Storybook story',
      args: {
        storyPath: nonNull('String'),
      },
      resolve: async (_, args, ctx) => {
        if (!ctx.activeProject) {
          throw Error(`Cannot set spec without active project!`)
        }

        await ctx.actions.storybook.generateSpecFromStory(args.storyPath)
      },
    })

    t.liveMutation('navigationMenuSetItem', {
      description: 'Set the current navigation item',
      args: { type: nonNull(NavItemEnum) },
      resolve: async (_, args, ctx) => {
        await ctx.actions.wizard.setSelectedNavItem(args.type)
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
        } catch (error: any) {
          ctx.coreData.baseError = {
            header: 'Cypress Configuration Error',
            message: error.message,
            stack: error.stack,
          }
        }
      },
    })

    t.liveMutation('launchOpenProject', {
      description: 'Launches project from open_project global singleton',
      resolve: async (_, args, ctx) => {
        if (!ctx.wizardData.chosenTestingType) {
          throw Error('Cannot launch project without chosen testing type')
        }

        await ctx.actions.project.launchProject(ctx.wizardData.chosenTestingType, {})
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
        await ctx.actions.project.setActiveProject(args.path)
      },
    })

    t.liveMutation('setCurrentSpec', {
      description: 'Set the current spec under test',
      args: {
        id: nonNull(idArg()),
      },
      resolve: async (_, args, ctx) => {
        if (!ctx.activeProject) {
          throw Error(`Cannot set spec without active project!`)
        }

        await ctx.actions.project.setCurrentSpec(args.id)
      },
    })
  },
})
