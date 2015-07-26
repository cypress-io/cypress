do ($Cypress, _) ->

  normalizeCoords = (x, y) ->
    {
      x: Math.floor(x)
      y: Math.floor(y)
    }

  $Cypress.Cy.extend
    getElementAtCoordinates: (x, y) ->
      ## the coords we receive are absolute coordinates from
      ## the top of the window, they are not relative to the viewport
      ## because elementFromPoint returns us elements only relative
      ## to the viewport, we must subtract the current scroll'd offset
      ## before applying this calculation
      ## however this method assumes the element in question IS currently
      ## in the viewport, and therefore we must ensure to scroll the
      ## element into view prior to running this method or this will
      ## return null
      win = @private("window")

      scrollX = x - win.pageXOffset
      scrollY = y - win.pageYOffset

      el = @private("document").elementFromPoint(scrollX, scrollY)

      ## only wrap el if its non-null
      if el
        el = $(el)

      return el

    getBoundingClientRect: ($el) ->
      ## getBoundingClientRect ensures rotatation
      ## is factored into calculations
      ## which means we dont have to do any math, yay!
      if Element.prototype.getBoundingClientRect
        win = @private("window")

        ## top/left are returned relative to viewport
        ## so we have to add in the scrolled amount
        ## to get absolute coordinates
        offset = $el.get(0).getBoundingClientRect()

        ## we have to convert to a regular object to mutate
        offset = _(offset).pick("top", "left", "width", "height")
        offset.top  += win.pageYOffset
        offset.left += win.pageXOffset

        {width, height} = offset
      else
        offset = $el.offset()
        width  = $el.outerWidth()
        height = $el.outerHeight()

    getCenterCoordinates: (rect) ->
      x = rect.left + rect.width / 2
      y = rect.top + rect.height / 2
      normalizeCoords(x, y)

    getTopLeftCoordinates: (rect) ->
      x = rect.left
      y = rect.top
      normalizeCoords(x, y)

    getTopRightCoordinates: (rect) ->
      x = rect.left + rect.width
      y = rect.top
      normalizeCoords(x, y)

    getBottomLeftCoordinates: (rect) ->
      x = rect.left
      y = rect.top + rect.height
      normalizeCoords(x, y)

    getBottomRightCoordinates: (rect) ->
      x = rect.left + rect.width
      y = rect.top + rect.height
      normalizeCoords(x, y)

    getRelativeCoordinates: ($el, x, y) ->
      rect = @getBoundingClientRect($el)
      x    = rect.left + x
      y    = rect.top + y
      normalizeCoords(x, y)

    getCoordinates: ($el, position = "center") ->
      rect = @getBoundingClientRect($el)

      switch position
        when "center"       then @getCenterCoordinates(rect)
        when "topLeft"      then @getTopLeftCoordinates(rect)
        when "topRight"     then @getTopRightCoordinates(rect)
        when "bottomLeft"   then @getBottomLeftCoordinates(rect)
        when "bottomRight"  then @getBottomRightCoordinates(rect)
        else
          throw new Error("Invalid position argument: '#{position}'. Position may only be center, topLeft, topRight, bottomLeft, or bottomRight.")