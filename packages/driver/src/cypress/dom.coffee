$ = require("jquery")
_ = require("lodash")
$utils = require("./utils")

fixedOrAbsoluteRe = /(fixed|absolute)/
fixedOrStickyRe = /(fixed|sticky)/

getWindowFromDoc = (doc) ->
  ## parentWindow for IE
  doc.defaultView or doc.parentWindow

isScrollOrAuto = (prop) ->
  prop is "scroll" or prop is "auto"

positionProps = ($el, adjustments = {}) ->
  el = $el[0]

  return {
    width: el.offsetWidth
    height: el.offsetHeight
    top: el.offsetTop + (adjustments.top or 0)
    right: el.offsetLeft + el.offsetWidth
    bottom: el.offsetTop + el.offsetHeight
    left: el.offsetLeft + (adjustments.left or 0)
    scrollTop: el.scrollTop
    scrollLeft: el.scrollLeft
  }

getFirstFixedOrStickyPositionParent = ($el) ->
  ## return null if we're at body/html
  ## cuz that means nothing has fixed position
  return null if not $el or $el.is("body,html")

  ## if we have fixed position return ourselves
  if fixedOrStickyRe.test($el.css("position"))
    return $el

  ## else recursively continue to walk up the parent node chain
  getFirstFixedOrStickyPositionParent($el.parent())

getFirstScrollableParent = ($el) ->
  # doc = $el.prop("ownerDocument")

  # win = getWindowFromDoc(doc)

  ## this may be null or not even defined in IE
  # scrollingElement = doc.scrollingElement

  search = ($el) ->
    $parent = $el.parent()

    ## we have no more parents
    if not ($parent or $parent.length)
      return null

    ## we match the scrollingElement
    # if $parent[0] is scrollingElement
    #   return $parent

    ## instead of fussing with scrollingElement
    ## we'll simply return null here and let our
    ## caller deal with situations where they're
    ## needing to scroll the window or scrollableElement
    if $parent.is("html,body") or $utils.hasDocument($parent)
      return null

    if dom.elIsScrollable($parent)
      return $parent

    return search($parent)

  return search($el)

