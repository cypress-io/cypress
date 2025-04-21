import type { BannersState, Editor, MajorVersionWelcomeDismissed } from '.'

export const NotifyCompletionStatuses = ['passed', 'failed', 'cancelled', 'errored'] as const

export type NotifyWhenRunCompletes = typeof NotifyCompletionStatuses[number]

export const defaultPreferences: AllowedState = {
  autoScrollingEnabled: true,
  isSpecsListOpen: false,
  isSideNavigationOpen: true,
  desktopNotificationsEnabled: null,
  notifyWhenRunStarts: false,
  notifyWhenRunStartsFailing: true,
  notifyWhenRunCompletes: ['failed'],
}

export const allowedKeys: Readonly<Array<keyof AllowedState>> = [
  'appWidth',
  'appHeight',
  'appX',
  'appY',
  'autoScrollingEnabled',
  'banners',
  'browserWidth',
  'browserHeight',
  'browserX',
  'browserY',
  'isAppDevToolsOpen',
  'isBrowserDevToolsOpen',
  'reporterWidth',
  'specListWidth',
  'studioWidth',
  'showedNewProjectBanner',
  'firstOpenedCypress',
  'showedStudioModal',
  'preferredOpener',
  'isSpecsListOpen',
  'firstOpened',
  'lastOpened',
  'lastProjectId',
  'lastTestCountsEvent',
  'promptsShown',
  'specFilter',
  'preferredEditorBinary',
  'desktopNotificationsEnabled',
  'dismissNotificationBannerUntil',
  'isSideNavigationOpen',
  'lastBrowser',
  'majorVersionWelcomeDismissed',
  'debugSlideshowComplete',
  'notifyWhenRunStarts',
  'notifyWhenRunStartsFailing',
  'notifyWhenRunCompletes',
] as const

type Maybe<T> = T | null | undefined

export type AllowedState = Partial<{
  appWidth: Maybe<number>
  appHeight: Maybe<number>
  appX: Maybe<number>
  appY: Maybe<number>
  isSpecsListOpen: Maybe<boolean>
  autoScrollingEnabled: Maybe<boolean>
  banners: Maybe<BannersState>
  browserWidth: Maybe<number>
  browserHeight: Maybe<number>
  browserX: Maybe<number>
  browserY: Maybe<number>
  isAppDevToolsOpen: Maybe<boolean>
  isBrowserDevToolsOpen: Maybe<boolean>
  reporterWidth: Maybe<number>
  specListWidth: Maybe<number>
  studioWidth: Maybe<number>
  showedNewProjectBanner: Maybe<boolean>
  firstOpenedCypress: Maybe<number>
  showedStudioModal: Maybe<boolean>
  preferredOpener: Editor | undefined
  lastProjectId: Maybe<string>
  firstOpened: Maybe<number>
  lastOpened: Maybe<number>
  lastTestCountsEvent: Maybe<number>
  promptsShown: Maybe<object>
  specFilter: Maybe<string>
  preferredEditorBinary: Maybe<string>
  isSideNavigationOpen: Maybe<boolean>
  testingType: 'e2e' | 'component'
  lastBrowser: { name: string, channel: string }
  majorVersionWelcomeDismissed: Maybe<MajorVersionWelcomeDismissed>
  debugSlideshowComplete: Maybe<boolean>
  desktopNotificationsEnabled: Maybe<boolean>
  dismissNotificationBannerUntil: Maybe<Date>
  notifyWhenRunStarts: Maybe<boolean>
  notifyWhenRunStartsFailing: Maybe<boolean>
  notifyWhenRunCompletes: Maybe<NotifyWhenRunCompletes[]>
}>
