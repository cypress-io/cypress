require("../spec_helper")

_ = require("lodash")
cp = require("#{root}lib/util/child_process")
exec = require("#{root}lib/exec")

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

  beforeEach ->
    @shell = process.env.SHELL

    exec.reset()

  afterEach ->
    if @shell
      process.env.SHELL = @shell

  describe "when exit code is 0", ->
    it "reports the stdout, stderr, and code", ->
      runCommand("echo 'foo'")
      .then (result) ->
        expect(result.stdout).to.equal "foo\n"
        expect(result.stderr).to.equal ""
        expect(result.code).to.equal 0

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
        expect(result.stdout).to.equal "already there\n"

    it "passes through environment variables specified", ->
      runCommand("echo $SOME_VAR", { env: { SOME_VAR: "foo" } })
      .then (result) ->
        expect(result.stdout).to.equal "foo\n"

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
        expect(result.stderr).to.equal "some error\n"

  describe "when exit code is non-zero", ->
    it "reports the stdout, stderr, and code", ->
      runCommand("cat nooope")
      .then (result) ->
        expect(result.stdout).to.equal ""
        expect(result.stderr).to.equal "cat: nooope: No such file or directory\n"
        expect(result.code).to.equal 1

  describe "when process times out", ->

    it "errors", ->
      runCommand("sleep 2", { timeout: 0 })
      .then ->
        fail("should not resolve")
      .catch (err) ->
        expect(err.message).to.equal "Process timed out"
        expect(err.timedout).to.be.true
