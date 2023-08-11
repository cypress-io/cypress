import type { AppCaptureProtocolInterface } from '@packages/types'

export class AppCaptureProtocol implements AppCaptureProtocolInterface {
  constructor () {
    throw new Error('Error instantiating Protocol Capture')
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
  afterTest = (test) => {
    return Promise.resolve()
  }
}
