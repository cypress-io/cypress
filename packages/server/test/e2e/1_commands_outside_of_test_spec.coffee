e2e = require("../support/helpers/e2e")
_ = require('lodash')

## FIREFOX FIXME: errors slightly different and stack trace lines not replaced in snapshot
describe "e2e commands outside of test", ->
  e2e.setup()

  _.each [
    'chrome',
    'electron'
  ], (browser) ->

    it "[#{browser}] fails on cy commands", ->
      ## TODO: remove this after electron upgrade
      if browser is 'electron'
        console.log('⚠️ skipping test in electron due to chromium 63 bug with sourceMaps')
        ## this.skip() will not work here since it skips the afterEach
        return

      e2e.exec(@, {
        spec: "commands_outside_of_test_spec.coffee"
        snapshot: true
        expectedExitCode: 1
        browser
      })

    it "[#{browser}] fails on failing assertions", ->
      ## TODO: remove this after electron upgrade
      if browser is 'electron'
        console.log('⚠️ skipping test in electron due to chromium 63 bug with sourceMaps')
        ## this.skip() will not work here since it skips the afterEach
        return

      e2e.exec(@, {
        spec: "assertions_failing_outside_of_test_spec.coffee"
        snapshot: true
        expectedExitCode: 1
        browser
      })

  it "passes on passing assertions", ->
    e2e.exec(@, {
      spec: "assertions_passing_outside_of_test_spec.coffee"
      snapshot: true
      expectedExitCode: 0
    })
