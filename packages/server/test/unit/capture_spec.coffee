require("../spec_helper")

capture = require("#{root}lib/capture")

describe "lib/capture", ->
  afterEach ->
    capture.restore()

  context "process.stdout.write", ->
    beforeEach ->
      @write    = sinon.spy(process.stdout, "write")
      @captured = capture.stdout()

    it "slurps up stdout", ->
      console.log("foo")
      console.log("bar")
      process.stdout.write("baz")

      expect(@captured.data).to.deep.eq([
        "foo\n"
        "bar\n"
        "baz"
      ])

      expect(@captured.toString()).to.eq("foo\nbar\nbaz")

      ## should still call through to write
      expect(@write).to.be.calledWith("foo\n")
      expect(@write).to.be.calledWith("bar\n")
      expect(@write).to.be.calledWith("baz")

  context "process.log", ->
    beforeEach ->
      @log = process.log
      @logStub = process.log = sinon.stub()

      @captured = capture.stdout()

    afterEach ->
      process.log = @log

    it "slurps up logs", ->
      process.log("foo\n")
      process.log("bar\n")

      expect(@captured.data).to.deep.eq([
        "foo\n"
        "bar\n"
      ])

      expect(@captured.toString()).to.eq("foo\nbar\n")

      ## should still call through to write
      expect(@logStub).to.be.calledWith("foo\n")
      expect(@logStub).to.be.calledWith("bar\n")
