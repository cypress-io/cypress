require("../spec_helper")

_ = require("lodash")
cp = require("#{root}lib/util/child_process")
R = require("ramda")
os = require("os")
exec = require("#{root}lib/exec")

isWindows = () ->
  os.platform() == "win32"

runCommand = (cmd, options = {}) ->
  _.defaults(options, {
    cmd: cmd
    timeout: 10000
    env: {}
    failOnNonZeroExit: true
  })
  exec.run(process.cwd(), options)

fail = (message) -> throw new Error(message)

pickMainProps = R.pick(["stdout", "stderr", "code"])

describe "lib/exec", ->
  @timeout(10000)

  beforeEach ->
    @shell = process.env.SHELL

  afterEach ->
    if @shell
      process.env.SHELL = @shell

  describe "basic tests", ->
    it "reports the stdout, stderr, and code for single word", ->
      runCommand("echo foo")
      .then pickMainProps
      .then (result) ->
        expected = {
          stdout: "foo",
          stderr: "",
          code: 0
        }
        expect(result).to.deep.eq(expected)

    it "reports the stdout, stderr, and code for single quoted word", ->
      runCommand("echo 'foo'")
      .then pickMainProps
      .then (result) ->
        expected = {
          stdout: "'foo'",
          stderr: "",
          code: 0
        }
        expect(result).to.deep.eq(expected)

    it "reports the stdout, stderr, and code", ->
      runCommand("echo 'foo bar'")
      .then pickMainProps
      .then (result) ->
        expected = {
          stdout: "'foo bar'",
          stderr: "",
          code: 0
        }
        expect(result).to.deep.eq(expected)

  context "#windows", ->
    return if not isWindows()

    # Windows command prompt is really limited
    # C:\Windows\system32\cmd.exe
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
          # remove \r\n before comparing
          expect(result.stderr.trim()).to.equal "The system cannot find the file specified."
          expect(result.code).to.equal 1

    describe "when process times out", ->
      it "errors", ->
        runCommand("pause", { timeout: 0 })
        .then ->
          fail("should not resolve")
        .catch (err) ->
          expect(err.message).to.include "Process timed out"
          expect(err.message).to.include "command: pause"
          expect(err.timedout).to.be.true

  context "#linux / mac", ->
    return if isWindows()

    it "handles multiple data events", ->
      runCommand("echo 'foo'; sleep 0.01; echo 'bar'")
      .then (result) ->
        expect(result.stdout).to.equal "foo\nbar\n"

    it "handles arguments and pipes", ->
      runCommand("echo 'foo\nbar\nbaz' | grep -n -C 1 ar")
      .then (result) ->
        expect(result.stdout).to.equal "1-foo\n2:bar\n3-baz\n"

    it "passes through environment variables already in env", ->
      process.env.ALREADY_THERE = "already there"
      runCommand("echo $ALREADY_THERE")
      .then (result) ->
        expect(result.stdout).to.equal "already there"

    it "passes through environment variables specified", ->
      runCommand("echo $SOME_VAR", { env: { SOME_VAR: "foo" } })
      .then (result) ->
        expect(result.stdout).to.equal "foo"

    it "falls back to asking for bash on docker when there is no $SHELL", ->
      delete process.env.SHELL
      @sandbox.stub(cp, "execAsync").withArgs("which bash").resolves("/bin/bash")

      runCommand("echo foo")
      .then (result) ->
        expect(result.stdout).to.eq("foo\n")
        expect(cp.execAsync).to.be.calledWith("which bash")

    it.skip "TODO: test what happens when which bash fails - like on windows", ->
      @sandbox.stub(cp, "execAsync").withArgs("which bash").rejects(new Error())

      runCommand("echo foo")
      .then (result) ->
        expect(result.stdout).to.eq("foo\n")

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

    describe "when process times out", ->
      it "errors", ->
        runCommand("sleep 2", { timeout: 0 })
        .then ->
          fail("should not resolve")
        .catch (err) ->
          expect(err.message).to.include "Process timed out"
          expect(err.message).to.include "command: sleep 2"
          expect(err.timedout).to.be.true
