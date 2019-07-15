e2e = require("../support/helpers/e2e")

describe "e2e uncaught errors", ->
  e2e.setup()

  it "failing1", ->
    e2e.exec(@, {
      spec: "uncaught_synchronous_before_tests_parsed.coffee"
      snapshot: true
      expectedExitCode: 1
    })

  it "failing2", ->
    e2e.exec(@, {
      spec: "uncaught_synchronous_during_hook_spec.coffee"
      snapshot: true
      expectedExitCode: 1
    })

  it "failing3", ->
    e2e.exec(@, {
      spec: "uncaught_during_test_spec.coffee"
      snapshot: true
      expectedExitCode: 1
    })

  it "failing4", ->
    e2e.exec(@, {
      spec: "uncaught_during_hook_spec.coffee"
      snapshot: true
      expectedExitCode: 1
    })

  it "failing5", ->
    e2e.exec(@, {
      spec: "caught_async_sync_test_spec.coffee"
      snapshot: true
      expectedExitCode: 4
    })

  it "failing6", ->
    e2e.exec(@, {
      spec: "uncaught_missing_suite_callback.js"
      snapshot: true
      expectedExitCode: 1
    })

  it "failing7", ->
    e2e.exec(@, {
      spec: "uncaught_missing_suite_callback_empty_suite.js"
      snapshot: true
      expectedExitCode: 1
    })

  it "failing8", ->
    e2e.exec(@, {
      spec: "uncaught_missing_suite_callback_empty_suite.js"
      snapshot: true
      expectedExitCode: 1
    })

  it "failing9", ->
    e2e.exec(@, {
      spec: "uncaught_missing_suite_callback_type_error.js"
      snapshot: true
      expectedExitCode: 1
    })