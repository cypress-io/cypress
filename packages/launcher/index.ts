import { detect, detectByPath } from './lib/detect'

import { launch } from './lib/browsers'

import { electronBrowser, webkitBrowser, knownBrowsers } from './lib/known-browsers'

export {
  detect,
  detectByPath,
  launch,
  electronBrowser,
  webkitBrowser,
  knownBrowsers,
}

export * from './lib/types'
