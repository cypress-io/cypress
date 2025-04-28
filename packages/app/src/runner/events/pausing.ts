// tracks whether the cy.pause() was called from the primary driver
// (value === null) or from a cross-origin spec bridge (value is the origin

import type EventEmitter from 'events'

// matching that spec bridge)
let sendEventsToOrigin: string | null = null

type GetCypressFunction = () => Cypress.Cypress

class PauseHandlers {
  constructor (private getCypress: GetCypressFunction, private reporterBus: EventEmitter) {}

  nextHandler = () => {
    const Cypress = this.getCypress()

    if (!Cypress) return

    // if paused from within a cy.origin() callback, send the event to the
    // corresponding spec bridge
    if (sendEventsToOrigin) {
      Cypress.primaryOriginCommunicator.toSpecBridge(sendEventsToOrigin, 'resume:next')
    } else {
      Cypress.emit('resume:next')
    }
  }

  resumeHandler = () => {
    const Cypress = this.getCypress()

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
  }

  pausedHandler = (nextCommandName: string) => {
    this.reporterBus.emit('paused', nextCommandName)
  }

  crossOriginPausedHandler = ({ nextCommandName, origin }: { nextCommandName: string, origin: string }) => {
    sendEventsToOrigin = origin
    this.reporterBus.emit('paused', nextCommandName)
  }

  removeListeners = () => {
    const Cypress = this.getCypress()

    this.reporterBus.removeListener('runner:next', this.nextHandler)
    this.reporterBus.removeListener('runner:resume', this.resumeHandler)
    Cypress.removeListener('paused', this.pausedHandler)
    Cypress.primaryOriginCommunicator.removeListener('paused', this.crossOriginPausedHandler)
  }

  addListeners = () => {
    const Cypress = this.getCypress()

    this.reporterBus.on('runner:next', this.nextHandler)
    this.reporterBus.on('runner:resume', this.resumeHandler)
    Cypress.on('paused', this.pausedHandler)
    Cypress.primaryOriginCommunicator.on('paused', this.crossOriginPausedHandler)
  }
}

let currentHandlers: PauseHandlers | null = null

export const handlePausing = (getCypress: GetCypressFunction, reporterBus: EventEmitter) => {
  // Remove existing handlers if they exist
  if (currentHandlers) {
    currentHandlers.removeListeners()
  }

  // Create new handlers
  currentHandlers = new PauseHandlers(getCypress, reporterBus)
  currentHandlers.addListeners()
}
