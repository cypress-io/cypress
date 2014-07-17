@App.module "Views", (Views, App, Backbone, Marionette, $, _) ->

  class Views.LayoutView extends Marionette.LayoutView

    regionRegex = /(.+)-region/

    getRegionsByEl: true

    render: ->
      super

      ## loop through the dom, finding all regions and pair them
      @_getRegionsByEl()

    _childNodes: ->
      @$el.find("*")

    _getRegionsByEl: ->
      return if not @getRegionsByEl or not @$el

      selectors = _.reduce @_childNodes(), (memo, e) ->
        match = regionRegex.exec $(e).prop("id")
        memo.push match[0] if match
        memo
      , []

      regions = _.reduce selectors, (memo, region) ->
        memo[_.camelize(region)] = "#" + region
        memo
      , {}

      @addRegions regions