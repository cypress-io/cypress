@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Config extends Entities.Model
    defaults: ->
      collapsed: @getConfig "collapsed", default: false, type: "boolean"
      panels: @getConfig "panels", default: {}, type: "object"

    toggleCollapse: ->
      @setConfig "collapsed", !@get("collapsed")

    togglePanel: (panel, bool) ->
      obj = {}
      obj[panel.get("name")] = bool
      @setConfig "panels", obj, type: "object"

    ## this also needs to do a .save to the server (or use websockets)
    setConfig: (attr, value, options = {}) ->
      ## get a reference to any existing value
      existing = @getConfig(attr, options)

      ## if this is an object we need to merge into existing value
      value = _.extend existing, value if options.type is "object"

      ## set the value on ourselves
      @set attr, value, options

      ## also set this in LS
      localStorage.setItem attr, JSON.stringify(value)

    ## returns the item in LS or uses the default
    getConfig: (attr, options = {}) ->
      item = localStorage.getItem(attr) or options.default

      ## attempt type cooercion if type was given
      switch options.type
        when "boolean" then _.toBoolean(item)
        when "object" then JSON.parse(item)
        else item

  App.reqres.setHandler "new:config:entity", (attrs = {}) ->
    new Entities.Config attrs
