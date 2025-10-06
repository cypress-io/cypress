/// <reference types="cypress" />

import type { CyPromptServerShape, CyPromptServerDefaultShape, CyPromptCDPClient } from '@packages/types'
import type { Router } from 'express'
import type { Socket } from 'socket.io'

class CyPromptServer implements CyPromptServerShape {
  initializeRoutes (router: Router): void {
    // This is a test implementation that does nothing
  }

  addSocketListeners (socket: Socket): void {
    // This is a test implementation that does nothing
  }

  connectToBrowser (criClient: CyPromptCDPClient): void {
    // This is a test implementation that does nothing
  }

  reset (testId?: string): void {
    // This is a test implementation that does nothing
  }
}

const cyPromptServerDefault: CyPromptServerDefaultShape = {
  createCyPromptServer (): Promise<CyPromptServer> {
    return Promise.resolve(new CyPromptServer())
  },
  MOUNT_VERSION: 1,
}

export default cyPromptServerDefault
