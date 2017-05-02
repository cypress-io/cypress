_ = require("lodash")

commands = [
  require("../cy/commands/actions/checkbox")
  require("../cy/commands/actions/clicking")
  require("../cy/commands/actions/focus")
  require("../cy/commands/actions/form")
  require("../cy/commands/actions/misc")
  require("../cy/commands/actions/scrolling")
  require("../cy/commands/actions/select")
  require("../cy/commands/actions/text")
  require("../cy/commands/agents")
  require("../cy/commands/aliasing")
  require("../cy/commands/angular")
  require("../cy/commands/assertions")
  require("../cy/commands/clock")
  require("../cy/commands/commands")
  require("../cy/commands/communications")
  require("../cy/commands/connectors")
  require("../cy/commands/cookies")
  require("../cy/commands/debugging")
  require("../cy/commands/exec")
  require("../cy/commands/files")
  require("../cy/commands/fixtures")
  require("../cy/commands/local_storage")
  require("../cy/commands/location")
  require("../cy/commands/misc")
  require("../cy/commands/navigation")
  require("../cy/commands/querying")
  require("../cy/commands/request")
  require("../cy/commands/sandbox")
  require("../cy/commands/screenshot")
  require("../cy/commands/traversals")
  require("../cy/commands/waiting")
  require("../cy/commands/window")
  require("../cy/commands/xhr2")
]

getTypeByPrevSubject = (prevSubject) ->
  switch prevSubject
    when true, "dom"
      "child"
    when "optional"
      "dual"
    else
      "parent"

module.exports = {
  create: (Cypress, cy) ->

    obj = {
      addAll: (options = {}, obj) ->
        if not obj
          obj = options
          options = {}

        _.each obj, (fn, key) =>
          @add(key, options, fn)

      add: (key, options, fn) ->
        if _.isFunction(options)
          fn = options
          options = {}

        type = getTypeByPrevSubject(options.prevSubject)

        ## should we enforce the prev subject be DOM?
        enforceDom = options.prevSubject is "dom"

        cy.onCommand(key, fn, type, enforceDom)

      addAssertion: (key, fn) ->
        cy.onCommand(key, fn, "assertion")

      addUtility: (key, fn) ->
        cy.onCommand(key, fn, "utility")

      overwrite: (key, fn) ->
        cy.onOverwrite(key, fn)
    }

    _.each commands, (command) ->
      command(Cypress, obj)

    return obj
}
