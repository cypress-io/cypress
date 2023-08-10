import path from 'path'
import fs from 'fs-extra'
import type { AppCaptureProtocolInterface } from '@packages/types'

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

  resetEvents () {
    this.events.beforeTest = []
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
  beforeSpec = (db) => {
    this.events.beforeSpec.push(db)
    this.filename = getFilePath(path.basename(db.name))

    // we aren't going to write to the db file, so might as well delete it
    fs.removeSync(db.name)
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
  afterTest = (test) => {
    this.events.afterTest.push(test)

    return Promise.resolve()
  }

  resetTest (testId: string): void {
    this.resetEvents()

    this.events.resetTest.push(testId)
  }
}
