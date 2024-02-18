import { detect, detectByPath } from './lib/detect'

import { launch } from './lib/browsers'

import { knownBrowsers } from './lib/known-browsers'

export {
  detect,
  detectByPath,
  launch,
  knownBrowsers,
}

export * from './lib/types'
