import path from 'path'
import fs from 'fs-extra'
import type { AppCaptureProtocolInterface, ResponseStreamOptions } from '@packages/types'
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
    beforeSpec: [],
    afterSpec: [],
    beforeTest: [],
    preAfterTest: [],
    afterTest: [],
    addRunnables: [],
    connectToBrowser: [],
    commandLogAdded: [],
    commandLogChanged: [],
    viewportChanged: [],
    urlChanged: [],
    pageLoading: [],
    resetTest: [],
  }

  getDbMetadata (): { offset: number, size: number } {
    return undefined
  }

  responseStreamReceived (options: ResponseStreamOptions): Readable {
    return options.responseStream
  }

  resetEvents () {
    this.events.beforeTest = []
    this.events.preAfterTest = []
    this.events.afterTest = []
    this.events.commandLogAdded = []
    this.events.commandLogChanged = []
    this.events.viewportChanged = []
    this.events.urlChanged = []
    this.events.pageLoading = []
  }

  connectToBrowser = (cdpClient) => {
    if (cdpClient) this.events.connectToBrowser.push(true)

    return Promise.resolve()
  }

  addRunnables = (runnables) => {
    this.events.addRunnables.push(runnables)

    return Promise.resolve()
  }

  beforeSpec = ({ archivePath, db }) => {
    this.events.beforeSpec.push(db)
    this.filename = getFilePath(path.basename(db.name))
    // Write a tar file so that it can be fake uploaded
    fs.writeFileSync(archivePath, '')
  }

  afterSpec = () => {
    this.events.afterSpec.push(true)

    try {
      fs.outputFileSync(this.filename, JSON.stringify(this.events, null, 2))
    } catch (e) {
      console.log('error writing protocol events', e)
    }

    return Promise.resolve()
  }

  beforeTest = (test) => {
    this.events.beforeTest.push(test)

    return Promise.resolve()
  }

  commandLogAdded = (log) => {
    this.events.commandLogAdded.push(log)
  }

  commandLogChanged = (log) => {
    // since the number of log changes can vary per run, we only want to record
    // the passed/failed ones to ensure the snapshot can be compared
    if (log.state === 'passed' || log.state === 'failed') {
      this.events.commandLogChanged.push(log)
    }
  }

  viewportChanged = (input) => {
    this.events.viewportChanged.push(input)
  }

  urlChanged = (input) => {
    this.events.urlChanged.push(input)
  }

  pageLoading = (input) => {
    this.events.pageLoading.push(input)
  }

  preAfterTest = (test, options) => {
    this.events.preAfterTest.push({ test, options })

    return Promise.resolve()
  }

  afterTest = (test) => {
    this.events.afterTest.push(test)

    return Promise.resolve()
  }

  resetTest (testId: string): void {
    this.resetEvents()

    this.events.resetTest.push(testId)
  }
}
