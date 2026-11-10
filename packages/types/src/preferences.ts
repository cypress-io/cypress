import type { BannersState, Editor, MajorVersionWelcomeDismissed, Maybe } from '.'

export const NotifyCompletionStatuses = ['passed', 'failed', 'cancelled', 'errored'] as const

export type NotifyWhenRunCompletes = typeof NotifyCompletionStatuses[number]

export const defaultPreferences: AllowedState = {
  autoScrollingEnabled: true,
  isSpecsListOpen: false,
  showFetchRequests: true,
  isSideNavigationOpen: true,
  desktopNotificationsEnabled: null,
  notifyWhenRunStarts: false,
  notifyWhenRunStartsFailing: true,
  notifyWhenRunCompletes: ['failed'],
  codeEditorLineWrap: false,
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
  // Written by Cypress 9 / early 10 and never pruned from state.json. They have
  // no reader left, but `setPreferences` read-merges the whole on-disk state
  // back through `normalizeAndAllowSet`, so dropping them here would warn on
  // every preference save for anyone still carrying them.
  'showedNewProjectBanner',
  'firstOpenedCypress',
  'showedStudioModal',
  'preferredOpener',
  'isSpecsListOpen',
  'showFetchRequests',
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
  'studioFirstUseInstructionsDismissed',
  'codeEditorLineWrap',
] as const

export type AllowedState = Partial<{
  appWidth: Maybe<number>
  appHeight: Maybe<number>
  appX: Maybe<number>
  appY: Maybe<number>
  isSpecsListOpen: Maybe<boolean>
  showFetchRequests: Maybe<boolean>
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
  studioFirstUseInstructionsDismissed: Maybe<boolean>
  codeEditorLineWrap: Maybe<boolean>
}>
