import { renderTargetIfNotExists } from './util/dom'
import { cleanupStyles } from './util/styles'

export const Hooks = {
  beforeEach () {
    cleanupStyles()
  },
  beforeAll () {
    renderTargetIfNotExists()
  },
}
