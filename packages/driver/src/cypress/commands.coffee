_ = require("lodash")

$errUtils = require("./error_utils")

builtInCommands = [
  require("../cy/commands/actions/check")
  require("../cy/commands/actions/click")
  require("../cy/commands/actions/focus")
  require("../cy/commands/actions/hover")
  require("../cy/commands/actions/scroll")
  require("../cy/commands/actions/select")
  require("../cy/commands/actions/submit")
  require("../cy/commands/actions/trigger")
  require("../cy/commands/actions/type")
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
  require("../cy/commands/task")
  require("../cy/commands/traversals")
  require("../cy/commands/waiting")
  require("../cy/commands/window")
  require("../cy/commands/xhr")
]

getTypeByPrevSubject = (prevSubject) ->
  switch
    when prevSubject is "optional"
      "dual"
    when !!prevSubject
      "child"
    else
      "parent"

create = (Cypress, cy, state, config) ->
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
      $errUtils.throwErrByPath("miscellaneous.invalid_overwrite", {
        args: {
          name: name
        }
      })

    ## store the backup again now
    commandBackups[name] = original

    originalFn = (args...) ->
      current = state("current")
      storedArgs = args
      if current.get("type") is "child"
        storedArgs = args.slice(1)
      current.set("args", storedArgs)
      original.fn(args...)

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

      { prevSubject } = options

      ## normalize type by how they validate their
      ## previous subject (unless they're explicitly set)
      type = options.type ?= getTypeByPrevSubject(prevSubject)

      store({
        name
        fn
        type
        prevSubject
      })

    addChainer: (obj) ->
      ## perp loop
      for name, fn of obj
        cy.addChainer(name, fn)

      ## prevent loop comprehension
      null

    overwrite: (name, fn) ->
      storeOverride(name, fn)
  }

  ## perf loop
  for cmd in builtInCommands
    cmd(Commands, Cypress, cy, state, config)

  return Commands

module.exports = {
  create
}
