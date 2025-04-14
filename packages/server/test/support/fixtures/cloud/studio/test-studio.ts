import type { StudioServerShape, StudioServerDefaultShape } from '@packages/types'
import type { Router } from 'express'

class StudioServer implements StudioServerShape {
  initializeRoutes (router: Router): void {

  }

  canAccessStudioAI (browser: Cypress.Browser): Promise<boolean> {
    return Promise.resolve(true)
  }

  setProtocolDbPath (dbPath: string): void {
  }

  initializeStudioAI (): Promise<void> {
    return Promise.resolve()
  }

  destroy (): Promise<void> {
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
