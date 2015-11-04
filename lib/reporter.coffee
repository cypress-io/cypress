_     = require("lodash")
Mocha = require("mocha")
chalk = require("chalk")

createTest = (test) ->
  ## recursively create parent suites
  runnable = new Mocha.Runnable(test.title, ->)
  runnable.ignoreLeaks = true
  runnable.timedOut = test.timedOut
  runnable.async    = test.async
  runnable.sync     = test.sync
  runnable.duration = test.duration
  runnable.state    = test.state

  return [runnable]

createSuite = (suite) ->
  ## recursively create parent suites

createErr = (test, err) ->
  [createTest(test), err]

events = {
  "run:start"   : {name: "start" }
  "run:end"     : {name: "end" }
  "suite:start" : {name: "suite" }
  "suite:end"   : {name: "suite end" }
  "test:end"    : {name: "test end", fn: createTest }
  "pending"     : {name: "pending", fn: createTest }
  "pass"        : {name: "pass", fn: createTest }
  "fail"        : {name: "fail", fn: createErr }
}

getEvent = (event) ->
  events[event] #? console.warn(chalk.red("Event not found for: #{event}"))

class Reporter
  constructor: (app, options = {}) ->
    if not (@ instanceof Reporter)
      return new Reporter(app, options)

    if not app
      throw new Error("Instantiating lib/reporter requires an app!")

    @mocha    = new Mocha({reporter: "xunit"})
    @runner   = new Mocha.Runner(@mocha.suite)
    @reporter = new @mocha._reporter(@runner, {})

  emit: (event, args = []) ->
    if event = getEvent(event)

      if event.fn
        ## transform the arguments if
        ## there is an event.fn callback
        args = event.fn.apply(@, args)

      args = [event.name].concat(args)

      @runner.emit.apply(@runner, args)

module.exports = Reporter