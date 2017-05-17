_ = require("lodash")
api = require("./api")

events = [
  "start"
  "hook"
  "hook end"
  "suite"
  "suite end"
  "test"
  "test end"
  "pass"
  "fail"
  "pending"
  "waiting"
  "end"
]

testInfo = (test)->
  return test if not test

  _.extend(_.pick(test, "root", "title", "speed", "duration"), {
    parentTitle: test.parent?.fullTitle()
  })

errInfo = (err)->
  return err if not err

  _.pick(err, "message", "stack", "actual", "expected", "showDiff")

report = (event, test, err) ->
  api.report({
    tests: [{
      event: event
      info: testInfo(test)
      err: errInfo(err)
    }]
  })

module.exports = (runner) ->
  for event in events
    runner.on(event, _.partial(report, event))
