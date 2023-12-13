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

type URLAndFrame = {
  url: string
  frameId: string
}

export class AppCaptureProtocol implements AppCaptureProtocolInterface {
  private filename: string
  private events = {
    numberOfResponseStreamReceivedEvents: 0,
    correlatedUrls: {},
  }
  private idToUrlAndFrameMap = new Map<string, URLAndFrame>()

  getDbMetadata (): { offset: number, size: number } {
    return {
      offset: 0,
      size: 0,
    }
  }

  responseStreamReceived (options: ResponseStreamOptions): Readable {
    this.events.numberOfResponseStreamReceivedEvents += 1

    const frameIds = this.events.correlatedUrls[this.idToUrlAndFrameMap[options.requestId].url] || []

    if (!frameIds.includes(this.idToUrlAndFrameMap[options.requestId].frameId)) {
      this.events.correlatedUrls[this.idToUrlAndFrameMap[options.requestId].url] = frameIds
    }

    frameIds.push(this.idToUrlAndFrameMap[options.requestId].frameId)

    return options.responseStream
  }

  connectToBrowser = async (cdpClient) => {
    cdpClient.on('Network.requestWillBeSent', (event) => {
      this.idToUrlAndFrameMap[event.requestId] = {
        url: event.request.url,
        frameId: event.frameId ? 'frame id' : 'no frame id',
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
