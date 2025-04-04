import type { StudioServerShape, StudioServerDefaultShape, StudioBrowser } from '@packages/types'
import type { Router } from 'express'

class StudioServer implements StudioServerShape {
  initializeRoutes (router: Router): void {

  }

  canAccessStudioAI (browser: StudioBrowser): Promise<boolean> {
    return Promise.resolve(true)
  }
}

const studioServerDefault: StudioServerDefaultShape = {
  createStudioServer (): Promise<StudioServer> {
    return Promise.resolve(new StudioServer())
  },
  MOUNT_VERSION: 1,
}

export default studioServerDefault
