e2e      = require("../support/helpers/e2e")
Fixtures = require("../support/helpers/fixtures")

e2ePath = Fixtures.projectPath("e2e")

normalize = (stdout) ->
  ## remove all of the dynamic parts of stdout
  ## to normalize against what we expected
  stdout
  .replace(/\(\d{1,5}m?s\)/g, "(123ms)")
  .replace(/\(\d{1,2}s\)/g, "(10s)")
  .replace(/coffee-\d{3}/g, "coffee-456")
  .replace(/\/.+\/cypress\/videos\/(.+)\.mp4/g, "/foo/bar/.projects/e2e/cypress/videos/abc123.mp4")
  .replace(/\/.+\/cypress\/screenshots/g, "/foo/bar/.projects/e2e/cypress/screenshots")
  .replace(/Cypress Version\: (.+)/, "Cypress Version: 1.2.3")
  .replace(/Duration\: (.+)/, "Duration:        10 seconds")
  .replace(/\(\d+ seconds?\)/, "(0 seconds)")
  .replace(/\r/g, "")
  .split(e2ePath)
  .join("/foo/bar/.projects/e2e")

## TODO: fix me request stdout is bonkers
describe.skip "e2e stdout", ->
  e2e.setup()

  it "displays errors from failures", ->
    e2e.exec(@, {
      port: 2020
      snapshot: true
      spec: "stdout_failing_spec.coffee"
      expectedExitCode: 3
    })

  it "displays errors from exiting early due to bundle errors", ->
    e2e.exec(@, {
      spec: "stdout_exit_early_failing_spec.coffee"
      snapshot: true
      expectedExitCode: 1
    })

  it "does not duplicate suites or tests between visits", ->
    e2e.exec(@, {
      spec: "stdout_passing_spec.coffee"
      timeout: 120000
      snapshot: true
      expectedExitCode: 0
    })
