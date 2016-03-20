cp  = require("child_process")
pkg = require("../package.json")

describe "bin/cypress", ->
  it "displays help text", (done) ->
    cp.exec "bin/cypress", (err, stdout, stderr) ->
      expect(stdout).to.include("-v, --version  output the version of the cli and desktop app")
      done()

  it "is set in package.json", ->
    expect(pkg.bin).to.deep.eq({cypress: "bin/cypress"})