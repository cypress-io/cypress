/// <reference types="cypress" />

import type { StudioServerShape, StudioServerDefaultShape } from '@packages/types'
import type Database from 'better-sqlite3'
import type { Router } from 'express'
import type { Socket } from '@packages/socket'

class StudioServer implements StudioServerShape {
  initializeRoutes (router: Router): void {
    // This is a test implementation that does nothing
  }

  canAccessStudioAI (browser: Cypress.Browser): Promise<boolean> {
    return Promise.resolve(true)
  }

  addSocketListeners (socket: Socket): void {
    // This is a test implementation that does nothing
  }

  setProtocolDb (db: Database.Database): void {
    // This is a test implementation that does nothing
  }
}

const studioServerDefault: StudioServerDefaultShape = {
  createStudioServer (): Promise<StudioServer> {
    return Promise.resolve(new StudioServer())
  },
  MOUNT_VERSION: 1,
}

export default studioServerDefault
