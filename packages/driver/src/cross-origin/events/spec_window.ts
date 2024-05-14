import type { $Cy } from '../../cypress/cy'
import { handleErrorEvent } from './errors'

import Debug from 'debug'

const debug = Debug('cypress:driver:cross-origin:events')

export const handleSpecWindowEvents = (cy: $Cy) => {
  debug('handle spec window events')
  const handleWindowErrorEvent = handleErrorEvent(cy, 'spec')('error')
  const handleWindowUnhandledRejectionEvent = handleErrorEvent(cy, 'spec')('unhandledrejection')

  const handleUnload = () => {
    debug('handling unload')
    window.removeEventListener('pagehide', handleUnload)
    window.removeEventListener('error', handleWindowErrorEvent)
    window.removeEventListener('unhandledrejection', handleWindowUnhandledRejectionEvent)
  }

  window.addEventListener('pagehide', handleUnload)
  window.addEventListener('error', handleWindowErrorEvent)
  window.addEventListener('unhandledrejection', handleWindowUnhandledRejectionEvent)
}
