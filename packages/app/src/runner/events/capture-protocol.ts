const attachCypressProtocolInfo = (info) => {
  let cypressProtocolElement: HTMLElement | null = document.getElementById('__cypress-protocol')

  // If element does not exist, create it
  if (!cypressProtocolElement) {
    cypressProtocolElement = document.createElement('div')
    cypressProtocolElement.id = '__cypress-protocol'
    cypressProtocolElement.style.display = 'none'
    document.body.appendChild(cypressProtocolElement)
  }

  cypressProtocolElement.dataset.cypressProtocolInfo = JSON.stringify(info)
}

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

  const viewportChangedHandler = (viewport) => {
    const timestamp = performance.timeOrigin + performance.now()

    Cypress.backend('protocol:viewport:changed', {
      viewport: {
        width: viewport.viewportWidth,
        height: viewport.viewportHeight,
      },
      timestamp,
    })
  }

  Cypress.on('viewport:changed', viewportChangedHandler)
  // @ts-expect-error
  Cypress.primaryOriginCommunicator.on('viewport:changed', viewportChangedHandler)

  Cypress.on('test:before:run:async', async (attributes) => {
    await Cypress.backend('protocol:test:before:run:async', attributes)
  })

  Cypress.on('url:changed', (url) => {
    const timestamp = performance.timeOrigin + performance.now()

    Cypress.backend('protocol:url:changed', { url, timestamp })
  })

  Cypress.on('page:loading', (loading) => {
    const timestamp = performance.timeOrigin + performance.now()

    Cypress.backend('protocol:page:loading', { loading, timestamp })
  })

  Cypress.on('test:after:run:async', async (attributes) => {
    attachCypressProtocolInfo({
      type: 'test:after:run:async',
      timestamp: performance.timeOrigin + performance.now(),
    })

    await Cypress.backend('protocol:test:after:run:async', attributes)
  })
}
