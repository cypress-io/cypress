do ($Cypress, _) ->

  ## move these all to utilities? yeah?
  $Cypress.Cy.extend
    getElementAtCoordinates: (x, y) ->
      win = @sync.window()
      doc = @sync.document().get(0)

      prevScrollX = win.pageXOffset
      prevScrollY = win.pageYOffset

      win.scrollTo(x, y)

      scrollX = x - win.pageXOffset
      scrollY = y - win.pageYOffset

      el = $(@sync.document().get(0).elementFromPoint(scrollX, scrollY))

      win.scrollTo(prevScrollX, prevScrollY)

      return el

    getCenterCoordinates: ($el) ->
      ## getBoundingClientRect ensures rotatation
      ## is factored into calculations
      ## which means we dont have to do any math, yay!
      if Element.prototype.getBoundingClientRect
        win = @sync.window()

        ## top/left are returned relative to viewport
        ## so we have to add in the scrolled amount
        ## to get absolute coordinates
        offset = $el.get(0).getBoundingClientRect()
        offset.top  += win.pageYOffset
        offset.left += win.pageXOffset

        {width, height} = offset
      else
        offset = $el.offset()
        width  = $el.outerWidth()
        height = $el.outerHeight()

      {
        x: offset.left + width / 2
        y: offset.top + height / 2
      }

    getCoordinates: ($el, position = "center") ->
      switch position
        when "center"       then @getCenterCoordinates($el)
        when "topLeft"
          return
        when "topRight"
          return
        when "bottomLeft"
          return
        when "bottomRight"
          return
        else
          throw new Error("position may only be center, topLeft, topRight, bottomLeft, or bottomRight")