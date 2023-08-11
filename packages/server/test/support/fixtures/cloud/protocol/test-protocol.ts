import type { ProtocolManagerShape, ResponseStreamOptions } from '@packages/types'
import { Readable } from 'stream'

export class AppCaptureProtocol implements ProtocolManagerShape {
  protocolEnabled: boolean
  getDbMetadata (): { offset: number, size: number } {
    return {
      offset: 0,
      size: 0,
    }
  }
  responseStreamReceived (options: ResponseStreamOptions): Readable {
    return Readable.from([])
  }
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
  resetTest = (testId) => {}
  sendErrors (errors) {
    return Promise.resolve()
  }
  uploadCaptureArtifact ({ uploadUrl }) {
    return Promise.resolve()
  }
  afterTest (test): Promise<void> {
    return Promise.resolve()
  }
}
