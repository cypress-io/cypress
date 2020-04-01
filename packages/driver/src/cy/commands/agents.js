_ = require("lodash")
sinon = require("sinon")

Promise = require("bluebird")

$utils = require("../../cypress/utils")
$errUtils = require("../../cypress/error_utils")

counts = null

sinon.setFormatter($utils.stringifyArg.bind($utils))

createSandbox = ->
  sinon.createSandbox().usingPromise(Promise)

display = (name) ->
  switch name
    when "spy"  then "Spied Obj"
    when "stub" then "Stubbed Obj"

formatArgs = (args) ->
  _.map args, (arg) -> $utils.stringifyArg(arg)

getMessage = (method, args) ->
  method ?= "function"
  args = if args.length > 3
    formatArgs(args.slice(0, 3)).concat("...")
  else
    formatArgs(args)

  "#{method}(#{args.join(', ')})"

onInvoke = (Cypress, obj, args) ->
  agent = obj.agent
  agentName = agent._cyName

  ## bail if we've turned off logging this agent
  return if agent._log is false

  ## fakes are children of the agent created with `withArgs`
  fakes = agent.matchingFakes(args)

  agent._cyLog.set("callCount", agent.callCount)
  for fake in fakes
    fake._cyLog.set("callCount", fake.callCount)

  logProps = {
    name:     agentName
    message:  obj.message
    error:    obj.error
    type:     "parent"
    end:      true
    snapshot: true
    event:    true
    consoleProps: ->
      consoleObj = {}
      consoleObj.Command = null
      consoleObj.Error = null
      consoleObj.Event = "#{agentName} called"

      consoleObj[agent._cyType] = agent
      consoleObj["Call #"] = agent.callCount
      consoleObj.Alias = agent._cyAlias

      consoleObj[display(obj.name)] = obj.obj
      consoleObj.Arguments = obj.call.args
      consoleObj.Context = obj.call.thisValue
      consoleObj.Returned = obj.call.returnValue

      if obj.error
        consoleObj.Error = obj.error.stack

      for fake in fakes
        name = fake._cyName
        count = fake._cyCount
        consoleObj["Child #{fake._cyType} (#{count})"] = "---"
        consoleObj["  #{count} #{fake._cyType}"] = fake
        consoleObj["  #{count} call #"] = fake.callCount
        consoleObj["  #{count} alias"] = fake._cyAlias
        consoleObj["  #{count} matching arguments"] = fake.matchingArguments

      consoleObj
  }

  aliases = _.compact([agent._cyAlias].concat(_.map(fakes, "_cyAlias")))
  if aliases.length
    logProps.alias = aliases
    logProps.aliasType = "agent"

  Cypress.log(logProps)

onError = (err) ->
  $errUtils.throwErr(err)

## create a global sandbox
## to be used through all the tests
sandbox = createSandbox()

reset = ->
  counts = {
    spy: 0
    stub: 0
    children: {}
  }

  sandbox.restore()

  return null

module.exports = (Commands, Cypress, cy, state, config) ->
  ## reset initially on a new run because we could be
  ## re-running from the UI or from a spec file change
  reset()

  resetAndSetSandbox = ->
    reset()

    ## attach the sandbox to state
    state("sandbox", sandbox)

  ## before each of our tests we always want
  ## to reset the counts + the sandbox
  Cypress.on("test:before:run", resetAndSetSandbox)

  wrap = (ctx, type, agent, obj, method, count) ->
    if not count
      count = counts[type] += 1

    name = "#{type}-#{count}"
    if not agent.parent
      counts.children[name] = 0

    log = Cypress.log({
      instrument: "agent"
      name: name
      type: name
      functionName: method
      count: count
      callCount: 0
    })

    agent._cyCount = count
    agent._cyLog = log
    agent._cyName = name
    agent._cyType = type

    invoke = agent.invoke

    agent.invoke = (func, thisValue, args) ->
      error = null
      returned = null

      ## because our spy could potentially fail here
      ## we need to wrap this in a try / catch
      ## so we still emit the command that failed
      ## and the user can easily find the error
      try
        returned = invoke.call(@, func, thisValue, args)
      catch e
        error = e

      props = {
        count:     count
        name:      type
        message:   getMessage(method, args)
        obj:       obj
        agent:     agent
        call:      agent.lastCall
        callCount: agent.callCount
        error:     error
        log:       log
      }

      onInvoke(Cypress, props, args)

      ## if an error did exist then we need
      ## to bubble it up
      onError(error) if error

      ## make sure we return the invoked return value
      ## of the spy
      return returned

    ## enable not logging this agent
    agent.log = (bool = true) ->
      agent._log = bool

      return agent

    agent.as = (alias) ->
      cy.validateAlias(alias)
      cy.addAlias(ctx, {
        subject: agent
        command: log
        alias: alias
      })
      agent._cyAlias = alias
      log.set({
        alias: alias
        aliasType: "agent"
      })
      agent.named(alias)
      agent

    withArgs = agent.withArgs
    agent.withArgs = ->
      childCount = counts.children[name] += 1
      wrap(ctx, type, withArgs.apply(@, arguments), obj, method, "#{count}.#{childCount}")

    return agent

  spy = (obj, method) ->
    theSpy = sandbox.spy(obj, method)
    wrap(@, "spy", theSpy, obj, method)

  stub = (obj, method, replacerFnOrValue) ->
    theStub = sandbox.stub.call(sandbox, obj, method)

    ## sinon 2 changed the stub signature
    ## this maintains the 3-argument signature so it's not breaking
    if arguments.length is 3
      if _.isFunction(replacerFnOrValue)
        theStub = theStub.callsFake(replacerFnOrValue)
      else
        theStub = theStub.value(replacerFnOrValue)

    wrap(@, "stub", theStub, obj, method)

  Commands.addAllSync({
    spy: spy

    stub: stub

    agents: ->
      $errUtils.warnByPath("agents.deprecated_warning")

      return {stub, spy}
  })
