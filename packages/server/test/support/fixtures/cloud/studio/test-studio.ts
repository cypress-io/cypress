/// <reference types="cypress" />

import type { StudioServerShape, StudioServerDefaultShape, StudioEvent, StudioCDPClient, StudioConfig } from '@packages/types'
import type { Router } from 'express'
import type { Socket } from '@packages/socket'

const stubStudioConfig: StudioConfig = {
  AI: { enabled: true },
  featureFlags: { studioNonNativeEvents: false, studioAI: true },
}

class StudioServer implements StudioServerShape {
  initializeRoutes (router: Router): void {
    // This is a test implementation that does nothing
  }

  canAccessStudioAI (browser: Cypress.Browser): Promise<boolean> {
    return Promise.resolve(true)
  }

  getStudioConfig (browser: Cypress.Browser): Promise<StudioConfig> {
    return Promise.resolve(stubStudioConfig)
  }

  getCachedStudioConfig (): StudioConfig {
    return stubStudioConfig
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

  updateSessionId (sessionId: string): void {
    // This is a test implementation that does nothing
  }

  connectToBrowser (cdpClient: StudioCDPClient): Promise<void> {
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
