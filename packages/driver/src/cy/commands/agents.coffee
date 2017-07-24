_ = require("lodash")
sinon = require("sinon")
Promise = require("bluebird")
sinonAsPromised = require("sinon-as-promised")

$Log = require("../../cypress/log")
$utils = require("../../cypress/utils")
$sinon = require("../../cypress/sinon")

sinonAsPromised(Promise)
$sinon.override(sinon)

counts = null

createSandbox = ->
  sinon.sandbox.create()

display = (name) ->
  switch name
    when "spy"  then "Spied Obj"
    when "stub" then "Stubbed Obj"

hasMatchingFake = (agent, args) ->
  _.some agent.fakes, (fake) ->
    fake.matches(args)

getName = (obj) ->
  "#{obj.name}-#{obj.count}"

formatArgs = (args) ->
  _.map args, (arg) -> $utils.stringifyArg(arg)

getMessage = (method, args) ->
  method ?= "function"
  args = if args.length > 3
    formatArgs(args.slice(0, 3)).concat("...")
  else
    formatArgs(args)

  "#{method}(#{args.join(', ')})"

onInvoke = (obj, args) ->
  if log = obj.log
    ## increment the callCount on the agent instrument log
    log.set "callCount", log.get("callCount") + 1
    alias = log.get("alias")

  agent = obj.agent

  if agent.fakes?.length and hasMatchingFake(agent, args)
    ## this is a parent fake and there is a matching child,
    ## let them log instead so there isn't a duplicate
    return

  callCount = agent.callCount

  if parent = agent.parent
    parentCallCount = parent.callCount

  logProps = {
    name:     getName(obj)
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
      consoleObj.Event = "#{getName(obj)} called"

      if parent
        parentCount = obj.count.replace(/\.\d+$/, '')
        parentName = "#{obj.name}-#{parentCount}"
        name = getName(obj)
        consoleObj[parentName] = parent
        consoleObj["#{parentName} call #"] = parentCallCount
        if parent._cyAlias
          consoleObj["#{parentName} alias"] = parent._cyAlias
        consoleObj[name] = agent
        consoleObj["#{name} call #"] = callCount
        if alias
          consoleObj["#{name} alias"] = alias
        ## typo in sinon! will be fixed in 2.0
        consoleObj["#{name} matching arguments"] = agent.matchingAguments
      else
        consoleObj[obj.name] = agent
        consoleObj["Call #"] = callCount
        if alias
          consoleObj.Alias = alias

      consoleObj[display(obj.name)] = obj.obj
      consoleObj.Arguments = obj.call.args
      consoleObj.Context =   obj.call.thisValue
      consoleObj.Yielded =  obj.call.returnValue
      if obj.error
        consoleObj.Error = obj.error.stack

      consoleObj
  }

  aliases = _.compact([agent.parent?._cyAlias, alias])
  if aliases.length
    logProps.alias = aliases
    logProps.aliasType = "agent"

  Cypress.log(logProps)

onError = (err) ->
  $utils.throwErr(err)

wrap = (Cypress, cy, type, agent, obj, method, count) ->
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

    props =
      count:     count
      name:      type
      message:   getMessage(method, args)
      obj:       obj
      agent:     agent
      call:      agent.lastCall
      callCount: agent.callCount
      error:     error
      log:       log

    onInvoke(props, args)

    ## if an error did exist then we need
    ## to bubble it up
    onError(error) if error

    ## make sure we return the invoked return value
    ## of the spy
    return returned

  agent.as = (alias) ->
    cy.validateAlias(alias)
    cy.addAlias({
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

  withArgs = agent.withArgs

  agent.withArgs = ->
    childCount = counts.children[name] += 1
    wrap(Cypress, cy, type, withArgs.apply(@, arguments), obj, method, "#{count}.#{childCount}")

  return agent

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
  Cypress.on("test:before:run:async", resetAndSetSandbox)

  Commands.addAllSync({
    spy: (obj, method) ->
      spy = sandbox.spy(obj, method)
      wrap(Cypress, cy, "spy", spy, obj, method)

    stub: (obj, method, replacerFn) ->
      stub = sandbox.stub(obj, method, replacerFn)
      wrap(Cypress, cy, "stub", stub, obj, method)

    agents: ->
      $utils.warning "cy.agents() is deprecated. Use cy.stub() and cy.spy() instead."

      {
        stub: @stub
        spy: @spy
      }
  })
