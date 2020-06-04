/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../spec_helper");

const _   = require("lodash");
const R   = require("ramda");
const cp  = require("child_process");
const pr  = require("../support/helpers/process");
const pkg = require("../../package.json");
const execa = require("execa");
const semver = require("semver");

const anyLineWithCaret = str => str[0] === ">";

const clean = str => //# remove blank lines and slice off any line
//# starting with a caret because thats junk
//# from npm logs
_
.chain(str)
.split("\n")
.compact()
.reject(anyLineWithCaret)
.join("\n")
.value();

const env = _.omit(process.env, "CYPRESS_DEBUG");

describe("CLI Interface", function() {
  beforeEach(function() {
    //# set the timeout high due to
    //# spawning child processes
    return this.currentTest.timeout(20000);
  });

  it("writes out ping value and exits", done => cp.exec("npm run dev -- --cwd=/foo/bar --smoke-test --ping=12345", {env}, function(err, stdout, stderr) {
    if (err) { done(err); }

    expect(clean(stdout)).to.eq("12345");
    return done();
  }));

  it("writes out package.json and exits", done => cp.exec("npm run dev -- --return-pkg", {env}, function(err, stdout, stderr) {
    if (err) { done(err); }

    const json = JSON.parse(clean(stdout));
    expect(json.name).to.eq("cypress");
    expect(json.productName).to.eq("Cypress", stdout);
    return done();
  }));

  //# this tests that our exit codes are correct.
  //# there was a bug at one point where we incorrectly
  //# spawned child electron processes and did not bubble
  //# up their exit codes to the calling process. this
  //# caused false-positives in CI because tests were failing
  //# but the exit code was always zero
  return context("exit codes", function() {
    describe("from start script command", function() {
      beforeEach(function() {
        //# run the start script directly
        //# instead of going through npm wrapper
        return this.dev = pkg.scripts.dev;
      });

      it("exits with code 22", function(done) {
        const s = cp.exec(`${this.dev} --exit-with-code=22`);
        return s.on("close", function(code) {
          expect(code).to.eq(22);
          return done();
        });
      });

      return it("exits with code 0", function(done) {
        const s = cp.exec(`${this.dev} --exit-with-code=0`);
        return s.on("close", function(code) {
          expect(code).to.eq(0);
          return done();
        });
      });
    });

    return describe("through NPM script", function() {
      let npmVersion = null;

      const isNpmSlurpingCode = () => semver.lt(npmVersion, '4.0.0');

      beforeEach(() => execa("npm", ["-version"])
      .then(R.prop("stdout"))
      .then(function(version) {
        npmVersion = version;
        return expect(npmVersion).to.be.a.string;
      }));

      it("npm slurps up or not exit value on failure", function(done) {
        const expectedCode = isNpmSlurpingCode() ? 1 : 10;
        const s = cp.exec("npm run dev -- --exit-with-code=10");
        return s.on("close", function(code) {
          expect(code).to.eq(expectedCode);
          return done();
        });
      });

      return it("npm passes on 0 exit code", function(done) {
        const s = cp.exec("npm run dev -- --exit-with-code=0");
        return s.on("close", function(code) {
          expect(code).to.eq(0);
          return done();
        });
      });
    });
  });
});
