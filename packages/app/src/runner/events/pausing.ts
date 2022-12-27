export const handlePausing = (getCypress, reporterBus) => {
  const Cypress = getCypress()
  // tracks whether the cy.pause() was called from the primary driver
  // (value === null) or from a cross-origin spec bridge (value is the origin
  // matching that spec bridge)
  let sendEventsToOrigin = null

  reporterBus.on('runner:next', () => {
    const Cypress = getCypress()

    if (!Cypress) return

    // if paused from within a cy.origin() callback, send the event to the
    // corresponding spec bridge
    if (sendEventsToOrigin) {
      Cypress.primaryOriginCommunicator.toSpecBridge(sendEventsToOrigin, 'resume:next')
    } else {
      Cypress.emit('resume:next')
    }
  })

  reporterBus.on('runner:resume', () => {
    const Cypress = getCypress()

    if (!Cypress) return

    // if paused from within a cy.origin() callback, send the event to the
    // corresponding spec bridge
    if (sendEventsToOrigin) {
      Cypress.primaryOriginCommunicator.toSpecBridge(sendEventsToOrigin, 'resume:all')
    } else {
      Cypress.emit('resume:all')
    }

    // pause sequence is over - reset this for subsequent pauses
    sendEventsToOrigin = null
  })

  // from the primary driver
  Cypress.on('paused', (nextCommandName) => {
    reporterBus.emit('paused', nextCommandName)
  })

  // from a cross-origin spec bridge
  Cypress.primaryOriginCommunicator.on('paused', ({ nextCommandName, origin }) => {
    sendEventsToOrigin = origin

    reporterBus.emit('paused', nextCommandName)
  })
}
