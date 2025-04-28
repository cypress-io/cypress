/// <reference types="cypress" />

import type { StudioServerShape, StudioServerDefaultShape } from '@packages/types'
import type { Router } from 'express'
import type { Socket } from '@packages/socket'

class StudioServer implements StudioServerShape {
  initializeRoutes (router: Router): void {
    // This is a test implementation that does nothing
  }

  canAccessStudioAI (browser: Cypress.Browser): Promise<boolean> {
    return Promise.resolve(true)
  }

  initializeStudioAI (): Promise<void> {
    return Promise.resolve()
  }

  reportError (error: Error, method: string, ...args: any[]): void {
    // This is a test implementation that does nothing
  }

  destroy (): Promise<void> {
    return Promise.resolve()
  }

  addSocketListeners (socket: Socket): void {
    // This is a test implementation that does nothing
  }

  captureStudioEvent (event: StudioEvent): Promise<void> {
    return Promise.resolve()
  }
}

const studioServerDefault: StudioServerDefaultShape = {
  createStudioServer (): Promise<StudioServer> {
    return Promise.resolve(new StudioServer())
  },
  MOUNT_VERSION: 1,
}

export default studioServerDefault
