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
    fontRequests: [] as string[],
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

    await this.cdpClient.send('Network.enable')
    this.cdpClient.on('Network.requestWillBeSent', (params) => {
      // The urls are recorded, rather than just a count, so a failing assertion in
      // the font flooding system test reports what the browser requested.
      if (params.type === 'Font') {
        this.events.fontRequests.push(params.request.url)
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
