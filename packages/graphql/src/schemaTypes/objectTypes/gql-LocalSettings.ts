import { objectType } from 'nexus'
import { Editor } from './gql-Editor'

export const LocalSettingsPreferences = objectType({
  name: 'LocalSettingsPreferences',
  description: 'local setting preferences',
  definition (t) {
    t.boolean('autoScrollingEnabled')
    t.string('preferredEditorBinary')
    t.boolean('isSpecsListOpen')
    t.int('reporterWidth')
    t.int('specListWidth')
    t.boolean('isSideNavigationOpen')
    t.string('proxyServer', {
      resolve: (source, args, ctx) => ctx.env.HTTP_PROXY ?? null,
    })

    t.string('proxyBypass', {
      resolve: (source, args, ctx) => ctx.env.NO_PROXY ?? null,
    })

    t.json('majorVersionWelcomeDismissed', {
      resolve: async (source, args, ctx) => {
        const preferences = await ctx._apis.localSettingsApi.getPreferences()

        return preferences.majorVersionWelcomeDismissed || {}
      },
    })

    t.boolean('wasBrowserSetInCLI', {
      resolve: (source, args, ctx) => {
        return Boolean(ctx.coreData.cliBrowser)
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
