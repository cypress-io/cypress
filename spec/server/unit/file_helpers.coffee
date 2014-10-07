sinon       = require('sinon')
fileHelpers = require('../../../lib/util/file_helpers')

require('chai').should()

describe "File helpers", ->
  it "should match file protocal", ->
    fileHelpers.isFileProtocol("file://foo.txt")
    .should.be.true

  it "should detect relative request", ->
    fileHelpers.isRelativeRequest("/bob/jones")
    .should.be.true

  it "should not detect relative request", ->
    fileHelpers.isRelativeRequest("http://bob/jones")
    .should.be.false
