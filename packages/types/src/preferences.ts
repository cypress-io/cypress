import type { Editor } from '.'

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
  'ctReporterWidth',
  'ctIsSpecsListOpen',
  'isSpecsListOpen',
  'ctSpecListWidth',
  'firstOpened',
  'lastOpened',
  'lastProjectId',
  'promptsShown',
  'preferredEditorBinary',
  'isSideNavigationOpen',
  'lastBrowser',
] as const

type Maybe<T> = T | null | undefined

export type AllowedState = Partial<{
  appWidth: Maybe<number>
  appHeight: Maybe<number>
  appX: Maybe<number>
  appY: Maybe<number>
  isSpecsListOpen: Maybe<boolean>
  autoScrollingEnabled: Maybe<boolean>
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
  ctReporterWidth: Maybe<number>
  ctIsSpecsListOpen: Maybe<boolean>
  ctSpecListWidth: Maybe<number>
  lastProjectId: Maybe<string>
  firstOpened: Maybe<number>
  lastOpened: Maybe<number>
  promptsShown: Maybe<object>
  preferredEditorBinary: Maybe<string>
  isSideNavigationOpen: Maybe<boolean>
  testingType: 'e2e' | 'component'
  lastBrowser: { name: string, channel: string }
}>
