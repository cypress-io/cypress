import { mutationType, nonNull } from 'nexus'
import { BundlerEnum, FrontendFrameworkEnum, NavItemEnum, TestingTypeEnum, WizardNavigateDirectionEnum } from '../constants'
import type { BrowserContract } from '../contracts/BrowserContract'
import { Query } from './Query'

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
        if (!ctx.activeProject) {
          throw Error('Cannot write config file without an active project')
        }

        ctx.actions.createConfigFile(args.code, args.configFilename)

        return ctx.app
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
          return new Query()
        }

        await ctx.actions.authenticate()

        return new Query()
      },
    })

    t.field('logout', {
      type: 'Query',
      description: 'Log out of Cypress Cloud',
      async resolve (_root, args, ctx) {
        await ctx.actions.logout()

        return new Query()
      },
    })

    t.field('initializeOpenProject', {
      type: 'App',
      args: {
        testingType: nonNull(TestingTypeEnum),
      },
      description: 'Initializes open_project global singleton to manager current project state',
      async resolve (_root, args, ctx) {
        const browsers = ctx.app.browserCache

        if (!browsers?.length) {
          throw Error(`Need to call App#cacheBrowsers before opening a project.`)
        }

        await ctx.actions.initializeOpenProject({
          ...ctx.launchArgs,
          testingType: args.testingType,
          config: {
            browsers: browsers.map((x): BrowserContract => {
              return {
                name: x.name,
                family: x.family,
                majorVersion: x.majorVersion,
                channel: x.channel,
                displayName: x.displayName,
                path: x.path,
                version: x.version,
              }
            }),
          },
        }, ctx.launchOptions)

        return ctx.app
      },
    })

    t.field('launchOpenProject', {
      type: 'App',
      description: 'Launches project from open_project global singleton',
      args: {
        testingType: nonNull(TestingTypeEnum),
      },
      async resolve (_root, args, ctx) {
        if (!ctx.app.browserCache?.length) {
          throw Error(`Need to call App#cacheBrowsers before opening a project.`)
        }

        const chrome = ctx.app.browserCache.find((x) => x.name === 'chrome')!

        const browser: BrowserContract = {
          name: chrome.name,
          family: chrome.family,
          majorVersion: chrome.majorVersion,
          channel: chrome.channel,
          displayName: chrome.displayName,
          path: chrome.path,
          version: chrome.version,
        }

        const spec: any = { // Cypress.Cypress['spec'] = {
          name: '',
          absolute: '',
          relative: '',
          specType: args.testingType === 'e2e' ? 'integration' : 'component',
        }

        await ctx.actions.launchOpenProject(browser, spec, {})

        return ctx.app
      },
    })
  },
})
