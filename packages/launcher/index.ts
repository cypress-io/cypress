import { detect, detectByPath } from './lib/detect'

import { launch } from './lib/browsers'
import { knownBrowsers, DEFAULT_ELECTRON_BROWSER } from './lib/known-browsers'

export {
  detect,
  detectByPath,
  launch,
  knownBrowsers,
  DEFAULT_ELECTRON_BROWSER,
}

export * from './lib/types'
