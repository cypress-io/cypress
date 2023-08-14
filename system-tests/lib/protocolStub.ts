import type { ProtocolManagerShape, ResponseStreamOptions } from '@packages/types'
import type { Readable } from 'stream'

export class AppCaptureProtocol implements ProtocolManagerShape {
  protocolEnabled: boolean

  getDbMetadata (): { offset: number, size: number } {
    return undefined
  }
  responseStreamReceived (options: ResponseStreamOptions): Readable {
    return options.responseStream
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
