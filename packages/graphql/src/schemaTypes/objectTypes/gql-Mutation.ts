import { booleanArg, enumType, idArg, mutationType, nonNull, stringArg } from 'nexus'
import { CodeGenTypeEnum } from '../enumTypes/gql-CodeGenTypeEnum'
import { TestingTypeEnum } from '../enumTypes/gql-WizardEnums'
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
      resolve: (_, args, ctx) => {
        ctx.actions.project.clearLatestProjectCache()

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
      resolve: (_, args, ctx) => {
        ctx.actions.project.clearProjectPreferencesCache(args.projectTitle)

        return true
      },
    })

    t.field('internal_clearAllProjectPreferencesCache', {
      type: 'Boolean',
      resolve: (_, args, ctx) => {
        ctx.actions.project.clearAllProjectPreferencesCache()

        return true
      },
    })

    t.field('clearCurrentTestingType', {
      type: 'Query',
      description: 'Clears the current testing type, closing any active project',
      resolve: async (_, args, ctx) => {
        await ctx.actions.project.clearCurrentTestingType()

        return {}
      },
    })

    t.liveMutation('clearCurrentProject', {
      description: 'Clears the current project, called when we want to navigate back to the global mode screen',
      resolve: async (_, args, ctx) => {
        await ctx.actions.project.clearCurrentProject()
      },
    })

    t.field('selectProjectTestingType', {
      type: 'Query',
      description: 'Updates the testing type for the current project',
      args: {
        type: nonNull(TestingTypeEnum),
      },
      resolve (source, args, ctx) {
        ctx.actions.project.setCurrentTestingType(args.type)

        return {}
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

    t.field('completeOnboarding', {
      type: 'Query',
      description: 'Signal the completion of the onboarding steps, assumes the config is correct now and attempts to launch the project',
      resolve: () => {
        return {}
      },
    })

    t.liveMutation('launchOpenProject', {
      description: 'Launches project from open_project global singleton',
      resolve: async (_, args, ctx) => {
        await ctx.actions.project.launchProject({})
      },
    })

    t.liveMutation('addProject', {
      description: 'Add project to projects array and cache it',
      args: {
        path: nonNull(stringArg()),
        open: booleanArg({ description: 'Whether to open the project when added' }),
      },
      resolve: async (_, args, ctx) => {
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

    t.liveMutation('showElectronOnAppExit', {
      description: 'show the launchpad at the browser picker step',
      resolve: (_, args, ctx) => {
        ctx.actions.electron.showElectronOnAppExit()
      },
    })
  },
})
