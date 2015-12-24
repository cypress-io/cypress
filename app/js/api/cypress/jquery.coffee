$Cypress.JQuery = do ($Cypress, _, $) ->

  fixedOrAbsoluteRe = /(fixed|absolute)/

  return obj = {
    ## assign this fn to jquery and to our revealing module
    ## at the same time. #pro
    elIsHidden: $.expr.filters.hidden = (el) ->
      $el = $(el)

      ## in Cypress-land we consider the element hidden if
      ## either its offsetHeight or offsetWidth is 0 because
      ## it is impossible for the user to interact with this element
      ## offsetHeight / offsetWidth includes the ef
      obj.elHasNoOffsetWidthOrHeight($el) or

        ## additionally if the effective visibility of the element
        ## is hidden (which includes any parent nodes) then the user
        ## cannot interact with this element and thus it is hidden
        obj.elHasVisibilityHidden($el) or

          ## we do some calculations taking into account the parents
          ## to see if its hidden by a parent
          obj.elIsHiddenByAncestors($el)

    elHasNoOffsetWidthOrHeight: ($el) ->
      @elOffsetWidth($el) <= 0 or @elOffsetHeight($el) <= 0

    elOffsetWidth: ($el) ->
      $el[0].offsetWidth

    elOffsetHeight: ($el) ->
      $el[0].offsetHeight

    elHasVisibilityHidden: ($el) ->
      $el.css("visibility") is "hidden"

    elHasDisplayNone: ($el) ->
      $el.css("display") is "none"

    elHasOverflowHidden: ($el) ->
      $el.css("overflow") is "hidden"

    elDescendentsHavePositionFixedOrAbsolute: ($parent, $child) ->
      ## create an array of all elements between $parent and $child
      ## including child but excluding parent
      ## and check if these have position fixed|absolute
      $els = $child.parentsUntil($parent).add($child)

      _.any $els.get(), (el) ->
        fixedOrAbsoluteRe.test $(el).css("position")

    elIsHiddenByAncestors: ($el, $origEl) ->
      ## store the original $el
      $origEl ?= $el

      ## walk up to each parent until we reach the body
      ## if any parent has an effective offsetHeight of 0
      ## and its set overflow: hidden then our child element
      ## is effectively hidden
      ## -----UNLESS------
      ## the parent or a descendent has position: absolute|fixed
      $parent = $el.parent()

      ## stop if we've reached the body or html
      ## in case there is no body
      return false if $parent.is("body,html")

      if @elHasOverflowHidden($parent) and @elHasNoOffsetWidthOrHeight($parent)
        ## if any of the elements between the parent and origEl
        ## have fixed or position absolute
        if @elDescendentsHavePositionFixedOrAbsolute($parent, $origEl)
          ## then they are not hidden
          return false
        else
          ## else they are
          return true

      ## continue to recursively walk up the chain until we reach body or html
      @elIsHiddenByAncestors($parent, $origEl)

    parentHasNoOffsetWidthOrHeightAndOverflowHidden: ($el) ->
      ## if we've walked all the way up to body or html then return false
      return false if $el.is("body,html")

      ## if we have overflow hidden and no effective width or height
      if @elHasOverflowHidden($el) and @elHasNoOffsetWidthOrHeight($el)
        return $el
      else
        ## continue walking
        return @parentHasNoOffsetWidthOrHeightAndOverflowHidden($el.parent())

    parentHasDisplayNone: ($el) ->
      ## if we've walked all the way up to document then return false
      return false if $Cypress.Utils.hasDocument($el)

      ## if we have display none then return the $el
      if @elHasDisplayNone($el)
        return $el
      else
        ## continue walking
        return @parentHasDisplayNone($el.parent())

    parentHasVisibilityNone: ($el) ->
      ## if we've walked all the way up to document then return false
      return false if $Cypress.Utils.hasDocument($el)

      ## if we have display none then return the $el
      if @elHasVisibilityHidden($el)
        return $el
      else
        ## continue walking
        return @parentHasVisibilityNone($el.parent())

    getReasonElIsHidden: ($el) ->
      ## returns the reason in human terms why an element is considered not visible
      switch
        when @elHasDisplayNone($el)
          "This element is not visible because it has CSS property: 'display: none'"

        when $parent = @parentHasDisplayNone($el.parent())
          node = $Cypress.Utils.stringifyElement($parent, "short")
          "This element is not visible because it's parent: #{node} has CSS property: 'display: none'"

        when $parent = @parentHasVisibilityNone($el.parent())
          node = $Cypress.Utils.stringifyElement($parent, "short")
          "This element is not visible because it's parent: #{node} has CSS property: 'visibility: hidden'"

        when @elHasVisibilityHidden($el)
          "This element is not visible because it has CSS property: 'visibility: hidden'"

        when @elHasNoOffsetWidthOrHeight($el)
          width  = @elOffsetWidth($el)
          height = @elOffsetHeight($el)
          "This element is not visible because it has an effective width and height of: '#{width} x #{height}' pixels."

        when $parent = @parentHasNoOffsetWidthOrHeightAndOverflowHidden($el.parent())
          node   = $Cypress.Utils.stringifyElement($parent, "short")
          width  = @elOffsetWidth($parent)
          height = @elOffsetHeight($parent)
          "This element is not visible because it's parent: #{node} has CSS property: 'overflow: hidden' and an effective width and height of: '#{width} x #{height}' pixels."

        else
          "Cypress could not determine why this element is not visible."

  }
