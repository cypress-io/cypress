e2e      = require("../helpers/e2e")
Fixtures = require("../helpers/fixtures")
fs       = require("fs-extra")
path     = require("path")
Promise  = require("bluebird")

fs       = Promise.promisifyAll(fs)
e2ePath  = Fixtures.projectPath("e2e")

describe "e2e reporters", ->
  e2e.setup()

  it "supports junit reporter and reporter options", ->
    e2e.start(@, {
      spec: "simple_passing_spec.coffee"
      expectedExitCode: 0
      reporter: "junit"
      reporterOptions: "mochaFile=junit-output/result.xml"
    })
    .then ->
      fs.readFileAsync(path.join(e2ePath, "junit-output", "result.xml")).then (buffer) ->
        xml = buffer.toString()
        expect(xml).to.include("<testsuite name=\"simple passing spec\"")
        expect(xml).to.include("<testcase name=\"Root Suite simple passing spec passes\"")

  it "supports custom reporter", ->
    e2e.exec(@, {
      spec: "simple_passing_spec.coffee"
      expectedExitCode: 0
      reporter: "reporters/custom.js"
    })
    .get("stdout")
    .then (stdout) ->
      expect(stdout).to.include """
        passes
        finished!
      """
