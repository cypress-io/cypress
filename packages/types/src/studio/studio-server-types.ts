import type { Router } from 'express'

export interface StudioServerOptions {
  studioPath: string
}

export interface StudioServerShape {
  initializeRoutes(router: Router): void
}

export interface StudioServerDefaultShape {
  createStudioServer: (options: StudioServerOptions) => StudioServerShape
}
