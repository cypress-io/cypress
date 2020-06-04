/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../spec_helper");

const _ = require("lodash");
const cp = require(`${root}lib/util/child_process`);
const os = require("os");
const exec = require(`${root}lib/exec`);

const isWindows = () => os.platform() === "win32";

const runCommand = function(cmd, options = {}) {
  _.defaults(options, {
    cmd,
    timeout: 10000,
    env: {},
    failOnNonZeroExit: true
  });
  return exec.run(process.cwd(), options);
};

const fail = function(message) { throw new Error(message); };

describe("lib/exec", function() {
  this.timeout(10000);

  describe("basic tests", function() {
    it("returns only stdout, stderr, and code", () => runCommand("echo foo")
    .then(function(result) {
      const props = Object.keys(result);
      return expect(props).to.deep.eq(["stdout", "stderr", "code"]);
    }));

    return it("reports the stdout, stderr, and code for single word", () => runCommand("echo foo")
    .then(function(result) {
      const expected = {
        stdout: "foo",
        stderr: "",
        code: 0
      };
      return expect(result).to.deep.eq(expected);
    }));
  });

  context("#windows", function() {
    if (!isWindows()) { return; }

    // Windows command prompt is really limited
    // C:\Windows\system32\cmd.exe

    it("reports the stdout, stderr, and code for single quoted word", () => runCommand("echo 'foo'")
    .then(function(result) {
      const expected = {
        stdout: "'foo'",
        stderr: "",
        code: 0
      };
      return expect(result).to.deep.eq(expected);
    }));

    it("reports the stdout, stderr, and code", () => runCommand("echo 'foo bar'")
    .then(function(result) {
      const expected = {
        stdout: "'foo bar'",
        stderr: "",
        code: 0
      };
      return expect(result).to.deep.eq(expected);
    }));

    it("handles multiple data events", () => runCommand("echo 'foo'; sleep 0.01; echo 'bar'")
    .then(result => expect(result.stdout).to.equal("'foo'; sleep 0.01; echo 'bar'")));

    it("passes through environment variables already in env", function() {
      process.env.ALREADY_THERE = "already there";
      return runCommand("echo %ALREADY_THERE%")
      .then(result => expect(result.stdout).to.equal("already there"));
    });

    it("passes through environment variables specified", () => runCommand("echo %SOME_VAR%", { env: { SOME_VAR: "foo" } })
    .then(result => expect(result.stdout).to.equal("foo")));

    it("test what happens when command is invalid", () => runCommand("foo")
    .then(function(result) {
      expect(result.code).to.eq(1);
      return expect(result.stderr).to.include("'foo' is not recognized as an internal or external command");
    }));

    it("reports the stderr", () => runCommand(">&2 echo 'some error'")
    .then(function(result) {
      expect(result.code).to.eq(0);
      return expect(result.stderr).to.equal("'some error'");
    }));

    describe("when exit code is non-zero", () => it("reports the stdout, stderr, and code", () => runCommand("type nooope")
    .then(function(result) {
      expect(result.stdout).to.equal("");
      expect(result.stderr).to.equal("The system cannot find the file specified.");
      expect(result.code).to.equal(1);
      // stderr should be trimmed already
      return expect(result.stderr.trim()).to.equal(result.stderr);
    })));

    return describe("when process times out", () => it("errors", () => runCommand("pause", { timeout: 0 })
    .then(() => fail("should not resolve")).catch(function(err) {
      expect(err.message).to.include("Process timed out");
      expect(err.message).to.include("command: pause");
      return expect(err.timedOut).to.be.true;
    })));
  });

  return context("#linux / mac", function() {
    if (isWindows()) { return; }

    it("reports the stdout, stderr, and code for single quoted word", () => runCommand("echo 'foo'")
    .then(function(result) {
      const expected = {
        stdout: "foo",
        stderr: "",
        code: 0
      };
      return expect(result).to.deep.eq(expected);
    }));

    it("reports the stdout, stderr, and code", () => runCommand("echo 'foo bar'")
    .then(function(result) {
      const expected = {
        stdout: "foo bar",
        stderr: "",
        code: 0
      };
      return expect(result).to.deep.eq(expected);
    }));

    it("handles multiple data events", () => runCommand("echo 'foo'; sleep 0.01; echo 'bar'")
    .then(result => expect(result.stdout).to.equal("foo\nbar")));

    it("handles arguments and pipes", () => runCommand("echo 'foo\nbar\nbaz' | grep -n -C 1 ar")
    .then(result => expect(result.stdout).to.equal("1-foo\n2:bar\n3-baz")));

    it("passes through environment variables already in env", function() {
      process.env.ALREADY_THERE = "already there";
      return runCommand("echo $ALREADY_THERE")
      .then(result => expect(result.stdout).to.equal("already there"));
    });

    it("passes through environment variables specified", () => runCommand("echo $SOME_VAR", { env: { SOME_VAR: "foo" } })
    .then(result => expect(result.stdout).to.equal("foo")));

    it("reports the stderr", () => runCommand(">&2 echo 'some error'")
    .then(function(result) {
      expect(result.code).to.eq(0);
      return expect(result.stderr).to.equal("some error");
    }));

    describe("when exit code is non-zero", () => it("reports the stdout, stderr, and code", () => runCommand("cat nooope")
    .then(function(result) {
      expect(result.stdout).to.equal("");
      expect(result.stderr).to.equal("cat: nooope: No such file or directory");
      expect(result.code).to.equal(1);
      // stderr should be trimmed already
      return expect(result.stderr.trim()).to.equal(result.stderr);
    })));

    return describe("when process times out", () => it("errors", () => runCommand("sleep 2", { timeout: 0 })
    .then(() => fail("should not resolve")).catch(function(err) {
      expect(err.message).to.include("Process timed out");
      expect(err.message).to.include("command: sleep 2");
      return expect(err.timedOut).to.be.true;
    })));
  });
});
