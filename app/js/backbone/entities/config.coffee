@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  ECL_ATTRIBUTE = "ecl-"

  class Entities.Config extends Entities.Model
    defaults: ->
      collapsed:  @getConfig("collapsed")
      panels:     @getConfig("panels")
      panelWidth: @getConfig("panelWidth")

    storageConfig:
      collapsed:
        default: true
        type: "boolean"
      panels:
        default: {}
        type: "object"
      panelWidth:
        default: 300
        type: "number"

    testProp: (prop, stringOrRegExp) ->
      switch
        when _.isString(stringOrRegExp) then stringOrRegExp is prop
        when _.isRegExp(stringOrRegExp) then stringOrRegExp.test(prop)
        else prop

    env: (stringOrRegExp) ->
      @testProp @get("env"), stringOrRegExp

    ui: (stringOrRegExp) ->
      @testProp @get("ui"), stringOrRegExp

    setEnv: (env) ->
      @set "env", env

    setUI: (ui) ->
      @set "ui", ui

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
      localStorage.setItem ECL_ATTRIBUTE + attr, JSON.stringify(value)

      ## set the value on ourselves
      super

    ## returns the item in LS or uses the default
    getConfig: (attr, options = {}) ->
      _.defaults options, @storageConfig[attr] or {}

      item = localStorage.getItem(ECL_ATTRIBUTE + attr) or options.default

      ## attempt type cooercion if type was given
      switch options.type
        when "boolean" then _.toBoolean(item)
        when "number" then _.toNumber(item)
        when "object"
          if _.isString(item) then JSON.parse(item) else item
        else item

    getPathToSpec: (id) ->
      _.compact([@get("testFolder"), id]).join("/")

    setRemoteOrigin: (current, remote) ->
      location = Cypress.location(current, remote)
      @set "remoteOrigin", location.origin

    ## returns a function bound to this model
    ## which acts as a getter
    getExternalInterface: ->
      get = (attr) ->
        @get(attr)

      _.bind(get, @)

    revertDom: (command, init = true) ->
      return @trigger "restore:dom" if not init

      return if not command.hasSnapshot()

      @trigger "revert:dom", command.getSnapshot(),
        id:   command.cid
        el:   command.getEl()
        attr: command.get("highlightAttr")

    highlightEl: (command, init = true) ->
      @trigger "highlight:el", command.getEl(),
        id: command.cid
        init: init

  App.reqres.setHandler "new:config:entity", (attrs = {}) ->
    new Entities.Config attrs
