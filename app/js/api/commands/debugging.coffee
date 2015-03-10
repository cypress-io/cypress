do (Cypress, _) ->

  Cypress.addDualCommand
    inspect: ->
      ## bug fix due to 3rd party libs like
      ## chai using inspect function for
      ## special display
      # return "" if not @prop

      @prop("inspect", true)
      return null

    debug: ->
      console.log "\n%c------------------------Cypress Command Info------------------------", "font-weight: bold;"
      _.each ["options", "runnable", "subject"], (item) =>
        console.log "#{item}: ", (@prop(item) or @[item])
      debugger

  Cypress.extend
    log: (obj, type) ->
      return if not @prop("inspect")

      color = {
        success: "#46B848"
        info:    "#5FC0DD"
        warning: "#D99538"
        danger:  "#D7514F"
      }[type] or "blue"

      if _.isString(obj)
        obj = {name: obj, args: ""}

      console.log "%c#{obj.name}", "color: #{color}", _.truncate(obj.args, 75)