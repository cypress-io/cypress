_ = require("lodash")
$utils = require("./utils")

builtInCommands = [
  require("../cy/commands/actions/checkbox")
  require("../cy/commands/actions/clicking")
  require("../cy/commands/actions/focus")
  require("../cy/commands/actions/form")
  require("../cy/commands/actions/hover")
  require("../cy/commands/actions/scrolling")
  require("../cy/commands/actions/select")
  require("../cy/commands/actions/text")
  require("../cy/commands/actions/trigger")
  require("../cy/commands/agents")
  require("../cy/commands/aliasing")
  require("../cy/commands/angular")
  require("../cy/commands/asserting")
  require("../cy/commands/clock")
  require("../cy/commands/commands")
  require("../cy/commands/connectors")
  require("../cy/commands/cookies")
  require("../cy/commands/debugging")
  require("../cy/commands/exec")
  require("../cy/commands/files")
  require("../cy/commands/fixtures")
  require("../cy/commands/local_storage")
  require("../cy/commands/location")
  require("../cy/commands/misc")
  require("../cy/commands/popups")
  require("../cy/commands/navigation")
  require("../cy/commands/querying")
  require("../cy/commands/request")
  require("../cy/commands/screenshot")
  require("../cy/commands/traversals")
  require("../cy/commands/waiting")
  require("../cy/commands/window")
  require("../cy/commands/xhr")
]

getTypeByPrevSubject = (prevSubject) ->
  switch prevSubject
    when true, "dom"
      "child"
    when "optional"
      "dual"
    else
      "parent"

create = (Cypress, cy, state, config, log) ->
  ## create a single instance
  ## of commands
  commands = {}
  commandBackups = {}

  store = (obj) ->
    commands[obj.name] = obj

    cy.addCommand(obj)

  storeOverride = (name, fn) ->
    ## grab the original function if its been backed up
    ## or grab it from the command store
    original = commandBackups[name] or commands[name]

    if not original
      $utils.throwErrByPath("miscellaneous.invalid_overwrite", {
        args: {
          name: name
        }
      })

    ## store the backup again now
    commandBackups[name] = original

    originalFn = original.fn

    overridden = _.clone(original)
    overridden.fn = (args...) ->
      args = [].concat(originalFn, args)
      fn.apply(@, args)

    cy.addCommand(overridden)

  Commands = {
    _commands: commands ## for testing

    each: (fn) ->
      ## perf loop
      for name, command of commands
        fn(command)

      ## prevent loop comprehension
      null

    addAllSync: (obj) ->
      ## perf loop
      for name, fn of obj
        Commands.addSync(name, fn)

      ## prevent loop comprehension
      null

    addSync: (name, fn) ->
      cy.addCommandSync(name, fn)

    addAll: (options = {}, obj) ->
      if not obj
        obj = options
        options = {}

      ## perf loop
      for name, fn of obj
        Commands.add(name, options, fn)

      ## prevent loop comprehension
      null

    add: (name, options, fn) ->
      if _.isFunction(options)
        fn = options
        options = {}

      type = getTypeByPrevSubject(options.prevSubject)

      ## should we enforce the prev subject be DOM?
      enforceDom = options.prevSubject is "dom"

      store({
        name
        fn
        type
        enforceDom
      })

    addChainer: (obj) ->
      ## perp loop
      for name, fn of obj
        cy.addChainer(name, fn)

      ## prevent loop comprehension
      null

    addAssertion: (obj) ->
      ## perf loop
      for name, fn of obj
        store({
          name
          fn,
          type: "assertion"
        })

      ## prevent loop comprehension
      null

    addUtility: (obj) ->
      ## perf loop
      for name, fn of obj
        store({
          name
          fn,
          type: "utility"
        })

      ## prevent loop comprehension
      null

    overwrite: (name, fn) ->
      storeOverride(name, fn)
  }

  ## perf loop
  for cmd in builtInCommands
    cmd(Commands, Cypress, cy, state, config, log)

  return Commands

module.exports = {
  create
}
