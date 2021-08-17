import { inputObjectType, mutationType, nonNull } from 'nexus'
import { BundlerEnum, FrontendFrameworkEnum, NavItemEnum, TestingTypeEnum, WizardNavigateDirectionEnum } from '../constants'

export const mutation = mutationType({
  definition (t) {
    // TODO(tim): in nexus, support for t.wizard(...)

    t.field('wizardSetTestingType', {
      type: 'Wizard',
      description: 'Sets the current testing type we want to use',
      args: { type: nonNull(TestingTypeEnum) },
      resolve: (root, args, ctx) => ctx.wizard.setTestingType(args.type),
    })

    t.field('wizardSetFramework', {
      type: 'Wizard',
      description: 'Sets the frontend framework we want to use for the project',
      args: { framework: nonNull(FrontendFrameworkEnum) },
      resolve: (_, args, ctx) => ctx.wizard.setFramework(args.framework),
    })

    // TODO: Move these 3 to a single wizardUpdate(input: WizardUpdateInput!)
    t.field('wizardSetBundler', {
      type: 'Wizard',
      description: 'Sets the frontend bundler we want to use for the project',
      args: {
        bundler: nonNull(BundlerEnum),
      },
      resolve: (root, args, ctx) => ctx.wizard.setBundler(args.bundler),
    })

    t.field('wizardSetManualInstall', {
      type: 'Wizard',
      description: 'Sets the frontend bundler we want to use for the project',
      args: {
        isManual: nonNull('Boolean'),
      },
      resolve: (root, args, ctx) => ctx.wizard.setManualInstall(args.isManual),
    })

    t.field('wizardNavigateForward', {
      type: 'Wizard',
      description: 'Navigates forward in the wizard',
      resolve: (_, __, ctx) => ctx.wizard.navigate('forward'),
    })

    t.field('wizardNavigate', {
      type: 'Wizard',
      args: {
        direction: nonNull(WizardNavigateDirectionEnum),
      },
      description: 'Navigates backward in the wizard',
      resolve: (_, args, ctx) => ctx.wizard.navigate(args.direction),
    })

    t.field('wizardInstallDependencies', {
      type: 'Wizard',
      description: 'Installs the dependencies for the component testing step',
      resolve: (root, args, ctx) => ctx.wizard,
    })

    t.field('wizardValidateManualInstall', {
      type: 'Wizard',
      description: 'Validates that the manual install has occurred properly',
      resolve: (root, args, ctx) => {
        return ctx.wizard.validateManualInstall()
      },
    })

    t.field('appCreateConfigFile', {
      type: 'App',
      args: {
        code: nonNull('String'),
        configFilename: nonNull('String'),
      },
      description: 'Create a Cypress config file for a new project',
      resolve: (root, args, ctx) => {
        // if (!ctx.activeProject) {
        //   throw Error('Cannot write config file without an active project')
        // }

        ctx.actions.createConfigFile({ ...args })

        return ctx.app
      },
    })

    t.nonNull.field('addProject', {
      type: 'LocalProject',
      description: 'Adds a new project to the app',
      args: {
        input: nonNull(
          inputObjectType({
            name: 'AddProjectInput',
            definition (t) {
              t.nonNull.string('projectRoot')
              t.string('projectId')
              t.boolean('isActiveProject')
            },
          }),
        ),
      },
      async resolve (_root, args, ctx) {
        const addedProject = await ctx.actions.addProject(args.input)

        return addedProject
      },
    })

    t.field('navigationMenuSetItem', {
      type: 'NavigationMenu',
      description: 'Set the current navigation item',
      args: { type: nonNull(NavItemEnum) },
      resolve: (root, args, ctx) => ctx.navigationMenu.setSelectedItem(args.type),
    })

    t.field('login', {
      type: 'Viewer',
      description: 'Auth with Cypress Cloud',
      async resolve (_root, args, ctx) {
        // already authenticated this session - just return
        if (ctx.viewer) {
          return ctx.viewer
        }

        await ctx.actions.authenticate()

        return ctx.viewer
      },
    })

    t.field('logout', {
      type: 'Viewer',
      description: 'Log out of Cypress Cloud',
      async resolve (_root, args, ctx) {
        await ctx.actions.logout()

        return ctx.viewer
      },
    })

    t.field('initializePlugins', {
      type: 'LocalProject',
      description: 'initializes the plugins and sets the resolved configuration object on project base',
      async resolve (_root, args, ctx) {
        await ctx.activeProject?.initializePlugins() ?? null

        return ctx.activeProject
      },
    })

    t.field('initializeProject', {
      type: 'LocalProject',
      description: 'creates a new project base associated with the local project, wrapping existing (legacy) functionality',
      resolve (_root, args, ctx) {
        ctx.activeProject?.initializeProject() ?? null

        return ctx.activeProject
      },
    })
  },
})
