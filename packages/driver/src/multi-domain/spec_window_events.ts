import type { $Cy } from '../cypress/cy'
import { handleErrorEvent } from './errors'

export const handleSpecWindowEvents = (cy: $Cy) => {
  const handleWindowErrorEvent = handleErrorEvent(cy)('error', 'spec')
  const handleWindowUnhandledRejectionEvent = handleErrorEvent(cy)('unhandledrejection', 'spec')

  const handleUnload = () => {
    window.removeEventListener('unload', handleUnload)
    window.removeEventListener('error', handleWindowErrorEvent)
    window.removeEventListener('unhandledrejection', handleWindowUnhandledRejectionEvent)
  }

  window.addEventListener('unload', handleUnload)
  window.addEventListener('error', handleWindowErrorEvent)
  window.addEventListener('unhandledrejection', handleWindowUnhandledRejectionEvent)
}
