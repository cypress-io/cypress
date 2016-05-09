require("../spec_helper")

_  = require("lodash")
cp = require("child_process")
pr = require("../helpers/process")

anyLineWithCaret = (str) ->
  str[0] is ">"

parse = (str) ->
  ## remove blank lines and slice off any line
  ## starting with a caret because thats junk
  ## from npm logs
  _(str.split("\n")).compact().reject(anyLineWithCaret).value().join("\n")

describe "CLI Interface", ->
  beforeEach ->
    ## set the timeout high due to
    ## spawning child processes
    @currentTest.timeout(20000)

  it "writes out ping value and exits", (done) ->
    cp.exec "npm start -- --smoke-test --ping=12345", (err, stdout, stderr) ->
      done(err) if err

      expect(parse(stdout)).to.eq("12345")
      done()

  it "writes out package.json and exits", (done) ->
    cp.exec "npm start -- --return-pkg", (err, stdout, stderr) ->
      done(err) if err

      pkg = JSON.parse(parse(stdout))
      expect(pkg.name).to.eq("cypress")
      expect(pkg.productName).to.eq("Cypress")
      done()