import { renderTargetIfNotExists } from './util/dom'
import { cleanupStyles } from './util/styles'

/**
 * Publicly available Hooks for framework-specific adapters
 * to use in their Support files
 */
export const Hooks = {
  beforeEach () {
    cleanupStyles()
  },
  beforeAll () {
    renderTargetIfNotExists()
  },
}
