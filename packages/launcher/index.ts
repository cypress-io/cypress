import { detect, detectByPath } from './lib/detect'

import { launch } from './lib/browsers'
import { utils } from './lib/utils'

export {
  detect,
  detectByPath,
  launch,
}

export const isCDPPath = utils.isCDPPath

export const parseCDPPath = utils.parseCDPPath

export * from './lib/types'
