import type { App } from '../generated/test-graphql-types.gen'
import type { MaybeResolver } from './clientTestUtils'

export const longBrowsersList = [
  {
    name: 'electron',
    displayName: 'Electron',
    family: 'chromium',
    channel: 'stable',
    version: '73.0.3683.121',
    path: '',
    majorVersion: '73',
    info: 'Info about electron browser',
  },
  {
    name: 'chrome',
    displayName: 'Chrome',
    family: 'chromium',
    channel: 'stable',
    version: '78.0.3904.108',
    path: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    majorVersion: '78',
  },
  {
    name: 'chrome',
    displayName: 'Chrome',
    family: 'chromium',
    channel: 'stable',
    version: '88.0.3904.00',
    path: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    majorVersion: '88',
  },
  {
    name: 'chrome',
    displayName: 'Canary',
    family: 'chromium',
    channel: 'canary',
    version: '80.0.3977.4',
    path: '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    majorVersion: '80',
  },
  {
    name: 'chromium',
    displayName: 'Chromium',
    family: 'chromium',
    channel: 'stable',
    version: '74.0.3729.0',
    path: '/Applications/Chromium.app/Contents/MacOS/Chromium',
    majorVersion: '74',
  },
  {
    name: 'chromium',
    displayName: 'Chromium',
    family: 'chromium',
    channel: 'stable',
    version: '85.0.3729.0',
    path: '/Applications/Chromium.app/Contents/MacOS/Chromium',
    majorVersion: '85',
  },
  {
    name: 'edge',
    displayName: 'Edge Beta',
    family: 'chromium',
    channel: 'beta',
    version: '79.0.309.71',
    path: '/Applications/Microsoft Edge Beta.app/Contents/MacOS/Microsoft Edge Beta',
    majorVersion: '79',
  },
  {
    name: 'edge',
    displayName: 'Edge Canary',
    family: 'chromium',
    channel: 'canary',
    version: '79.0.309.71',
    path: '/Applications/Microsoft Edge Canary.app/Contents/MacOS/Microsoft Edge Canary',
    majorVersion: '79',
  },
  {
    name: 'edge',
    displayName: 'Edge Dev',
    family: 'chromium',
    channel: 'dev',
    version: '80.0.309.71',
    path: '/Applications/Microsoft Edge Dev.app/Contents/MacOS/Microsoft Edge Dev',
    majorVersion: '79',
  },
  {
    name: 'firefox',
    displayName: 'Firefox',
    family: 'firefox',
    channel: 'stable',
    version: '69.0.1',
    path: '/Applications/Firefox/Contents/MacOS/Firefox',
    majorVersion: '69',
    unsupportedVersion: true,
  },
  {
    name: 'firefox',
    displayName: 'Firefox',
    family: 'firefox',
    channel: 'stable',
    version: '75.0.1',
    path: '/Applications/Firefox/Contents/MacOS/Firefox',
    majorVersion: '75',
    unsupportedVersion: true,
  },
  {
    name: 'firefox',
    displayName: 'Firefox Developer Edition',
    channel: 'dev',
    family: 'firefox',
    version: '69.0.2',
    path: '/Applications/Firefox Developer/Contents/MacOS/Firefox Developer',
    majorVersion: '69',
  },
  {
    name: 'firefox',
    displayName: 'Firefox Nightly',
    channel: 'beta',
    family: 'firefox',
    version: '69.0.3',
    path: '/Applications/Firefox Nightly/Contents/MacOS/Firefox Nightly',
    majorVersion: '69',
  },
] as const

export const stubApp: MaybeResolver<App> = {
  __typename: 'App',
  healthCheck: 'OK',
  isRefreshingBrowsers: false,
  isInGlobalMode (source, args, ctx) {
    return Boolean(ctx.app.currentProject)
  },
  browsers (source, args, ctx) {
    return ctx.app.browsers
  },
  currentBrowser (source, args, ctx) {
    return ctx.app.currentBrowser
  },
  projects (source, args, ctx) {
    return ctx.app.projects
  },
  currentProject (source, args, ctx) {
    return ctx.app.currentProject
  },
  isAuthBrowserOpened (source, args, ctx) {
    return ctx.app.isAuthBrowserOpened
  },
}
