$Cypress.Dom = do ($Cypress, _, $) ->

  fixedOrAbsoluteRe = /(fixed|absolute)/

  return obj = {
    ## assign this fn to jquery and to our revealing module
    ## at the same time. #pro
    isHidden: $.expr.filters.hidden = (el) ->
      if not $Cypress.Utils.hasElement(el)
        $Cypress.Utils.throwErrByPath("dom.non_dom_is_hidden", {
          args: { el }
        })

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
          obj.elIsHiddenByAncestors($el) or

            obj.elIsOutOfBoundsOfAncestorsOverflow($el)

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

    canClipContent: ($el) ->
      elStyle    = getComputedStyle($el[0])
      elOverflow = elStyle.overflow

      ##: if overflow-x, overflow-y hidden, then overflow is auto
      (elOverflow is 'hidden') or
      (elOverflow is 'scroll') or
      (elOverflow is 'auto')

    elDescendentsHavePositionFixedOrAbsolute: ($parent, $child) ->
      ## create an array of all elements between $parent and $child
      ## including child but excluding parent
      ## and check if these have position fixed|absolute
      $els = $child.parentsUntil($parent).add($child)

      _.any $els.get(), (el) ->
        fixedOrAbsoluteRe.test $(el).css("position")

    elIsOutOfBoundsOfAncestorsOverflow: ($el) ->
      ## get some offset positions for el
      elTop = $el[0].offsetTop ## Top corner position number
      elLeft = $el[0].offsetLeft ## Left corner position number
      elWidth = $el[0].offsetWidth ## el width
      elHeight = $el[0].offsetHeight ## el height
      elBottom = elTop + elHeight ## Bottom corner position number
      elRight = elLeft + elWidth ## Right corner position number

      @isInBounds($el, elTop, elRight, elBottom, elLeft, elWidth, elHeight)

    isInBounds: ($el, elTop, elRight, elBottom, elLeft, elWidth, elHeight) ->
      $parent = $el.parent()

      if $parent
        ## if we've reached the top parent, which is document
        ## then we're in bounds all the way up, return false
        return false if $parent.is("body,html") or $Cypress.Utils.hasDocument($parent)

        ## if the current element's offset parent IS the
        ## parent, we want to add that offset to the element
        ## so we can make correct comparisons of the boundaries.
        if $parent[0] is $el[0].offsetParent
          elLeft += $parent[0].offsetLeft
          elTop += $parent[0].offsetTop

        ## hidden, scroll, or auto can all chip children elements
        if @canClipContent($parent)

          parentWidth = $parent[0].offsetWidth
          parentHeight = $parent[0].offsetHeight
          parentLeft = $parent[0].offsetLeft
          parentTop = $parent[0].offsetTop

          ## Our target el is out of bounds
          return true if (
            ## target el is to the right of the parent el
            elLeft > parentWidth + parentLeft ||

            ## target el is to the left of the parent el
            elLeft + elWidth < parentLeft ||

            ## target el is under the parent el
            elTop > parentHeight + parentTop ||

            ## target el is above the parent el
            elTop + elHeight < parentTop
          )

        @isInBounds($parent, elTop, elRight, elBottom, elLeft, elWidth, elHeight)
      else
        return false

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
      ## or if parent is the document which can
      ## happen if we already have an <html> element
      return false if $parent.is("body,html") or $Cypress.Utils.hasDocument($parent)

      if @elHasOverflowHidden($parent)
        if @elHasNoOffsetWidthOrHeight($parent)
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
      return false if not $el.length or $el.is("body,html")

      ## if we have overflow hidden and no effective width or height
      if @elHasOverflowHidden($el) and @elHasNoOffsetWidthOrHeight($el)
        return $el
      else
        ## continue walking
        return @parentHasNoOffsetWidthOrHeightAndOverflowHidden($el.parent())

    parentHasDisplayNone: ($el) ->
      ## if we have no $el or we've walked all the way up to document
      ## then return false
      return false if not $el.length or $Cypress.Utils.hasDocument($el)

      ## if we have display none then return the $el
      if @elHasDisplayNone($el)
        return $el
      else
        ## continue walking
        return @parentHasDisplayNone($el.parent())

    parentHasVisibilityNone: ($el) ->
      ## if we've walked all the way up to document then return false
      return false if not $el.length or $Cypress.Utils.hasDocument($el)

      ## if we have display none then return the $el
      if @elHasVisibilityHidden($el)
        return $el
      else
        ## continue walking
        return @parentHasVisibilityNone($el.parent())

    getReasonElIsHidden: ($el) ->
      node   = $Cypress.Utils.stringifyElement($el, "short")

      ## returns the reason in human terms why an element is considered not visible
      switch
        when @elHasDisplayNone($el)
          "This element: #{node} is not visible because it has CSS property: 'display: none'"

        when $parent = @parentHasDisplayNone($el.parent())
          parentNode = $Cypress.Utils.stringifyElement($parent, "short")
          "This element: #{node} is not visible because it's parent: #{parentNode} has CSS property: 'display: none'"

        when $parent = @parentHasVisibilityNone($el.parent())
          parentNode = $Cypress.Utils.stringifyElement($parent, "short")
          "This element: #{node} is not visible because it's parent: #{parentNode} has CSS property: 'visibility: hidden'"

        when @elHasVisibilityHidden($el)
          "This element: #{node} is not visible because it has CSS property: 'visibility: hidden'"

        when @elHasNoOffsetWidthOrHeight($el)
          width  = @elOffsetWidth($el)
          height = @elOffsetHeight($el)
          "This element: #{node} is not visible because it has an effective width and height of: '#{width} x #{height}' pixels."

        when $parent = @parentHasNoOffsetWidthOrHeightAndOverflowHidden($el.parent())
          parentNode  = $Cypress.Utils.stringifyElement($parent, "short")
          width       = @elOffsetWidth($parent)
          height      = @elOffsetHeight($parent)
          "This element: #{node} is not visible because it's parent: #{parentNode} has CSS property: 'overflow: hidden' and an effective width and height of: '#{width} x #{height}' pixels."

        when @elIsOutOfBoundsOfAncestorsOverflow($el)
          "This element: #{node} is not visible because it's content is being clipped by one of it's parent elements, which has a CSS property of overflow: 'hidden', 'scroll' or 'auto'"

        else
          "Cypress could not determine why this element: #{node} is not visible."

  }
