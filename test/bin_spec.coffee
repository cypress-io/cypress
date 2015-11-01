cp  = require("child_process")
pkg = require("../package.json")

describe "bin/cypress", ->
  it "is executable", (done) ->
    cp.exec "cypress --version", (err, stdout, stderr) ->
      expect(stdout).to.eq(pkg.version + "\n")
      done()