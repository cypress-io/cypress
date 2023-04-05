/* global Debug */

const AppCaptureProtocol = class {
  constructor () {
    this.Debug = Debug

    this.connectToBrowser = this.connectToBrowser.bind(this)
    this.addRunnables = this.addRunnables.bind(this)
    this.beforeSpec = this.beforeSpec.bind(this)
    this.afterSpec = this.afterSpec.bind(this)
    this.beforeTest = this.beforeTest.bind(this)
    this.commandLogAdded = this.commandLogAdded.bind(this)
    this.commandLogChanged = this.commandLogChanged.bind(this)
  }

  connectToBrowser (cdpClient) {
    return Promise.resolve()
  }
  addRunnables (runnables) {}
  beforeSpec (spec) {}
  afterSpec (spec) {}
  beforeTest (test) {}
  commandLogAdded (log, timestamp) {}
  commandLogChanged (log, timestamp) {}
}

module.exports = {
  AppCaptureProtocol,
}
