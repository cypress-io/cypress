import Debug from 'debug'
import { mutationType, nonNull } from 'nexus'
import { BundlerEnum, FrontendFrameworkEnum, NavItemEnum, TestingTypeEnum, WizardNavigateDirectionEnum } from '../constants'
import { Query } from './Query'

const debug = Debug('cypress:graphql:mutation')

export const mutation = mutationType({
  definition (t) {
    // TODO(tim): in nexus, support for t.wizard(...)

    t.field('wizardSetTestingType', {
      type: 'Wizard',
      description: 'Sets the current testing type we want to use',
      args: { type: nonNull(TestingTypeEnum) },
      resolve: (root, args, ctx) => {
        return ctx.wizard.setTestingType(args.type)
      },
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
      type: 'Query',
      args: {
        code: nonNull('String'),
        configFilename: nonNull('String'),
      },
      description: 'Create a Cypress config file for a new project',
      resolve: (root, args, ctx) => {
        if (!ctx.activeProject) {
          throw Error('Cannot write config file without an active project')
        }

        ctx.actions.createConfigFile(args.code, args.configFilename)

        return new Query(ctx)
      },
    })

    t.field('navigationMenuSetItem', {
      type: 'NavigationMenu',
      description: 'Set the current navigation item',
      args: { type: nonNull(NavItemEnum) },
      resolve: (root, args, ctx) => ctx.navigationMenu.setSelectedItem(args.type),
    })

    t.field('login', {
      type: 'Query',
      description: 'Auth with Cypress Cloud',
      async resolve (_root, args, ctx) {
        // already authenticated this session - just return
        if (ctx.authenticatedUser) {
          return new Query(ctx)
        }

        await ctx.actions.authenticate()

        return new Query(ctx)
      },
    })

    t.field('logout', {
      type: 'Query',
      description: 'Log out of Cypress Cloud',
      async resolve (_root, args, ctx) {
        await ctx.actions.logout()

        return new Query(ctx)
      },
    })

    t.field('initializeOpenProject', {
      type: 'Wizard',
      description: 'Initializes open_project global singleton to manager current project state',
      async resolve (_root, args, ctx) {
        if (!ctx.activeProject) {
          throw Error('No active project found. Cannot open a browser without an active project')
        }

        if (!ctx.wizard.testingType) {
          throw Error('Must set testingType before initializing a project')
        }

        // do not re-initialize plugins and dev-server.
        if (ctx.wizard.testingType === 'component' && ctx.activeProject.ctPluginsInitialized) {
          debug('CT already initialized. Returning.')

          return ctx.wizard
        }

        if (ctx.wizard.testingType === 'e2e' && ctx.activeProject.e2ePluginsInitialized) {
          debug('E2E already initialized. Returning.')

          return ctx.wizard
        }

        /**
         * Several things happen as part of initializing the open project.
         * 1. Detect browsers (needed for plugins)
         * 2. Run plugins (in cypress.config.js, setupNode or setupDevServer)
         * 3. Open various servers, web sockets, etc.
         */
        debug('Detecting browsers...')
        const browsers = await ctx.actions.getBrowsers()

        debug('Found browsers: %o', browsers)
        ctx.setBrowsers(browsers)

        debug('initialize open_project for testingType %s', ctx.wizard.testingType)
        await ctx.actions.initializeOpenProject({
          ...ctx.launchArgs,
          testingType: ctx.wizard.testingType,
        }, ctx.launchOptions, browsers)

        debug('finishing initializing project')
        ctx.wizard.navigate('forward')

        return ctx.wizard
      },
    })

    t.field('launchOpenProject', {
      type: 'Query',
      description: 'Launches project from open_project global singleton',
      async resolve (_root, args, ctx) {
        const browser = ctx.browsers.find((x) => x.name === 'chrome')

        if (!browser) {
          throw Error(`Could not find chrome browser`)
        }

        const spec: Cypress.Spec = {
          name: '',
          absolute: '',
          relative: '',
          specType: ctx.wizard.testingType === 'e2e' ? 'integration' : 'component',
        }

        await ctx.actions.launchOpenProject(browser, spec, {})

        return new Query(ctx)
      },
    })
  },
})
