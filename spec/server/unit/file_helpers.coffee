sinon       = require('sinon')
FileHelpers = require('../../../lib/util/file_helpers')

require('chai')
.use(require('sinon-chai'))
.should()

describe "File helpers", ->
  beforeEach ->
    @fileHelpers = new FileHelpers

  it "should match file protocal", ->
    @fileHelpers.isFileProtocol("file://foo.txt")
    .should.be.true

  it "should detect absolute request", ->
    @fileHelpers.isAbsolute("/bob/jones")
    .should.be.true

  it "should not detect relative request", ->
    @fileHelpers.isAbsolute("http://bob/jones")
    .should.be.false

  describe "#detectType", ->
    it "detects urls", ->
      @fileHelpers.detectType('http://www.google.com')
      .should.eql('url')

    it "detects file urls", ->
      @fileHelpers.detectType('file:///usr/lib/pron')
      .should.eql('file')

    it "detects relative paths", ->
      @fileHelpers.detectType('/usr/lib/dogecoin/vault.txt')
      .should.eql('absolute')