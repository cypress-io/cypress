require("../spec_helper")

exec = require("#{root}lib/exec")

runCommand = (cmd, timeout = 1000, env = {}) ->
  exec.run(process.cwd(), { cmd, timeout, env })

fail = (message) -> throw new Error(message)

describe "lib/exec", ->
  it "reports the stdout", ->
    runCommand("echo 'foo'")
    .catch (err) ->
      fail("should not reject, but rejected with: #{err.message}")
    .then (result)->
      expect(result.stdout).to.equal "foo\n"

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
    runCommand("echo $SOME_VAR", null, { SOME_VAR: "foo" })
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

  it "errors on non-zero exit", ->
    runCommand("cat nooope")
    .then ->
      fail("should not resolve")
    .catch (err) ->
      expect(err.message).to.equal "Process exited with code 1"
      expect(err.timedout).to.be.undefined

  it "errors when it times out", ->
    runCommand("sleep 2", 0)
    .then ->
      fail("should not resolve")
    .catch (err) ->
      expect(err.message).to.equal "Process timed out"
      expect(err.timedout).to.be.true
