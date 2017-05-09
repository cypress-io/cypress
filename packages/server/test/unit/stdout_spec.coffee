require("../spec_helper")

stdout = require("#{root}lib/stdout")

describe "lib/stdout", ->
  beforeEach ->
    @write    = @sandbox.spy(process.stdout, "write")
    @captured = stdout.capture()

  afterEach ->
    stdout.restore()

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
