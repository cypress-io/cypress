import type { StudioServerShape, StudioServerDefaultShape, StudioBrowser } from '@packages/types'
import type Database from 'better-sqlite3'
import type { Router } from 'express'

class StudioServer implements StudioServerShape {
  initializeRoutes (router: Router): void {

  }

  canAccessStudioAI (browser: StudioBrowser): Promise<boolean> {
    return Promise.resolve(true)
  }

  setProtocolDb (db: Database.Database): void {
  }
}

const studioServerDefault: StudioServerDefaultShape = {
  createStudioServer (): Promise<StudioServer> {
    return Promise.resolve(new StudioServer())
  },
  MOUNT_VERSION: 1,
}

export default studioServerDefault
