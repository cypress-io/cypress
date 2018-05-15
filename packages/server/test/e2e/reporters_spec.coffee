path     = require("path")
Promise  = require("bluebird")
cp       = require("child_process")
fs       = require("../../lib/util/fs")
e2e      = require("../support/helpers/e2e")
Fixtures = require("../support/helpers/fixtures")

e2ePath  = Fixtures.projectPath("e2e")

mochaAwesomes = [
  "mochawesome@1.5.2"
  "mochawesome@2.3.1"
  "mochawesome@3.0.1"
]

describe "e2e reporters", ->
  e2e.setup({
    npmInstall: mochaAwesomes
  })

  it "reports error if cannot load reporter", ->
    e2e.exec(@, {
      spec: "simple_passing_spec.coffee"
      snapshot: true
      expectedExitCode: 1
      reporter: "module-does-not-exist"
    })

  ## https://github.com/cypress-io/cypress/issues/1192
  it "reports error when thrown from reporter", ->
    e2e.exec(@, {
      spec: "simple_passing_spec.coffee"
      snapshot: true
      expectedExitCode: 1
      reporter: "reporters/throws.js"
    })

  it "supports junit reporter and reporter options", ->
    e2e.exec(@, {
      spec: "simple_passing_spec.coffee"
      expectedExitCode: 0
      snapshot: true
      reporter: "junit"
      reporterOptions: "mochaFile=junit-output/result.xml"
    })
    .then ->
      fs.readFileAsync(path.join(e2ePath, "junit-output", "result.xml"), "utf8")
      .then (str) ->
        expect(str).to.include("<testsuite name=\"simple passing spec\"")
        expect(str).to.include("<testcase name=\"simple passing spec passes\"")

  it "supports local custom reporter", ->
    e2e.exec(@, {
      spec: "simple_passing_spec.coffee"
      snapshot: true
      expectedExitCode: 0
      reporter: "reporters/custom.js"
    })

  describe "mochawesome", ->
    mochaAwesomes.forEach (ma) ->
      it "passes with #{ma} npm custom reporter", ->
        e2e.exec(@, {
          spec: "simple_passing_spec.coffee"
          snapshot: true
          expectedExitCode: 0
          reporter: ma
        })
        .then ->
          if ma is "mochawesome@1.5.2"
            fs.readFileAsync(path.join(e2ePath, "mochawesome-reports", "mochawesome.html"), "utf8")
            .then (xml) ->
              expect(xml).to.include("<h3 class=\"suite-title\">simple passing spec</h3>")
              expect(xml).to.include("<div class=\"status-item status-item-passing-pct success\">100% Passing</div>")
          else
            fs.readJsonAsync(path.join(e2ePath, "mochawesome-report", "mochawesome.json"))
            .then (json) ->
              expect(json.stats).to.be.an('object')
              expect(json.stats.passes).to.eq(1)

      it "fails with #{ma} npm custom reporter", ->
        e2e.exec(@, {
          spec: "simple_failing_hook_spec.coffee"
          snapshot: true
          expectedExitCode: 3
          reporter: ma
        })
        .then ->
          if ma is "mochawesome@1.5.2"
            fs.readFileAsync(path.join(e2ePath, "mochawesome-reports", "mochawesome.html"), "utf8")
            .then (xml) ->
              expect(xml).to.include("<h3 class=\"suite-title\">simple failing hook spec</h3>")
              expect(xml).to.include("<div class=\"status-item status-item-hooks danger\">3 Failed Hooks</div>")
          else
            fs.readJsonAsync(path.join(e2ePath, "mochawesome-report", "mochawesome.json"))
            .then (json) ->
              ## mochawesome does not consider hooks to be
              ## 'failures' but it does collect them in 'other'
              expect(json.stats).to.be.an('object')
              expect(json.stats.failures).to.eq(0)
              expect(json.stats.other).to.eq(3)
