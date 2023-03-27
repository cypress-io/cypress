/* global Debug, Kysely, SqliteDialect */

const AppCaptureProtocol = class {
  constructor () {
    this.Debug = Debug
    this.Kysely = Kysely
    this.SqliteDialect = SqliteDialect

    this.connectToBrowser = this.connectToBrowser.bind(this)
    this.addRunnables = this.addRunnables.bind(this)
    this.beforeSpec = this.beforeSpec.bind(this)
    this.afterSpec = this.afterSpec.bind(this)
    this.beforeTest = this.beforeTest.bind(this)
  }

  connectToBrowser ({
    target,
    host,
    port,
  }) {
    return Promise.resolve()
  }

  addRunnables (runnables) {}

  beforeSpec (spec) {}

  afterSpec (spec) {}

  beforeTest (test) {}
}

module.exports = {
  AppCaptureProtocol,
}
