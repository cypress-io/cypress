do ($Cypress, _) ->

  ## move these all to utilities? yeah?
  $Cypress.Cy.extend
    getElementAtCoordinates: (x, y) ->
      $(@sync.document().get(0).elementFromPoint(x, y))

    getCenterCoordinates: ($el) ->
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