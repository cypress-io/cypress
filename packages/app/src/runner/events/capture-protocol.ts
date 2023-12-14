import { v4 as uuidv4 } from 'uuid'

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
  Cypress.on('cy:protocol-snapshot', () => {
    attachCypressProtocolInfo({
      type: 'cy:protocol-snapshot',
      timestamp: performance.now() + performance.timeOrigin,
    })
  })

  Cypress.on('log:added', (attributes) => {
    // TODO: UNIFY-1318 - Race condition in unified runner - we should not need this null check
    if (!Cypress.runner) {
      return
    }

    const protocolProps = Cypress.runner.getProtocolPropsForLog(attributes)

    attachCypressProtocolInfo({
      type: 'log:added',
      timestamp: performance.now() + performance.timeOrigin,
    })

    Cypress.backend('protocol:command:log:added', protocolProps)
  })

  Cypress.on('log:changed', (attributes) => {
    // TODO: UNIFY-1318 - Race condition in unified runner - we should not need this null check
    if (!Cypress.runner) {
      return
    }

    const protocolProps = Cypress.runner.getProtocolPropsForLog(attributes)

    attachCypressProtocolInfo({
      type: 'log:changed',
      timestamp: performance.now() + performance.timeOrigin,
    })

    Cypress.backend('protocol:command:log:changed', protocolProps)
  })

  const viewportChangedHandler = (viewport) => {
    const timestamp = performance.timeOrigin + performance.now()

    attachCypressProtocolInfo({
      type: 'viewport:changed',
      timestamp,
    })

    Cypress.backend('protocol:viewport:changed', {
      viewport: {
        width: viewport.viewportWidth,
        height: viewport.viewportHeight,
      },
      timestamp,
    })
  }

  Cypress.on('window:before:load', (contentWindow) => {
    // Create a mutation observer that tracks on dom additions
    const listener = (mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          // @ts-ignore
          Cypress.protocolNodesAdded = true
        })
      })
    }
    const observer = new MutationObserver(listener)

    observer.observe(contentWindow.document, {
      childList: true,
      subtree: true,
    })

    // @ts-ignore
    Cypress.mutationObserverFlushings = Cypress.mutationObserverFlushings || []

    // @ts-ignore
    Cypress.mutationObserverFlushings.push(() => {
      listener(observer.takeRecords())
    })

    return
  })

  Cypress.on('cy:protocol:stability:wait', () => {
    // @ts-ignore
    Cypress.mutationObserverFlushings?.forEach((flushing) => {
      flushing()
    })

    // @ts-ignore
    if (Cypress.protocolNodesAdded) {
      const timestamp = performance.timeOrigin + performance.now()
      const stabilityId = uuidv4()

      attachCypressProtocolInfo({
        type: 'cy:protocol-stability',
        stabilityId,
        timestamp,
      })

      // @ts-ignore
      Cypress.protocolNodesAdded = false

      return Cypress.backend('protocol:stability:wait', {
        stabilityId,
      })
    }

    // @ts-ignore
    Cypress.protocolNodesAdded = false

    return Promise.resolve()
  })

  Cypress.on('viewport:changed', viewportChangedHandler)
  // @ts-expect-error
  Cypress.primaryOriginCommunicator.on('viewport:changed', viewportChangedHandler)

  Cypress.on('test:before:run:async', async (attributes) => {
    attachCypressProtocolInfo({
      type: 'test:before:run:async',
      timestamp: performance.now() + performance.timeOrigin,
    })

    await Cypress.backend('protocol:test:before:run:async', attributes)
  })

  Cypress.on('url:changed', (url) => {
    const timestamp = performance.timeOrigin + performance.now()

    attachCypressProtocolInfo({
      type: 'url:changed',
      timestamp,
    })

    Cypress.backend('protocol:url:changed', { url, timestamp })
  })

  Cypress.on('page:loading', (loading) => {
    const timestamp = performance.timeOrigin + performance.now()

    attachCypressProtocolInfo({
      type: 'page:loading',
      timestamp,
    })

    Cypress.backend('protocol:page:loading', { loading, timestamp })
  })

  Cypress.on('test:before:after:run:async', async (attributes, _test, options) => {
    attachCypressProtocolInfo({
      type: 'test:before:after:run:async',
      timestamp: performance.timeOrigin + performance.now(),
    })

    await Cypress.backend('protocol:test:before:after:run:async', attributes, options)
  })

  Cypress.on('test:after:run:async', async (attributes) => {
    attachCypressProtocolInfo({
      type: 'test:after:run:async',
      timestamp: performance.timeOrigin + performance.now(),
    })

    await Cypress.backend('protocol:test:after:run:async', attributes)
  })
}
