import type { ProtocolManagerShape, ResponseStreamOptions } from '@packages/types'
import { Readable } from 'node:stream'

declare const Debug: (namespace) => import('debug').IDebugger
declare const performance: {
  now(): number
  timeOrigin: number
}
declare const createHash: {
  (text: string): string
}

export class AppCaptureProtocol implements ProtocolManagerShape {
  private Debug: typeof Debug
  private performance: typeof performance
  private createHash: typeof createHash

  constructor () {
    this.Debug = Debug
    this.performance = performance
    this.createHash = createHash
  }
  getDbMetadata (): { offset: number, size: number } {
    return undefined
  }
  responseStreamReceived (options: ResponseStreamOptions): Readable {
    return Readable.from([])
  }

  protocolEnabled: boolean

  setupProtocol = (script, runId) => {
    return Promise.resolve()
  }
  connectToBrowser = (cdpClient) => {
    return Promise.resolve()
  }
  addRunnables = (runnables) => {}
  beforeSpec = (spec) => {}
  afterSpec = () => {
    return Promise.resolve()
  }
  beforeTest = (test) => {
    return Promise.resolve()
  }
  commandLogAdded = (log) => {}
  commandLogChanged = (log) => {}
  viewportChanged = (input) => {}
  urlChanged = (input) => {}
  pageLoading = (input) => {}
  resetTest (testId) {}
  sendErrors (errors) {
    return Promise.resolve()
  }
  uploadCaptureArtifact ({ uploadUrl }) {
    return Promise.resolve()
  }
  afterTest = (test) => {
    return Promise.resolve()
  }
}