dom = {
  positionProps

  getFirstFixedOrStickyPositionParent

  getFirstScrollableParent

  isVisible: (el) ->
    not dom.isHidden(el, "isVisible()")

  ## assign this fn to jquery and to our revealing module
  ## at the same time. #pro
  isHidden: (el, filter) ->
    if not $utils.hasElement(el)
      $utils.throwErrByPath("dom.non_dom_is_hidden", {
        args: { el, filter: filter or "isHidden()" }
      })

    $el = $(el)

    ## in Cypress-land we consider the element hidden if
    ## either its offsetHeight or offsetWidth is 0 because
    ## it is impossible for the user to interact with this element
    ## offsetHeight / offsetWidth includes the ef
    dom.elHasNoEffectiveWidthOrHeight($el) or

      ## additionally if the effective visibility of the element
      ## is hidden (which includes any parent nodes) then the user
      ## cannot interact with this element and thus it is hidden
      dom.elHasVisibilityHidden($el) or

        ## we do some calculations taking into account the parents
        ## to see if its hidden by a parent
        dom.elIsHiddenByAncestors($el) or

          dom.elIsOutOfBoundsOfAncestorsOverflow($el)

  elHasNoEffectiveWidthOrHeight: ($el) ->
    @elOffsetWidth($el) <= 0 or @elOffsetHeight($el) <= 0 or $el[0].getClientRects().length <= 0

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
    "hidden" in [$el.css("overflow"), $el.css("overflow-y"), $el.css("overflow-x")]

  elHasPositionRelative: ($el) ->
    $el.css("position") is "relative"

  elHasClippableOverflow: ($el) ->
    $el.css("overflow") in ["hidden", "scroll", "auto"] or
    $el.css("overflow-y") in ["hidden", "scroll", "auto"] or
    $el.css("overflow-x") in ["hidden", "scroll", "auto"]

  elIsScrollable: ($el) ->
    checkDocumentElement = (win, documentElement) ->
      ## Check if body height is higher than window height
      return true if win.innerHeight < documentElement.scrollHeight

      ## Check if body width is higher than window width
      return true if win.innerWidth < documentElement.scrollWidth

      ## else return false since the window is not scrollable
      return false

    ## if we're the window, we want to get the document's
    ## element and check its size against the actual window
    switch
      when $utils.hasWindow($el)
        win = $el

        checkDocumentElement(win, win.document.documentElement)
      else
        ## if we're any other element, we do some css calculations
        ## to see that the overflow is correct and the scroll
        ## area is larger than the actual height or width
        el = $el[0]

        {overflow, overflowY, overflowX} = getComputedStyle(el)

        ## y axis
        ## if our content height is less than the total scroll height
        if el.clientHeight < el.scrollHeight
          ## and our element has scroll or auto overflow or overflowX
          return true if isScrollOrAuto(overflow) or isScrollOrAuto(overflowY)

        ## x axis
        if el.clientWidth < el.scrollWidth
          return true if isScrollOrAuto(overflow) or isScrollOrAuto(overflowX)

        return false

  canClipContent: ($el, $ancestor) ->
    ## can't clip without clippable overflow
    if not @elHasClippableOverflow($ancestor)
      return false

    ## even if overflow is clippable, if an ancestor of the ancestor is the
    ## element's offset parent, the ancestor will not clip the element
    ## unless the element is position is position relative
    if not @elHasPositionRelative($el) and @isAncestor($ancestor, $($el[0].offsetParent))
      return false

    return true

  isAncestor: ($el, $maybeAncestor) ->
    $el.parents().index($maybeAncestor) >= 0

  elDescendentsHavePositionFixedOrAbsolute: ($parent, $child) ->
    ## create an array of all elements between $parent and $child
    ## including child but excluding parent
    ## and check if these have position fixed|absolute
    $els = $child.parentsUntil($parent).add($child)

    _.some $els.get(), (el) ->
      fixedOrAbsoluteRe.test $(el).css("position")

  ## walks up the tree and compares the target's size and position
  ## with that of its ancestors to determine if it's hidden due to being
  ## out of bounds of any ancestors that hide overflow
  elIsOutOfBoundsOfAncestorsOverflow: ($el, $prevAncestor, $ancestor, adjustments) ->
    $prevAncestor ?= $el
    $ancestor ?= $el.parent()
    adjustments ?= {left: 0, top: 0}

    return false if not $ancestor

    ## if we've reached the top parent, which is document
    ## then we're in bounds all the way up, return false
    return false if $ancestor.is("body,html") or $utils.hasDocument($ancestor)

    ancestor = $ancestor[0]

    ## as we walk up the tree, we add any offset parent's
    ## offsets to the left and top positions of the $el
    ## so we can make correct comparisons of the boundaries.
    if ancestor is $prevAncestor[0].offsetParent
      adjustments.left += ancestor.offsetLeft
      adjustments.top += ancestor.offsetTop

    elProps = positionProps($el, adjustments)

    if @canClipContent($el, $ancestor)
      ancestorProps = positionProps($ancestor)

      ## target el is out of bounds
      return true if (
        ## target el is to the right of the ancestor's visible area
        elProps.left > ancestorProps.width + ancestorProps.left + ancestorProps.scrollLeft or

        ## target el is to the left of the ancestor's visible area
        elProps.left + elProps.width < ancestorProps.left or

        ## target el is under the ancestor's visible area
        elProps.top > ancestorProps.height + ancestorProps.top + ancestorProps.scrollTop or

        ## target el is above the ancestor's visible area
        elProps.top + elProps.height < ancestorProps.top
      )

    @elIsOutOfBoundsOfAncestorsOverflow($el, $ancestor, $ancestor.parent(), adjustments)

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
    return false if $parent.is("body,html") or $utils.hasDocument($parent)

    if @elHasOverflowHidden($parent) and @elHasNoEffectiveWidthOrHeight($parent)
      ## if any of the elements between the parent and origEl
      ## have fixed or position absolute
      return not @elDescendentsHavePositionFixedOrAbsolute($parent, $origEl)

    ## continue to recursively walk up the chain until we reach body or html
    @elIsHiddenByAncestors($parent, $origEl)

  parentHasNoOffsetWidthOrHeightAndOverflowHidden: ($el) ->
    ## if we've walked all the way up to body or html then return false
    return false if not $el.length or $el.is("body,html")

    ## if we have overflow hidden and no effective width or height
    if @elHasOverflowHidden($el) and @elHasNoEffectiveWidthOrHeight($el)
      return $el
    else
      ## continue walking
      return @parentHasNoOffsetWidthOrHeightAndOverflowHidden($el.parent())

  parentHasDisplayNone: ($el) ->
    ## if we have no $el or we've walked all the way up to document
    ## then return false
    return false if not $el.length or $utils.hasDocument($el)

    ## if we have display none then return the $el
    if @elHasDisplayNone($el)
      return $el
    else
      ## continue walking
      return @parentHasDisplayNone($el.parent())

  parentHasVisibilityNone: ($el) ->
    ## if we've walked all the way up to document then return false
    return false if not $el.length or $utils.hasDocument($el)

    ## if we have display none then return the $el
    if @elHasVisibilityHidden($el)
      return $el
    else
      ## continue walking
      return @parentHasVisibilityNone($el.parent())

  getReasonElIsHidden: ($el) ->
    node = $utils.stringifyElement($el, "short")

    ## returns the reason in human terms why an element is considered not visible
    switch
      when @elHasDisplayNone($el)
        "This element '#{node}' is not visible because it has CSS property: 'display: none'"

      when $parent = @parentHasDisplayNone($el.parent())
        parentNode = $utils.stringifyElement($parent, "short")
        "This element '#{node}' is not visible because its parent '#{parentNode}' has CSS property: 'display: none'"

      when $parent = @parentHasVisibilityNone($el.parent())
        parentNode = $utils.stringifyElement($parent, "short")
        "This element '#{node}' is not visible because its parent '#{parentNode}' has CSS property: 'visibility: hidden'"

      when @elHasVisibilityHidden($el)
        "This element '#{node}' is not visible because it has CSS property: 'visibility: hidden'"

      when @elHasNoOffsetWidthOrHeight($el)
        width  = @elOffsetWidth($el)
        height = @elOffsetHeight($el)
        "This element '#{node}' is not visible because it has an effective width and height of: '#{width} x #{height}' pixels."

      when $parent = @parentHasNoOffsetWidthOrHeightAndOverflowHidden($el.parent())
        parentNode  = $utils.stringifyElement($parent, "short")
        width       = @elOffsetWidth($parent)
        height      = @elOffsetHeight($parent)
        "This element '#{node}' is not visible because its parent '#{parentNode}' has CSS property: 'overflow: hidden' and an effective width and height of: '#{width} x #{height}' pixels."

      when @elIsOutOfBoundsOfAncestorsOverflow($el)
        "This element '#{node}' is not visible because its content is being clipped by one of its parent elements, which has a CSS property of overflow: 'hidden', 'scroll' or 'auto'"

      else
        "Cypress could not determine why this element '#{node}' is not visible."

  elIsTextLike: ($el) ->
    isSel = (selector) => @elMatchesSelector($el, selector)
    isType = (type) => @elIsType($el, type)

    _.some([
      isSel("textarea")
      isSel(":text")
      isSel("[contenteditable]")
      isType("password")
      isType("email")
      isType("number")
      isType("date")
      isType("week")
      isType("month")
      isType("time")
      isType("datetime")
      isType("datetime-local")
      isType("search")
      isType("url")
      isType("tel")
    ])

  elIsType: ($el, type) ->
    ($el.attr("type") or "").toLowerCase() is type

  elMatchesSelector: ($el, selector) ->
    $el.is(selector)

}

module.exports = dom
