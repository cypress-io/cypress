export const addCaptureProtocolListeners = (Cypress: Cypress.Cypress) => {

  Cypress.on('log:added', (_, log) => {
    // TODO: UNIFY-1318 - Race condition in unified runner - we should not need this null check
    if (!Cypress.runner) {
      return
    }
    
    const protocolProps = Cypress.runner.getProtocolPropsForLog(log.attributes)

    Cypress.backend('protocol:command:log:added', protocolProps)
  })

  Cypress.on('log:changed', (_, log) => {
    // TODO: UNIFY-1318 - Race condition in unified runner - we should not need this null check
    if (!Cypress.runner) {
      return
    }
    
    const protocolProps = Cypress.runner.getProtocolPropsForLog(log.attributes)

    Cypress.backend('protocol:command:log:changed', protocolProps)
  })

  Cypress.on('viewport:changed', (viewport) => {
    const timestamp = performance.timeOrigin + performance.now()

    Cypress.backend('protocol:viewport:changed', {
      viewport: {
        width: viewport.viewportWidth,
        height: viewport.viewportHeight,
      },
      timestamp,
    })
  })

  Cypress.on('test:before:run:async', async (attributes) => {
    await Cypress.backend('protocol:test:before:run:async', attributes)
  })

  Cypress.on('test:after:run', (attributes) => {
    Cypress.backend('protocol:test:after:run', attributes)
  })

  Cypress.on('url:changed', (url) => {
    const timestamp = performance.timeOrigin + performance.now()

    Cypress.backend('protocol:url:changed', { url, timestamp })
  })
}
