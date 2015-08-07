pkg = require("../package.json")

describe "updater", ->
  beforeEach ->
    @updater = @sandbox.spy =>
      @obj = {notify: @sandbox.stub()}

    proxyquire("../lib/cli", {
      "update-notifier": @updater
    })

  it "passes package.json and updateCheckInterval on cli", ->
    oneHour = 1000 * 60 * 60
    expect(@updater).to.be.calledWith({pkg: pkg, updateCheckInterval: oneHour})

  it "calls notify", ->
    expect(@obj.notify).to.be.calledOnce
