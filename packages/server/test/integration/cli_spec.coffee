require("../spec_helper")

_   = require("lodash")
cp  = require("child_process")
pr  = require("../support/helpers/process")
pkg = require("@packages/root")

anyLineWithCaret = (str) ->
  str[0] is ">"

parse = (str) ->
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
    cp.exec "npm start -- --smoke-test --ping=12345", {env: env}, (err, stdout, stderr) ->
      done(err) if err

      expect(parse(stdout)).to.eq("12345")
      done()

  it "writes out package.json and exits", (done) ->
    cp.exec "npm start -- --return-pkg", {env: env}, (err, stdout, stderr) ->
      done(err) if err

      pkg = JSON.parse(parse(stdout))
      expect(pkg.name).to.eq("@packages/server")
      expect(pkg.productName).to.eq("Cypress", stdout)
      done()

  ## this tests that our exit codes are correct.
  ## there was a bug at one point where we incorrectly
  ## spawned child electron processes and did not bubble
  ## up their exit codes to the calling process. this
  ## caused false-positives in CI because tests were failing
  ## but the exit code was always zero
  context "exit codes", ->
    beforeEach ->
      ## run the start script directly
      ## instead of going through npm wrapper
      @start = pkg.scripts.start

    it "exits with code 22", (done) ->
      s = cp.exec("#{@start} --exit-with-code=22")
      s.on "close", (code) ->
        expect(code).to.eq(22)
        done()

    it "exits with code 0", (done) ->
      s = cp.exec("#{@start} --exit-with-code=0")
      s.on "close", (code) ->
        expect(code).to.eq(0)
        done()

    it "npm slurps up exit value and exits with 1 on failure", (done) ->
      s = cp.exec("npm start -- --exit-with-code=10")
      s.on "close", (code) ->
        expect(code).to.eq(1)
        done()

    it "npm passes on 0 exit code", (done) ->
      s = cp.exec("npm start -- --exit-with-code=0")
      s.on "close", (code) ->
        expect(code).to.eq(0)
        done()
