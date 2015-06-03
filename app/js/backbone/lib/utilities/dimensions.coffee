@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  API =
    getHitBoxLayer: (coords, body) ->
      body ?= $("body")

      height = 10
      width = 10

      dotHeight = 4
      dotWidth = 4

      top  = coords.y - height / 2
      left = coords.x - width / 2

      dotTop  = height / 2 - dotHeight / 2
      dotLeft = width / 2 - dotWidth / 2

      box     = $("<div>", style: "position: absolute; top: #{top}px; left: #{left}px; width: #{width}px; height: #{height}px; background-color: red; border-radius: 5px; box-shadow: 0 0 5px #333; z-index: 2147483647;")
      wrapper = $("<div>", style: "position: relative;").appendTo(box)
      dot     = $("<div>", style: "position: absolute; top: #{dotTop}px; left: #{dotLeft}px; height: #{dotHeight}px; width: #{dotWidth}px; height: #{dotHeight}px; background-color: pink; border-radius: 5px;").appendTo(wrapper)

      box.appendTo(body)

    getElementBoxModelLayers: (el, body) ->
      ## use our own body if one isnt explicitly passed in
      body ?= $("body")

      dimensions = @getElementDimensions(el)

      container = $("<div>")

      layers = {
        Content: "#9FC4E7"
        Padding: "#C1CD89"
        Border: "#FCDB9A"
        Margin: "#F9CC9D"
      }

      ## create the margin / bottom / padding layers
      _.each layers, (color, attr) =>
        obj = switch attr
          when "Content"
            ## rearrange the contents offset so
            ## its inside of our border + padding
            {
              width: dimensions.width
              height: dimensions.height
              top: (dimensions.offset.top + dimensions.borderTop + dimensions.paddingTop)
              left: (dimensions.offset.left + dimensions.borderLeft + dimensions.paddingLeft)
            }

          else
            {
              width: @getDimensionsFor(dimensions, attr, "width")
              height: @getDimensionsFor(dimensions, attr, "height")
              top: dimensions.offset.top
              left: dimensions.offset.left
            }

        ## if attr is margin then we need to additional
        ## subtract what the actual marginTop + marginLeft
        ## values are, since offset disregards margin completely
        if attr is "Margin"
          obj.top -= dimensions.marginTop
          obj.left -= dimensions.marginLeft

        ## bail if the dimesions of this layer match the previous one
        ## so we dont create unnecessary layers
        return if @dimensionsMatchPreviousLayer(obj, container)

        @createLayer el, attr, color, container, obj

      container.appendTo(body)

      container.children().each (index, el) ->
        $el  = $(el)
        top  = $el.data("top")
        left = $el.data("left")

        ## dont ask... for some reason we
        ## have to run offset twice!
        for i in [1..2]
          $el.offset({
            top: top
            left: left
          })

      return container

    createLayer: (el, attr, color, container, dimensions) ->
      transform = el.css("transform")

      css = {
        transform: transform
        width: dimensions.width
        height: dimensions.height
        # top: dimensions.top
        # left: dimensions.left
        position: "absolute"
        zIndex: @getZIndex(el)
        backgroundColor: color
        opacity: 0.6
      }

      $("<div>")
        .css(css)
        .attr("data-top", dimensions.top)
        .attr("data-left", dimensions.left)
        .attr("data-layer", attr)
        .prependTo(container)

    dimensionsMatchPreviousLayer: (obj, container) ->
      ## since we're prepending to the container that
      ## means the previous layer is actually the first child element
      previousLayer = container.children().first()

      ## bail if there is no previous layer
      return if not previousLayer.length

      obj.width is previousLayer.width() and
      obj.height is previousLayer.height()

    getDimensionsFor: (dimensions, attr, dimension) ->
      dimensions[dimension + "With" + attr]

    getZIndex: (el) ->
      if /^(auto|0)$/.test el.css("zIndex") then 2147483647 else _.toNumber el.css("zIndex")

    getElementDimensions: (el) ->
      ## create dynamic attr method to create a closure
      ## around el
      @attr = (attr) ->
        ## nuke anything thats not a number
        ## or a negative symbol
        num = el.css(attr).replace /[^0-9\.-]+/, ""

        throw new Error("Element attr did not return a valid number") if not _.isFinite(num)

        _(num).toNumber()

      dimensions = {
        offset: el.offset() ## offset disregards margin but takes into account border + padding
        height: el.height() ## we want to use height here (because that always returns just the content hight) instead of .css() because .css("height") is altered based on whether box-sizing: border-box is set
        width: el.width()
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

      ## innerHeight: Get the current computed height for the first
      ## element in the set of matched elements, including padding but not border.

      ## outerHeight: Get the current computed height for the first
      ## element in the set of matched elements, including padding, border,
      ## and optionally margin. Returns a number (without "px") representation
      ## of the value or null if called on an empty set of elements.

      dimensions.heightWithPadding = el.innerHeight()
      dimensions.heightWithBorder = el.innerHeight() + @getTotalFor(["borderTop", "borderBottom"], dimensions)
      dimensions.heightWithMargin = el.outerHeight(true)

      dimensions.widthWithPadding = el.innerWidth()
      dimensions.widthWithBorder = el.innerWidth() + @getTotalFor(["borderRight", "borderLeft"], dimensions)
      dimensions.widthWithMargin = el.outerWidth(true)

      return dimensions

    getPadding: (el, dir) ->
      @attr "padding-#{dir}"

    getBorder: (el, dir) ->
      @attr "border-#{dir}-width"

    getMargin: (el, dir) ->
      @attr "margin-#{dir}"

    getTotalFor: (directions, dimensions) ->
      _.reduce directions, (memo, direction) ->
        memo += dimensions[direction]
      , 0

  App.reqres.setHandler "element:box:model:layers", (el, body) ->
    API.getElementBoxModelLayers(el, body)

  App.reqres.setHandler "element:dimensions", (el) ->
    API.getElementDimensions(el)

  App.reqres.setHandler "element:hit:box:layer", (coords, body) ->
    API.getHitBoxLayer(coords, body)

  ## return our API object for testability
  App.reqres.setHandler "element:dimensions:api", -> API