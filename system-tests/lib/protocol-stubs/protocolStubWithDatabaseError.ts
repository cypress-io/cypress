import fs from 'fs-extra'
import type { AppCaptureProtocolInterface, ResponseEndedWithEmptyBodyOptions, ResponseStreamOptions } from '@packages/types'
import type { Readable } from 'stream'

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
    return {
      offset: 0,
      size: 0,
    }
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
    throw new Error(`/lib/x86_64-linux-gnu/libm.so.6: version 'GLIBC_2.29' not found (required by /home/semaphore/.cache/Cypress/13.2.0/Cypress/resources/app/node_modules/better-sqlite3/build/Release/better_sqlite3.node)`)
  }

  afterSpec = () => {
    this.events.afterSpec.push(true)

    // since the order of the logs can vary per run, we sort them by id to ensure the snapshot can be compared
    this.events.commandLogChanged.sort((log1, log2) => {
      return log1.id.localeCompare(log2.id)
    })

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

  responseEndedWithEmptyBody: (options: ResponseEndedWithEmptyBodyOptions) => {}
}
