_     = require("lodash")
Mocha = require("mocha")
chalk = require("chalk")

createRunnable = (obj) ->
  ## recursively create parent suites
  runnable = new Mocha.Runnable(obj.title, ->)
  runnable.ignoreLeaks = true
  runnable.timedOut = obj.timedOut
  runnable.async    = obj.async
  runnable.sync     = obj.sync
  runnable.duration = obj.duration
  runnable.state    = obj.state

  return [runnable]

createSuite = (suite) ->
  ## recursively create parent suites

createErr = (test, err) ->
  [createRunnable(test), err]

events = {
  "start":     true
  "end":       true
  "suite":     true
  "suite:end": true
  "test":      createRunnable
  "test end":  createRunnable
  "hook":      createRunnable
  "hook end":  createRunnable
  "pass":      createRunnable
  "pending":   createRunnable
  "fail":      createErr
  # "run:start"   : {name: "start" }
  # "run:end"     : {name: "end" }
  # "suite:start" : {name: "suite" }
  # "suite:end"   : {name: "suite end" }
  # "test:end"    : {name: "test end", fn: createTest }
  # "pending"     : {name: "pending", fn: createTest }
  # "pass"        : {name: "pass", fn: createTest }
  # "fail"        : {name: "fail", fn: createErr }
}

class Reporter
  constructor: (options = {}) ->
    if not (@ instanceof Reporter)
      return new Reporter(options)

    @mocha    = new Mocha({reporter: "spec"})
    @runner   = new Mocha.Runner(@mocha.suite)
    @reporter = new @mocha._reporter(@runner, {})

    return @

  emit: (event, args...) ->
    ## make sure this event is in our events hash
    if e = events[event]

      if _.isFunction(e)
        ## transform the arguments if
        ## there is an event.fn callback
        args = e.apply(@, args)

      args = [event].concat(args)

      @runner.emit.apply(@runner, args)

module.exports = Reporter