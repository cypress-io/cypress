const { Readable } = require('stream')

class AppCaptureProtocol {
  uploadStallSamplingInterval () {
    return 0
  }
  cdpReconnect () {
    return Promise.resolve()
  }
  responseEndedWithEmptyBody (options) {
    return
  }
  responseStreamTimedOut (options) {
    return
  }
  getDbMetadata () {
    return {
      offset: 0,
      size: 0,
    }
  }
  responseStreamReceived (options) {
    return Readable.from([])
  }
  beforeSpec ({ workingDirectory, archivePath, dbPath, db }) {
  }
  addRunnables (runnables) {
  }
  commandLogAdded (log) {
  }
  commandLogChanged (log) {
  }
  viewportChanged (input) {
  }
  urlChanged (input) {
  }
  beforeTest (test) {
    return Promise.resolve()
  }
  preAfterTest (test, options) {
    return Promise.resolve()
  }
  afterTest (test) {
    return Promise.resolve()
  }
  afterSpec () {
    return Promise.resolve({ durations: {} })
  }
  connectToBrowser (cdpClient) {
    return Promise.resolve()
  }
  pageLoading (input) {
  }
  resetTest (testId) {
  }
}

module.exports = { AppCaptureProtocol }
