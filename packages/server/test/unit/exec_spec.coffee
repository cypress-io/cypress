require("../spec_helper")

_ = require("lodash")
cp = require("#{root}lib/util/child_process")
os = require("os")
exec = require("#{root}lib/exec")

isWindows = () ->
  os.platform() is "win32"

runCommand = (cmd, options = {}) ->
  _.defaults(options, {
    cmd: cmd
    timeout: 10000
    env: {}
    failOnNonZeroExit: true
  })
  exec.run(process.cwd(), options)

fail = (message) -> throw new Error(message)

describe "lib/exec", ->
  @timeout(10000)

  describe "basic tests", ->
    it "returns only stdout, stderr, and code", ->
      runCommand("echo foo")
      .then (result) ->
        props = Object.keys(result)
        expect(props).to.deep.eq(["stdout", "stderr", "code"])

    it "reports the stdout, stderr, and code for single word", ->
      runCommand("echo foo")
      .then (result) ->
        expected = {
          stdout: "foo",
          stderr: "",
          code: 0
        }
        expect(result).to.deep.eq(expected)

  context "#windows", ->
    return if not isWindows()

    # Windows command prompt is really limited
    # C:\Windows\system32\cmd.exe

    it "reports the stdout, stderr, and code for single quoted word", ->
      runCommand("echo 'foo'")
      .then (result) ->
        expected = {
          stdout: "'foo'",
          stderr: "",
          code: 0
        }
        expect(result).to.deep.eq(expected)

    it "reports the stdout, stderr, and code", ->
      runCommand("echo 'foo bar'")
      .then (result) ->
        expected = {
          stdout: "'foo bar'",
          stderr: "",
          code: 0
        }
        expect(result).to.deep.eq(expected)

    it "handles multiple data events", ->
      runCommand("echo 'foo'; sleep 0.01; echo 'bar'")
      .then (result) ->
        expect(result.stdout).to.equal "'foo'; sleep 0.01; echo 'bar'"

    it "passes through environment variables already in env", ->
      process.env.ALREADY_THERE = "already there"
      runCommand("echo %ALREADY_THERE%")
      .then (result) ->
        expect(result.stdout).to.equal "already there"

    it "passes through environment variables specified", ->
      runCommand("echo %SOME_VAR%", { env: { SOME_VAR: "foo" } })
      .then (result) ->
        expect(result.stdout).to.equal "foo"

    it "test what happens when command is invalid", ->
      runCommand("foo")
      .then (result) ->
        expect(result.code).to.eq 1
        expect(result.stderr).to.include "'foo' is not recognized as an internal or external command"

    it "reports the stderr", ->
      runCommand(">&2 echo 'some error'")
      .then (result) ->
        expect(result.code).to.eq 0
        expect(result.stderr).to.equal "'some error'"

    describe "when exit code is non-zero", ->
      it "reports the stdout, stderr, and code", ->
        runCommand("type nooope")
        .then (result) ->
          expect(result.stdout).to.equal ""
          expect(result.stderr).to.equal "The system cannot find the file specified."
          expect(result.code).to.equal 1
          # stderr should be trimmed already
          expect(result.stderr.trim()).to.equal result.stderr

    describe "when process times out", ->
      it "errors", ->
        runCommand("pause", { timeout: 0 })
        .then ->
          fail("should not resolve")
        .catch (err) ->
          expect(err.message).to.include "Process timed out"
          expect(err.message).to.include "command: pause"
          expect(err.timedOut).to.be.true

  context "#linux / mac", ->
    return if isWindows()

    it "reports the stdout, stderr, and code for single quoted word", ->
      runCommand("echo 'foo'")
      .then (result) ->
        expected = {
          stdout: "foo",
          stderr: "",
          code: 0
        }
        expect(result).to.deep.eq(expected)

    it "reports the stdout, stderr, and code", ->
      runCommand("echo 'foo bar'")
      .then (result) ->
        expected = {
          stdout: "foo bar",
          stderr: "",
          code: 0
        }
        expect(result).to.deep.eq(expected)

    it "handles multiple data events", ->
      runCommand("echo 'foo'; sleep 0.01; echo 'bar'")
      .then (result) ->
        expect(result.stdout).to.equal "foo\nbar"

    it "handles arguments and pipes", ->
      runCommand("echo 'foo\nbar\nbaz' | grep -n -C 1 ar")
      .then (result) ->
        expect(result.stdout).to.equal "1-foo\n2:bar\n3-baz"

    it "passes through environment variables already in env", ->
      process.env.ALREADY_THERE = "already there"
      runCommand("echo $ALREADY_THERE")
      .then (result) ->
        expect(result.stdout).to.equal "already there"

    it "passes through environment variables specified", ->
      runCommand("echo $SOME_VAR", { env: { SOME_VAR: "foo" } })
      .then (result) ->
        expect(result.stdout).to.equal "foo"

    it "reports the stderr", ->
      runCommand(">&2 echo 'some error'")
      .then (result) ->
        expect(result.code).to.eq 0
        expect(result.stderr).to.equal "some error"

    describe "when exit code is non-zero", ->
      it "reports the stdout, stderr, and code", ->
        runCommand("cat nooope")
        .then (result) ->
          expect(result.stdout).to.equal ""
          expect(result.stderr).to.equal "cat: nooope: No such file or directory"
          expect(result.code).to.equal 1
          # stderr should be trimmed already
          expect(result.stderr.trim()).to.equal result.stderr

    describe "when process times out", ->
      it "errors", ->
        runCommand("sleep 2", { timeout: 0 })
        .then ->
          fail("should not resolve")
        .catch (err) ->
          expect(err.message).to.include "Process timed out"
          expect(err.message).to.include "command: sleep 2"
          expect(err.timedOut).to.be.true
