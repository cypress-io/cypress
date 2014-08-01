@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Config extends Entities.Model
    defaults: ->
      ## look at LS or false by default
      collapsed: @getConfig "collapsed", default: false, type: "boolean"

    toggleCollapse: ->
      @setConfig "collapsed", !@get("collapsed")

    setConfig: (attr, value, options = {}) ->
      ## set the value on ourselves
      @set attr, value, options

      ## also set this in LS
      localStorage.setItem attr, value

    ## returns the item in LS or uses the default
    getConfig: (attr, options = {}) ->
      item = localStorage.getItem(attr) or options.default

      ## attempt type cooercion if type was given
      switch options.type
        when "boolean" then _.toBoolean(item)
        else item

  App.reqres.setHandler "new:config:entity", (attrs = {}) ->
    new Entities.Config attrs
