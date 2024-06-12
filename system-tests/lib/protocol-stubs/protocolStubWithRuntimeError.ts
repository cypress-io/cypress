import type { AppCaptureProtocolInterface, ResponseEndedWithEmptyBodyOptions, ResponseStreamOptions, ResponseStreamTimedOutOptions } from '@packages/types'
import type { Readable } from 'stream'

export class AppCaptureProtocol implements AppCaptureProtocolInterface {
  constructor () {
    throw new Error('Error instantiating Protocol Capture')
  }
  cdpReconnect (): Promise<void> {
    return Promise.resolve()
  }

  preAfterTest (test: Record<string, any>, options: Record<string, any>): Promise<void> {
    return Promise.resolve()
  }
  connectToBrowser = (cdpClient) => {
    return Promise.resolve()
  }
  addRunnables = (runnables) => {}
  getDbMetadata (): { offset: number, size: number } {
    return {
      offset: 0,
      size: 0,
    }
  }
  beforeSpec ({ archivePath, db }): void {}
  responseStreamReceived (options: ResponseStreamOptions): Readable {
    return options.responseStream
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
  afterTest = (test) => {
    return Promise.resolve()
  }
  responseEndedWithEmptyBody: (options: ResponseEndedWithEmptyBodyOptions) => {}
  responseStreamTimedOut: (options: ResponseStreamTimedOutOptions) => {}
}
