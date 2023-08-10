import type { AppCaptureProtocolInterface } from '@packages/types'

export class AppCaptureProtocol implements AppCaptureProtocolInterface {
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
  commandLogAdded = (log) => {
    throw new Error('Error reacting to commandLogAdded')
  }
  commandLogChanged = (log) => {}
  viewportChanged = (input) => {}
  urlChanged = (input) => {}
  pageLoading = (input) => {}
  resetTest (testId) {}
  afterTest = (test) => {
    return Promise.resolve()
  }
}
