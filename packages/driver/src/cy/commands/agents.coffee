_ = require("lodash")
Promise = require("bluebird")
sinonAsPromised = require("sinon-as-promised")

$Cy = require("../../cypress/cy")
$Log = require("../../cypress/log")
utils = require("../../cypress/utils")

sinonAsPromised(Promise)

counts = null

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
  _.map args, (arg) -> utils.stringifyArg(arg)

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
      console = {}
      console.Command = null
      console.Error = null
      console.Event = "#{getName(obj)} called"

      if parent
        parentCount = obj.count.replace(/\.\d+$/, '')
        parentName = "#{obj.name}-#{parentCount}"
        name = getName(obj)
        console[parentName] = parent
        console["#{parentName} call #"] = parentCallCount
        if parent._cyAlias
          console["#{parentName} alias"] = parent._cyAlias
        console[name] = agent
        console["#{name} call #"] = callCount
        if alias
          console["#{name} alias"] = alias
        ## typo in sinon! will be fixed in 2.0
        console["#{name} matching arguments"] = agent.matchingAguments
      else
        console[obj.name] = agent
        console["Call #"] = callCount
        if alias
          console.Alias = alias

      console[display(obj.name)] = obj.obj
      console.Arguments = obj.call.args
      console.Context =   obj.call.thisValue
      console.Returned =  obj.call.returnValue
      if obj.error
        console.Error = obj.error.stack

      console
  }

  aliases = _.compact([agent.parent?._cyAlias, alias])
  if aliases.length
    logProps.alias = aliases
    logProps.aliasType = "agent"

  $Log.command(logProps)

onError = (err) ->
  utils.throwErr(err)

wrap = (_cy, type, agent, obj, method, count) ->
  if not count
    count = counts[type] += 1

  name = "#{type}-#{count}"
  if not agent.parent
    counts.children[name] = 0

  log = $Log.agent({
    name: name
    type: name
    functionName: method
    count: count
    callCount: 0
  })

  agent.invoke = _.wrap agent.invoke, (orig, func, thisValue, args) ->
    error = null
    returned = null

    ## because our spy could potentially fail here
    ## we need to wrap this in a try / catch
    ## so we still emit the command that failed
    ## and the user can easily find the error
    try
      returned = orig.call(@, func, thisValue, args)
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
    _cy._validateAlias(alias)
    _cy._addAlias({
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

  agent.withArgs = _.wrap agent.withArgs, (orig, args...) ->
    childCount = counts.children[name] += 1
    wrap(_cy, type, orig.apply(@, args), obj, method, "#{count}.#{childCount}")

  return agent

$Cy.extend({
  spy: (obj, method) ->
    spy = @_getSandbox().spy(obj, method)
    wrap(@, "spy", spy, obj, method)

  stub: (obj, method, replacerFn) ->
    stub = @_getSandbox().stub(obj, method, replacerFn)
    wrap(@, "stub", stub, obj, method)

  agents: ->
    utils.warning "cy.agents() is deprecated. Use cy.stub() and cy.spy() instead."

    {
      stub: @stub.bind(@)
      spy: @spy.bind(@)
    }
})

module.exports = (Cypress, Commands) ->
  do resetCounts = ->
    counts = {
      spy: 0
      stub: 0
      children: {}
    }

  Cypress.on "restore", resetCounts
