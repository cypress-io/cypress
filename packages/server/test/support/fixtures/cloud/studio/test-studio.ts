import type { StudioServerShape, StudioServerDefaultShape } from '@packages/types'
import type { Router } from 'express'

class StudioServer implements StudioServerShape {
  initializeRoutes (router: Router): void {

  }
}

const studioServerDefault: StudioServerDefaultShape = {
  createStudioServer (): StudioServer {
    return new StudioServer()
  },
}

export default studioServerDefault
