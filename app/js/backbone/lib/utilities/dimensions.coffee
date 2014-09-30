@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  API =
    getElementDimensions: (el) ->

      ## create dynamic attr method to create a closure
      ## around el
      @attr = (attr) ->
        ## nuke anything thats not a number
        num = el.css(attr).replace /[^0-9]+/, ""

        throw new Error("Element attr did not return a valid number") if not _.isFinite(num)

        _(num).toNumber()

      dimensions = {
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

  App.reqres.setHandler "element:dimensions", (el) ->
    API.getElementDimensions(el)

  ## return our API object for testability
  App.reqres.setHandler "element:dimensions:api", -> API