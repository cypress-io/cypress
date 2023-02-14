import type { BannersState, Editor, MajorVersionWelcomeDismissed } from '.'

export const defaultPreferences: AllowedState = {
  autoScrollingEnabled: true,
  isSpecsListOpen: false,
  isSideNavigationOpen: true,
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
  'showedNewProjectBanner',
  'firstOpenedCypress',
  'showedStudioModal',
  'preferredOpener',
  'isSpecsListOpen',
  'firstOpened',
  'lastOpened',
  'lastProjectId',
  'promptsShown',
  'specFilter',
  'preferredEditorBinary',
  'isSideNavigationOpen',
  'lastBrowser',
  'majorVersionWelcomeDismissed',
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
  showedNewProjectBanner: Maybe<boolean>
  firstOpenedCypress: Maybe<number>
  showedStudioModal: Maybe<boolean>
  preferredOpener: Editor | undefined
  lastProjectId: Maybe<string>
  firstOpened: Maybe<number>
  lastOpened: Maybe<number>
  promptsShown: Maybe<object>
  specFilter: Maybe<string>
  preferredEditorBinary: Maybe<string>
  isSideNavigationOpen: Maybe<boolean>
  testingType: 'e2e' | 'component'
  lastBrowser: { name: string, channel: string }
  majorVersionWelcomeDismissed: Maybe<MajorVersionWelcomeDismissed>
}>
