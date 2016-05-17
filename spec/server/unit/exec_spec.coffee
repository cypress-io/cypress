require("../spec_helper")

fs = require("fs")
exec = require("#{root}lib/exec")

testFile = "_exec_test.txt"

runCommand = (cmd, timeout = 1000, env = {}) ->
  exec.run(process.cwd(), { cmd, timeout, env })

fail = (message) -> throw new Error(message)

describe "lib/exec", ->
  before ->
    fs.writeFileSync(testFile, "here's some text\non multiple lines\n")

  after ->
    fs.unlinkSync(testFile)

  it "reports the stdout", ->
    runCommand("cat #{testFile}")
    .catch ->
      fail("should not reject")
    .then (result)->
      expect(result.stdout).to.eql "here's some text\non multiple lines\n"

  it "handles multiple data events", ->
    runCommand("echo 'foo'; sleep 0.01; echo 'bar'")
    .catch ->
      fail("should not reject")
    .then (result)->
      expect(result.stdout).to.eql "foo\nbar\n"

  it "handles various arguments", ->
    runCommand("cat -be #{testFile}")
    .catch ->
      fail("should not reject")
    .then (result)->
      expect(result.stdout).to.eql "     1\there's some text$\n     2\ton multiple lines$\n"

  it "handles pipes", ->
    runCommand("cat #{testFile} | grep some")
    .catch ->
      fail("should not reject")
    .then (result)->
      expect(result.stdout).to.eql "here's some text\n"

  it "passes through environment variables already in env", ->
    process.env.ALREADY_THERE = "already there"
    runCommand("echo $ALREADY_THERE")
    .catch ->
      fail("should not reject")
    .then (result)->
      expect(result.stdout).to.eql "already there\n"

  it "passes through environment variables specified", ->
    runCommand("echo $SOME_VAR", null, { SOME_VAR: "foo" })
    .catch ->
      fail("should not reject")
    .then (result)->
      expect(result.stdout).to.eql "foo\n"

  it "reports the stderr", ->
    runCommand(">&2 echo 'some error'")
    .catch ->
      fail("should not reject")
    .then (result)->
      expect(result.stderr).to.eql "some error\n"

  it "errors on non-zero exit", ->
    runCommand("cat nooope")
    .then ->
      fail("should not resolve")
    .catch (err)->
      expect(err.message).to.equal "Process exited with code 1"
      expect(err.timedout).to.be.undefined

  it "errors when it times out", ->
    runCommand("sleep 2", 0)
    .then ->
      fail("should not resolve")
    .catch (err)->
      expect(err.message).to.equal "Process timed out"
      expect(err.timedout).to.be.true
