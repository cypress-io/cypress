require("../spec_helper")

fs = require("fs")
exec = require("#{root}lib/exec")

testFile = "_exec_test.txt"

runCommand = (cmd) -> exec.run(process.cwd(), { cmd })

describe "exec", ->
  before ->
    fs.writeFileSync(testFile, "here's some text\non multiple lines\n")

  after ->
    fs.unlinkSync(testFile)

  it "reports the stdout", ->
    runCommand("cat #{testFile}").then (result)->
      expect(result.stdout).to.eql ["here's some text\non multiple lines\n"]

  it "handles various arguments", ->
    runCommand("cat -be #{testFile}").then (result)->
      expect(result.stdout).to.eql ["     1\there's some text$\n     2\ton multiple lines$\n"]

  it "handles pipes", ->
    runCommand("cat #{testFile} | grep some").then (result)->
      expect(result.stdout).to.eql ["here's some text\n"]

  it "reports the stderr", ->
    runCommand(">&2 echo 'some error'").then (result)->
      expect(result.stderr).to.eql ["some error\n"]

  it "errors on non-zero exit", ->
    runCommand("cat nooope").catch (err)->
      expect(err.message).to.equal "Process exited with code 1"
