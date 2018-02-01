_ = require("lodash")
path = require("path")
snapshot = require("snap-shot-it")
e2e = require("../support/helpers/e2e")
Fixtures = require("../support/helpers/fixtures")

e2ePath = Fixtures.projectPath("e2e")

outputPath = path.join(e2ePath, "output.json")

specs = [
  "simple_passing_spec.coffee"
  "simple_hooks_spec.coffee"
  "simple_failing_spec.coffee"
  "simple_failing_h*_spec.coffee" ## simple failing hook spec
].join(",")

describe "e2e spec_isolation", ->
  e2e.setup()

  it "failing", ->
    e2e.exec(@, {
      spec: specs
      outputPath: outputPath
      snapshot: false
      expectedExitCode: 5
    })
    .then ->
      ## now what we want to do is read in the outputPath
      ## and snapshot it so its what we expect after normalizing it
      fs.readJsonAsync(outputPath)
      .then (json) ->
        ## ensure that config has been set
        expect(json.config).to.be.an('object')
        expect(json.config.projectName).to.eq("e2e")
        expect(json.config.projectRoot).to.eq(e2ePath)

        ## but zero out config because it's too volatile
        json.config = {}

        ## ensure the totals are accurate
        expect(json.totalTests).to.eq(
          _.sum([
            json.totalFailures,
            json.totalPasses,
            json.totalPending,
            json.totalSkipped
          ])
        )

        snapshot(json)
