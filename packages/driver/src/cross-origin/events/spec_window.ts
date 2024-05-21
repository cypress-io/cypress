import type { $Cy } from '../../cypress/cy'
import { handleErrorEvent } from './errors'

export const handleSpecWindowEvents = (cy: $Cy) => {
  const unloadEvent = cy.Cypress.browser.family === 'chromium' ? 'pagehide' : 'unload'
  const handleWindowErrorEvent = handleErrorEvent(cy, 'spec')('error')
  const handleWindowUnhandledRejectionEvent = handleErrorEvent(cy, 'spec')('unhandledrejection')

  const handleUnload = () => {
    window.removeEventListener(unloadEvent, handleUnload)
    window.removeEventListener('error', handleWindowErrorEvent)
    window.removeEventListener('unhandledrejection', handleWindowUnhandledRejectionEvent)
  }

  window.addEventListener(unloadEvent, handleUnload)
  window.addEventListener('error', handleWindowErrorEvent)
  window.addEventListener('unhandledrejection', handleWindowUnhandledRejectionEvent)
}
