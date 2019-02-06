import { LauncherApi } from './types'
import { launch } from './browsers'
import { detect, detectByPath } from './detect'

module.exports = {
  detect,
  detectByPath,
  launch
} as LauncherApi
