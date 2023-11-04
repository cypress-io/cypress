import path from 'path'
import fs from 'fs-extra'
import type { AppCaptureProtocolInterface, ResponseEndedWithEmptyBodyOptions, ResponseStreamOptions, ResponseStreamTimedOutOptions } from '@packages/types'
import type { Readable } from 'stream'

const getFilePath = (filename) => {
  return path.join(
    path.resolve(__dirname),
    'cypress',
    'system-tests-protocol-dbs',
    `${filename}.json`,
  )
}

export class AppCaptureProtocol implements AppCaptureProtocolInterface {
  private filename: string
  private events = {
    numberOfFontRequests: 0,
  }
  private cdpClient: any

  getDbMetadata (): { offset: number, size: number } {
    return {
      offset: 0,
      size: 0,
    }
  }

  responseStreamReceived (options: ResponseStreamOptions): Readable {
    return options.responseStream
  }

  connectToBrowser = async (cdpClient) => {
    if (cdpClient) {
      this.cdpClient = cdpClient
    }

    this.cdpClient.on('Network.requestWillBeSent', (params) => {
      // For the font flooding test, we want to count the number of font requests.
      // There should only be 2 requests. One for each test in the spec.
      if (params.type === 'Font') {
        this.events.numberOfFontRequests += 1
      }
    })
  }

  addRunnables = (runnables) => {
    return Promise.resolve()
  }

  beforeSpec = ({ archivePath, db }) => {
    this.filename = getFilePath(path.basename(db.name))

    if (!fs.existsSync(archivePath)) {
      // If a dummy file hasn't been created by the test, write a tar file so that it can be fake uploaded
      fs.writeFileSync(archivePath, '')
    }
  }

  async afterSpec (): Promise<void> {
    try {
      fs.outputFileSync(this.filename, JSON.stringify(this.events, null, 2))
    } catch (e) {
      console.log('error writing protocol events', e)
    }
  }

  beforeTest = (test) => {
    return Promise.resolve()
  }

  commandLogAdded = (log) => {
  }

  commandLogChanged = (log) => {
  }

  viewportChanged = (input) => {
  }

  urlChanged = (input) => {
  }

  pageLoading = (input) => {
  }

  preAfterTest = (test, options) => {
    return Promise.resolve()
  }

  afterTest = (test) => {
    return Promise.resolve()
  }

  responseEndedWithEmptyBody = (options: ResponseEndedWithEmptyBodyOptions) => {
  }

  responseStreamTimedOut (options: ResponseStreamTimedOutOptions): void {
  }

  resetTest (testId: string): void {
  }
}
