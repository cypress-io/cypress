import { idArg, mutationType, nonNull, stringArg } from 'nexus'
import { FrontendFrameworkEnum, NavItemEnum, SupportedBundlerEnum, TestingTypeEnum, WizardNavigateDirectionEnum } from '../enumTypes/gql-WizardEnums'
import { Wizard } from './gql-Wizard'

export const mutation = mutationType({
  definition (t) {
    t.field('wizardSetTestingType', {
      type: Wizard,
      description: 'Sets the current testing type we want to use',
      args: { type: nonNull(TestingTypeEnum) },
      resolve: (root, args, ctx) => {
        return ctx.actions.wizard.setTestingType(args.type)
      },
    })

    t.field('wizardSetFramework', {
      type: Wizard,
      description: 'Sets the frontend framework we want to use for the project',
      args: { framework: nonNull(FrontendFrameworkEnum) },
      resolve: (_, args, ctx) => ctx.actions.wizard.setFramework(args.framework),
    })

    // TODO: Move these 3 to a single wizardUpdate(input: WizardUpdateInput!)
    t.field('wizardSetBundler', {
      type: Wizard,
      description: 'Sets the frontend bundler we want to use for the project',
      args: {
        bundler: nonNull(SupportedBundlerEnum),
      },
      resolve: (root, args, ctx) => ctx.actions.wizard.setBundler(args.bundler),
    })

    t.field('wizardNavigate', {
      type: Wizard,
      args: {
        direction: nonNull(WizardNavigateDirectionEnum),
      },
      description: 'Navigates backward in the wizard',
      resolve: (_, args, ctx) => ctx.actions.wizard.navigate(args.direction),
    })

    t.field('wizardInstallDependencies', {
      type: Wizard,
      description: 'Installs the dependencies for the component testing step',
      resolve: (root, args, ctx) => {
        // ctx.wizardData
        return ctx.wizardData
      },
    })

    t.field('wizardValidateManualInstall', {
      type: Wizard,
      description: 'Validates that the manual install has occurred properly',
      resolve: (root, args, ctx) => {
        ctx.actions.wizard.validateManualInstall()

        return ctx.wizardData
      },
    })

    t.field('launchpadSetBrowser', {
      type: 'Query',
      description: 'Sets the active browser',
      args: {
        id: nonNull(idArg({
          description: 'ID of the browser that we want to set',
        })),
      },
      resolve: (root, args, ctx) => {
        ctx.actions.app.setActiveBrowser(args.id)

        return {}
      },
    })

    t.field('appCreateConfigFile', {
      type: 'App',
      args: {
        code: nonNull('String'),
        configFilename: nonNull('String'),
      },
      description: 'Create a Cypress config file for a new project',
      resolve: async (root, args, ctx) => {
        await ctx.actions.project.createConfigFile(args)

        return ctx.appData
      },
    })

    t.field('navigationMenuSetItem', {
      type: 'NavigationMenu',
      description: 'Set the current navigation item',
      args: { type: nonNull(NavItemEnum) },
      resolve: (root, args, ctx) => {
        ctx.actions.wizard.setSelectedNavItem(args.type)

        return ctx.wizard
      },
    })

    t.field('login', {
      type: 'Query',
      description: 'Auth with Cypress Cloud',
      async resolve (_root, args, ctx) {
        await ctx.actions.auth.login()

        return {}
      },
    })

    t.field('logout', {
      type: 'Query',
      description: 'Log out of Cypress Cloud',
      async resolve (_root, args, ctx) {
        await ctx.actions.auth.logout()

        return {}
      },
    })

    t.field('initializeOpenProject', {
      type: 'Wizard',
      description: 'Initializes open_project global singleton to manager current project state',
      async resolve (_root, args, ctx) {
        await ctx.actions.wizard.initializeOpenProject()

        return ctx.wizardData
      },
    })

    t.field('launchOpenProject', {
      type: 'App',
      description: 'Launches project from open_project global singleton',
      async resolve (_root, args, ctx) {
        await ctx.actions.project.launchProject()

        return ctx.appData
      },
    })

    t.nonNull.field('addProject', {
      type: 'App',
      description: 'Add project to projects array and cache it',
      args: {
        path: nonNull(stringArg()),
      },
      async resolve (_root, args, ctx) {
        await ctx.actions.project.addProject(args.path)

        return ctx.appData
      },
    })

    t.nonNull.field('setActiveProject', {
      type: 'App',
      description: 'Set active project to run tests on',
      args: {
        path: nonNull(stringArg()),
      },
      async resolve (_root, args, ctx) {
        await ctx.actions.project.setActiveProject(args.path)

        return ctx.coreData.app
      },
    })
  },
})
