require("../spec_helper")

_    = require("underscore")
exec = require("#{root}lib/exec")

runCommand = (cmd, options = {}) ->
  _.defaults(options, {
    cmd: cmd
    timeout: 1000
    env: {}
    failOnNonZeroExit: true
  })
  exec.run(process.cwd(), options)

fail = (message) -> throw new Error(message)

describe "lib/exec", ->

  describe "when exit code is 0", ->

    it "reports the stdout, stderr, and code", ->
      runCommand("echo 'foo'")
      .catch (err) ->
        fail("should not reject, but rejected with: #{err.message}")
      .then (result)->
        expect(result.stdout).to.equal "foo\n"
        expect(result.stderr).to.equal ""
        expect(result.code).to.equal 0

    it "handles multiple data events", ->
      runCommand("echo 'foo'; sleep 0.01; echo 'bar'")
      .catch (err) ->
        fail("should not reject, but rejected with: #{err.message}")
      .then (result)->
        expect(result.stdout).to.equal "foo\nbar\n"

    it "handles arguments and pipes", ->
      runCommand("echo 'foo\nbar\nbaz' | grep -n -C 1 ar")
      .catch (err) ->
        fail("should not reject, but rejected with: #{err.message}")
      .then (result)->
        expect(result.stdout).to.equal "1-foo\n2:bar\n3-baz\n"

    it "passes through environment variables already in env", ->
      process.env.ALREADY_THERE = "already there"
      runCommand("echo $ALREADY_THERE")
      .catch (err) ->
        fail("should not reject, but rejected with: #{err.message}")
      .then (result)->
        expect(result.stdout).to.equal "already there\n"

    it "passes through environment variables specified", ->
      runCommand("echo $SOME_VAR", { env: { SOME_VAR: "foo" } })
      .catch (err) ->
        fail("should not reject, but rejected with: #{err.message}")
      .then (result)->
        expect(result.stdout).to.equal "foo\n"

    it "reports the stderr", ->
      runCommand(">&2 echo 'some error'")
      .catch (err) ->
        fail("should not reject, but rejected with: #{err.message}")
      .then (result)->
        expect(result.stderr).to.equal "some error\n"

  describe "when exit code is non-zero", ->

    it "reports the stdout, stderr, and code", ->
      runCommand("cat nooope")
      .catch (err) ->
        fail("should not reject, but rejected with: #{err.message}")
      .then (result)->
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
