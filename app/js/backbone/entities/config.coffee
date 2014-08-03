@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Config extends Entities.Model
    defaults: ->
      collapsed: @getConfig "collapsed", default: false, type: "boolean"
      panels: @getConfig "panels", default: {}, type: "object"
      panelWidth: @getConfig "panelWidth", default: 300, type: "number"

    toggleCollapse: ->
      @set "collapsed", !@get("collapsed")

    togglePanel: (panel, bool) ->
      obj = {}
      obj[panel.get("name")] = bool
      @set "panels", obj, type: "object"

    anyPanelOpen: ->
      ## are any of the panels open?
      _.any _.values @get("panels")

    calculatePanelHeight: ->
      num = _.reduce @get("panels"), (memo, value, key) ->
        memo += 1 if value
        memo
      , 0

      (100 / num).toFixed(2)

    ## this also needs to do a .save to the server (or use websockets)
    set: (attr, value, options = {}) ->
      ## get a reference to any existing value
      existing = @getConfig(attr, options)

      ## if this is an object we need to merge into existing value
      value = _.extend existing, value if options.type is "object"

      ## also set this in LS
      localStorage.setItem attr, JSON.stringify(value)

      ## set the value on ourselves
      super

    ## returns the item in LS or uses the default
    getConfig: (attr, options = {}) ->
      item = localStorage.getItem(attr) or options.default

      ## attempt type cooercion if type was given
      switch options.type
        when "boolean" then _.toBoolean(item)
        when "number" then _.toNumber(item)
        when "object" then JSON.parse(item)
        else item

  App.reqres.setHandler "new:config:entity", (attrs = {}) ->
    new Entities.Config attrs
