/* global Debug, CDP, CY_PROTOCOL_DIR, betterSqlite3Binding, nodePath, Database */

const AppCaptureProtocol = class {
  constructor () {
    this.Debug = Debug
    this.CDP = CDP
    this.CY_PROTOCOL_DIR = CY_PROTOCOL_DIR
    this.betterSqlite3Binding = betterSqlite3Binding
    this.nodePath = nodePath
    this.Database = Database

    this.connectToBrowser = this.connectToBrowser.bind(this)
    this.beforeSpec = this.beforeSpec.bind(this)
    this.afterSpec = this.afterSpec.bind(this)
    this.beforeTest = this.beforeTest.bind(this)
  }

  async connectToBrowser ({
    target,
    host,
    port,
  }) {
    return Promise.resolve()
  }

  beforeSpec (spec) {

  }

  afterSpec (spec) {
  }

  beforeTest (test) {

  }
}

module.exports = {
  AppCaptureProtocol,
}
