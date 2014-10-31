do ($, _) ->

  $.ajaxSetup
    cache: false

  $.fn.toggleWrapper = (obj = {}, cid, init) ->
    methods =
      getWrapperByCid: (cid) ->
        $("[data-wrapper='#{cid}']")

      isTransparent: (bg) ->
        /transparent|rgba/.test bg

      setBackgroundColor: (bg) ->
        if @isTransparent(bg) then "white" else bg

      walkDownToChild: (el) ->
        @getDimensions el.children()

      hasDimensions: (vals) ->
        vals.width > 0 and vals.height > 0

      getDimensions: (el) ->
        vals =
          offset: el.offset()
          width: el.outerWidth(false)
          height: el.outerHeight(false)

        return vals if @hasDimensions(vals) or el.children().length is 0

        @walkDownToChild(el)

    _.defaults obj,
      className: ""
      backgroundColor: methods.setBackgroundColor @css("backgroundColor")
      zIndex: if @css("zIndex") is "auto" or 0 then 1000 else (Number) @css("zIndex")

    dimensions = methods.getDimensions(@)

    if init
      ## don't add another wrapper if one is already present
      return if methods.getWrapperByCid(cid).length

      ## add the wrapper
      $("<div>")
        .appendTo("body")
          .addClass(obj.className)
            .attr("data-wrapper", cid)
              .css
                width: dimensions.width
                height: dimensions.height
                top: dimensions.offset.top
                left: dimensions.offset.left
                position: "absolute"
                zIndex: obj.zIndex + 1
                backgroundColor: obj.backgroundColor
    else
      ## remove the wrapper
      methods.getWrapperByCid(cid).remove()

  $.fn.isReadable = ->
    throw new Error("isReadable() must only be called on <iframes>") if not @is("iframe")

    try
      @prop("contentDocument")
      return true
    catch e
      return false
