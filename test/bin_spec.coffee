cp  = require("child_process")
pkg = require("../package.json")

describe "bin/cypress", ->
  it "is executable", (done) ->
    cp.exec "bin/cypress --version", (err, stdout, stderr) ->
      expect(stdout).to.eq(pkg.version + "\n")
      done()

  it "is set in package.json", ->
    expect(pkg.bin).to.deep.eq({cypress: "bin/cypress"})