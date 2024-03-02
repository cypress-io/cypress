import { detect, detectByPath } from './lib/detect'

import { launch } from './lib/browsers'

import { knownBrowsers, electronBrowser, webkitBrowser } from './lib/known-browsers'

export {
  detect,
  detectByPath,
  launch,
  knownBrowsers,
  electronBrowser,
  webkitBrowser,
}

export * from './lib/types'
