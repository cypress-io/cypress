@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  API =
    getElementBoxModelLayers: (el, body) ->
      ## use our own body if one isnt explicitly passed in
      body ?= $("body")

      dimensions = @getElementDimensions(el)

      container = $("<div>")

      ## create the margin / bottom / padding layers
      _.each ["Margin", "Border", "Padding"], (attr) =>

        obj =
          width: @getDimensionsFor(dimensions, attr, "width")
          height: @getDimensionsFor(dimensions, attr, "height")
          top: dimensions.offset.top
          left: dimensions.offset.left

        ## if attr is margin then we need to additional
        ## subtract what the actual marginTop + marginLeft
        ## values are, since offset disregards margin completely
        if attr is "Margin"
          obj.top -= dimensions.marginTop
          obj.left -= dimensions.marginLeft

        @createLayer el, container, obj

      ## finally create the actual "height" (content)
      ## layer and rearrange its offset so its inside
      ## of our border + padding
      @createLayer el, container, {
        width: dimensions.width
        height: dimensions.height
        top: (dimensions.offset.top + dimensions.borderTop + dimensions.paddingTop)
        left: (dimensions.offset.left + dimensions.borderLeft + dimensions.paddingLeft)
      }

      container.appendTo(body)

      return container

    createLayer: (el, container, dimensions) ->
      $("<div>")
        .css
          width: dimensions.width
          height: dimensions.height
          top: dimensions.top
          left: dimensions.left
          position: "absolute"
          zIndex: @getZIndex(el)
          backgroundColor: "#F9CC9D"
          opacity: 0.8
        .appendTo(container)

    getDimensionsFor: (dimensions, attr, dimension) ->
      dimensions[dimension + "With" + attr]

    getZIndex: (el) ->
      if /^(auto|0)$/.test el.css("zIndex") then 2147483647 else _.toNumber el.css("zIndex")

    getElementDimensions: (el) ->
      ## create dynamic attr method to create a closure
      ## around el
      @attr = (attr) ->
        ## nuke anything thats not a number
        num = el.css(attr).replace /[^0-9]+/, ""

        throw new Error("Element attr did not return a valid number") if not _.isFinite(num)

        _(num).toNumber()

      dimensions = {
        offset: el.offset() ## offset disregards margin but takes into account border + padding
        height: @getHeight(el)
        width: @getWidth(el)
        paddingTop: @getPadding(el, "top")
        paddingRight: @getPadding(el, "right")
        paddingBottom: @getPadding(el, "bottom")
        paddingLeft: @getPadding(el, "left")
        borderTop: @getBorder(el, "top")
        borderRight: @getBorder(el, "right")
        borderBottom: @getBorder(el, "bottom")
        borderLeft: @getBorder(el, "left")
        marginTop: @getMargin(el, "top")
        marginRight: @getMargin(el, "right")
        marginBottom: @getMargin(el, "bottom")
        marginLeft: @getMargin(el, "left")
      }

      ## push dimensions object into this fn
      getCalcFor = _(@getCalcFor).bind(API, dimensions)

      getCalcFor("heightWithPadding", "padding", "height")
      getCalcFor("heightWithBorder", "border", "height")
      getCalcFor("heightWithMargin", "margin", "height")

      getCalcFor("widthWithPadding", "padding", "width")
      getCalcFor("widthWithBorder", "border", "width")
      getCalcFor("widthWithMargin", "margin", "width")

      return dimensions

    getHeight: (el) ->
      @attr "height"

    getWidth: (el) ->
      @attr "width"

    getPadding: (el, dir) ->
      @attr "padding-#{dir}"

    getBorder: (el, dir) ->
      @attr "border-#{dir}-width"

    getMargin: (el, dir) ->
      @attr "margin-#{dir}"

    getCalcFor: (obj, prop, attr, dimension) ->
      obj[prop] = @getTotalFor(obj, attr, dimension)

    getTotalFor: (obj, attr, dimension) ->
      _.reduce ["Top", "Right", "Bottom", "Left"], (memo, direction) ->
        memo += obj[attr + direction]
      , 0

  App.reqres.setHandler "element:box:model:layers", (el, body) ->
    API.getElementBoxModelLayers(el, body)

  App.reqres.setHandler "element:dimensions", (el) ->
    API.getElementDimensions(el)

  ## return our API object for testability
  App.reqres.setHandler "element:dimensions:api", -> API