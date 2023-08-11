import type { AppCaptureProtocolInterface } from '@packages/types'

export class AppCaptureProtocol implements AppCaptureProtocolInterface {
  protocolEnabled: boolean

  setupProtocol = (script, runId) => {
    return Promise.resolve()
  }
  connectToBrowser = (cdpClient) => {
    return Promise.resolve()
  }
  addRunnables = (runnables) => {}
  beforeSpec = (spec) => {
    throw new Error('Error in beforeSpec')
  }
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
  uploadCaptureArtifact ({ uploadUrl }) {
    return Promise.resolve()
  }
  afterTest = (test) => {
    return Promise.resolve()
  }
}
