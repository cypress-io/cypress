require("../spec_helper")

fs = require("fs")
exec = require("#{root}lib/exec")

testFile = "_exec_test.txt"

runCommand = (cmd, timeout = 1000) -> exec.run(process.cwd(), { cmd, timeout })
fail = (message) -> throw new Error(message)

describe "lib/exec", ->
  before ->
    fs.writeFileSync(testFile, "here's some text\non multiple lines\n")

  after ->
    fs.unlinkSync(testFile)

  it "reports the stdout", ->
    runCommand("cat #{testFile}")
    .then (result)->
      expect(result.stdout).to.eql ["here's some text\non multiple lines\n"]
    .catch ->
      fail("should not reject")

  it "handles various arguments", ->
    runCommand("cat -be #{testFile}")
    .then (result)->
      expect(result.stdout).to.eql ["     1\there's some text$\n     2\ton multiple lines$\n"]
    .catch ->
      fail("should not reject")

  it "handles pipes", ->
    runCommand("cat #{testFile} | grep some")
    .then (result)->
      expect(result.stdout).to.eql ["here's some text\n"]
    .catch ->
      fail("should not reject")

  it "reports the stderr", ->
    runCommand(">&2 echo 'some error'")
    .then (result)->
      expect(result.stderr).to.eql ["some error\n"]
    .catch ->
      fail("should not reject")

  it "errors on non-zero exit", ->
    runCommand("cat nooope")
    .then ->
      fail("should not resolve")
    .catch (err)->
      expect(err.message).to.equal "Process exited with code 1"

  it "errors when it times out", ->
    runCommand("cat #{testFile}", 0)
    .then ->
      fail("should not resolve")
    .catch (err)->
      expect(err.message).to.equal "Process timed out"
