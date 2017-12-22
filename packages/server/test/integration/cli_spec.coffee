require("../spec_helper")

_   = require("lodash")
R   = require("ramda")
cp  = require("child_process")
pr  = require("../support/helpers/process")
pkg = require("../../package.json")
root = require("@packages/root")
execa = require("execa")
semver = require("semver")

anyLineWithCaret = (str) ->
  str[0] is ">"

clean = (str) ->
  ## remove blank lines and slice off any line
  ## starting with a caret because thats junk
  ## from npm logs
  _
  .chain(str)
  .split("\n")
  .compact()
  .reject(anyLineWithCaret)
  .join("\n")
  .value()

env = _.omit(process.env, "CYPRESS_DEBUG")

describe "CLI Interface", ->
  beforeEach ->
    ## set the timeout high due to
    ## spawning child processes
    @currentTest.timeout(20000)

  it "writes out ping value and exits", (done) ->
    cp.exec "npm run dev -- --smoke-test --ping=12345", {env: env}, (err, stdout, stderr) ->
      done(err) if err

      expect(clean(stdout)).to.eq("12345")
      done()

  it "writes out package.json and exits", (done) ->
    cp.exec "npm run dev -- --return-pkg", {env: env}, (err, stdout, stderr) ->
      done(err) if err

      json = JSON.parse(clean(stdout))
      expect(json.name).to.eq("cypress")
      expect(json.productName).to.eq("Cypress", stdout)
      done()

  ## this tests that our exit codes are correct.
  ## there was a bug at one point where we incorrectly
  ## spawned child electron processes and did not bubble
  ## up their exit codes to the calling process. this
  ## caused false-positives in CI because tests were failing
  ## but the exit code was always zero
  context "exit codes", ->
    describe "from start script command", ->
      beforeEach ->
        ## run the start script directly
        ## instead of going through npm wrapper
        @dev = pkg.scripts.dev

      it "exits with code 22", (done) ->
        s = cp.exec("#{@dev} --exit-with-code=22")
        s.on "close", (code) ->
          expect(code).to.eq(22)
          done()

      it "exits with code 0", (done) ->
        s = cp.exec("#{@dev} --exit-with-code=0")
        s.on "close", (code) ->
          expect(code).to.eq(0)
          done()

    describe "through NPM script", ->
      npmVersion = null

      isNpmSlurpingCode = () ->
        semver.lt(npmVersion, '4.0.0')

      beforeEach ->
        execa("npm", ["-version"])
        .then R.prop("stdout")
        .then (version) ->
          npmVersion = version
          expect(npmVersion).to.be.a.string

      it "npm slurps up or not exit value on failure", (done) ->
        expectedCode = if isNpmSlurpingCode() then 1 else 10
        s = cp.exec("npm run dev -- --exit-with-code=10")
        s.on "close", (code) ->
          expect(code).to.eq(expectedCode)
          done()

      it "npm passes on 0 exit code", (done) ->
        s = cp.exec("npm run dev -- --exit-with-code=0")
        s.on "close", (code) ->
          expect(code).to.eq(0)
          done()
