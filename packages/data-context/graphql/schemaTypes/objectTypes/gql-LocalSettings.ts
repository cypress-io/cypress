import { objectType } from 'nexus'
import { Editor } from './gql-Editor'
import { GET_MAJOR_VERSION_FOR_CONTENT } from '@packages/types'
import { maskProxyPassword } from '../../../src/util/maskProxyPassword'

// One value for the whole run, so the preference does not change between queries
const WELCOME_BYPASSED_AT = Date.now()

export const LocalSettingsPreferences = objectType({
  name: 'LocalSettingsPreferences',
  description: 'local setting preferences',
  definition (t) {
    t.boolean('autoScrollingEnabled')
    t.boolean('codeEditorLineWrap')
    t.string('preferredEditorBinary')
    t.boolean('isSpecsListOpen')
    t.boolean('showFetchRequests')
    t.int('reporterWidth')
    t.int('specListWidth')
    t.int('studioWidth')
    t.boolean('isSideNavigationOpen')
    t.string('proxyServer', {
      // The page under test can reach this field
      resolve: (source, args, ctx) => ctx.env.HTTP_PROXY ? maskProxyPassword(ctx.env.HTTP_PROXY) : null,
    })

    t.string('proxyBypass', {
      resolve: (source, args, ctx) => ctx.env.NO_PROXY ?? null,
    })

    t.json('majorVersionWelcomeDismissed', {
      resolve: async (source, args, ctx) => {
        const preferences = await ctx._apis.localSettingsApi.getPreferences()
        const dismissed = preferences.majorVersionWelcomeDismissed || {}

        if (!ctx.lifecycleManager.isWelcomeBypassedForAgent) {
          return dismissed
        }

        // Matches what the server did when it skipped the welcome, so the Launchpad does not show it
        const major = GET_MAJOR_VERSION_FOR_CONTENT()

        return { ...dismissed, [major]: dismissed[major] ?? WELCOME_BYPASSED_AT }
      },
    })

    t.boolean('wasBrowserSetInCLI', {
      resolve: (source, args, ctx) => {
        return Boolean(ctx.coreData.cliBrowser)
      },
    })

    t.boolean('shouldLaunchBrowserFromOpenBrowser', {
      description: 'Determine if the browser should launch when the browser flag is passed alone',
      resolve: async (_source, _args, ctx) => {
        try {
          const cliBrowser = ctx.coreData.cliBrowser

          // The server launches the browser itself, so the Launchpad launching it too would open a second one
          if (!cliBrowser || ctx.lifecycleManager.isWelcomeBypassedForAgent) {
            return false
          }

          const browser = await ctx._apis.browserApi.ensureAndGetByNameOrPath(cliBrowser)
          const shouldLaunch = Boolean(browser) && (ctx.actions.project.launchCount === 0)

          return shouldLaunch
        } catch (e) {
          // if error is thrown, browser doesn't exist
          return false
        }
      },
    })

    t.json('banners', {
      description: 'User-scoped banner state — used by cloud-driven messages whose `dismissal.scope` is `user`. The shape mirrors `currentProject.savedState.banners` but lives in global appData.',
      resolve: async (source, args, ctx) => {
        const preferences = await ctx._apis.localSettingsApi.getPreferences()

        return preferences.banners || {}
      },
    })

    t.boolean('debugSlideshowComplete')
    t.boolean('desktopNotificationsEnabled')
    t.dateTime('dismissNotificationBannerUntil')
    t.boolean('notifyWhenRunStarts')
    t.boolean('notifyWhenRunStartsFailing')
    t.json('notifyWhenRunCompletes', {
      resolve: async (source, args, ctx) => {
        return ctx.coreData.localSettings.preferences.notifyWhenRunCompletes || []
      },
    })
  },
})

export const LocalSettings = objectType({
  name: 'LocalSettings',
  description: 'local settings on a device-by-device basis',
  definition (t) {
    t.nonNull.list.nonNull.field('availableEditors', {
      type: Editor,
    })

    t.nonNull.field('preferences', {
      type: LocalSettingsPreferences,
    })
  },
})
