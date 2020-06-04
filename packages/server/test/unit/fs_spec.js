require("../spec_helper")

fs = require("#{root}lib/util/fs")

describe "lib/util/fs", ->
  beforeEach () ->
    sinon.spy(console, "error")

  it "warns when trying to use fs.existsSync", ->
    fs.existsSync(__filename)
    warning = "WARNING: fs sync methods can fail due to EMFILE errors"
    expect(console.error).to.be.calledWith(warning)
    # also print stack trace, maybe check that

  context "fs.pathExists", ->
    it "finds this file", ->
      fs.pathExists(__filename)
      .then (found) ->
        expect(found).to.be.true

    it "does not find non-existent file", ->
      fs.pathExists('does-not-exist')
      .then (found) ->
        expect(found).to.be.false
