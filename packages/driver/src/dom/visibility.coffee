_ = require("lodash")

$jquery = require("./jquery")
$document = require("./document")
$elements = require("./elements")
$win = require("./window")

fixedOrAbsoluteRe = /(fixed|absolute)/

OVERFLOW_PROPS = ["hidden", "scroll", "auto"]

isVisible = (el) ->
  not isHidden(el, "isVisible()")

## TODO: we should prob update dom
## to be passed in $utils as a dependency
## because of circular references
isHidden = (el, name) ->
  if not $elements.isElement(el)
    name ?= "isHidden()"

    throw new Error("Cypress.dom.#{name} must be passed a basic DOM element.")

  $el = $jquery.wrap(el)

  ## in Cypress-land we consider the element hidden if
  ## either its offsetHeight or offsetWidth is 0 because
  ## it is impossible for the user to interact with this element
  ## offsetHeight / offsetWidth includes the ef
  elHasNoEffectiveWidthOrHeight($el) or

    ## additionally if the effective visibility of the element
    ## is hidden (which includes any parent nodes) then the user
    ## cannot interact with this element and thus it is hidden
    elHasVisibilityHidden($el) or

      ## we do some calculations taking into account the parents
      ## to see if its hidden by a parent
      elIsHiddenByAncestors($el) or

        elIsOutOfBoundsOfAncestorsOverflow($el)

elHasNoEffectiveWidthOrHeight = ($el) ->
  elOffsetWidth($el) <= 0 or elOffsetHeight($el) <= 0 or $el[0].getClientRects().length <= 0

elHasNoOffsetWidthOrHeight = ($el) ->
  elOffsetWidth($el) <= 0 or elOffsetHeight($el) <= 0

elOffsetWidth = ($el) ->
  $el[0].offsetWidth

elOffsetHeight = ($el) ->
  $el[0].offsetHeight

elHasVisibilityHidden = ($el) ->
  $el.css("visibility") is "hidden"

elHasDisplayNone = ($el) ->
  $el.css("display") is "none"

elHasOverflowHidden = ($el) ->
  "hidden" in [$el.css("overflow"), $el.css("overflow-y"), $el.css("overflow-x")]

elHasPositionRelative = ($el) ->
  $el.css("position") is "relative"

elHasClippableOverflow = ($el) ->
  $el.css("overflow") in OVERFLOW_PROPS or
  $el.css("overflow-y") in OVERFLOW_PROPS or
  $el.css("overflow-x") in OVERFLOW_PROPS

canClipContent = ($el, $ancestor) ->
  ## can't clip without clippable overflow
  if not elHasClippableOverflow($ancestor)
    return false

  ## even if overflow is clippable, if an ancestor of the ancestor is the
  ## element's offset parent, the ancestor will not clip the element
  ## unless the element is position relative
  if not elHasPositionRelative($el) and $elements.isAncestor($ancestor, $jquery.wrap($el[0].offsetParent))
    return false

  return true

elDescendentsHavePositionFixedOrAbsolute = ($parent, $child) ->
  ## create an array of all elements between $parent and $child
  ## including child but excluding parent
  ## and check if these have position fixed|absolute
  $els = $child.parentsUntil($parent).add($child)

  _.some $els.get(), (el) ->
    fixedOrAbsoluteRe.test $jquery.wrap(el).css("position")

## walks up the tree and compares the target's size and position
## with that of its ancestors to determine if it's hidden due to being
## out of bounds of any ancestors that hide overflow
elIsOutOfBoundsOfAncestorsOverflow = ($el, $prevAncestor, $ancestor, adjustments) ->
  $prevAncestor ?= $el
  $ancestor ?= $el.parent()
  adjustments ?= {left: 0, top: 0}

  return false if not $ancestor

  ## if we've reached the top parent, which is document
  ## then we're in bounds all the way up, return false
  return false if $ancestor.is("body,html") or $document.isDocument($ancestor)

  ancestor = $ancestor[0]

  ## as we walk up the tree, we add any offset parent's
  ## offsets to the left and top positions of the $el
  ## so we can make correct comparisons of the boundaries.
  if ancestor is $prevAncestor[0].offsetParent
    adjustments.left += ancestor.getBoundingClientRect().left
    adjustments.top += ancestor.getBoundingClientRect().top

  elProps = $elements.positionProps($el, adjustments)

  win = $win.getWindowByElement($el[0])

  if canClipContent($el, $ancestor)
    ancestorProps = $elements.positionProps($ancestor)

    ## target el is out of bounds
    return true if (
      ## target el is to the right of the ancestor's visible area
      elProps.left > ancestorProps.width + ancestorProps.left + win.pageXOffset or

      ## target el is to the left of the ancestor's visible area
      elProps.left + elProps.width < ancestorProps.left or

      ## target el is under the ancestor's visible area
      elProps.top > ancestorProps.height + ancestorProps.top + win.pageYOffset or

      ## target el is above the ancestor's visible area
      elProps.top + elProps.height < ancestorProps.top
    )

  elIsOutOfBoundsOfAncestorsOverflow($el, $ancestor, $ancestor.parent(), adjustments)

elIsHiddenByAncestors = ($el, $origEl) ->
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
  return false if $parent.is("body,html") or $document.isDocument($parent)

  if elHasOverflowHidden($parent) and elHasNoEffectiveWidthOrHeight($parent)
    ## if any of the elements between the parent and origEl
    ## have fixed or position absolute
    return not elDescendentsHavePositionFixedOrAbsolute($parent, $origEl)

  ## continue to recursively walk up the chain until we reach body or html
  elIsHiddenByAncestors($parent, $origEl)

parentHasNoOffsetWidthOrHeightAndOverflowHidden = ($el) ->
  ## if we've walked all the way up to body or html then return false
  return false if not $el.length or $el.is("body,html")

  ## if we have overflow hidden and no effective width or height
  if elHasOverflowHidden($el) and elHasNoEffectiveWidthOrHeight($el)
    return $el
  else
    ## continue walking
    return parentHasNoOffsetWidthOrHeightAndOverflowHidden($el.parent())

parentHasDisplayNone = ($el) ->
  ## if we have no $el or we've walked all the way up to document
  ## then return false
  return false if not $el.length or $document.isDocument($el)

  ## if we have display none then return the $el
  if elHasDisplayNone($el)
    return $el
  else
    ## continue walking
    return parentHasDisplayNone($el.parent())

parentHasVisibilityNone = ($el) ->
  ## if we've walked all the way up to document then return false
  return false if not $el.length or $document.isDocument($el)

  ## if we have display none then return the $el
  if elHasVisibilityHidden($el)
    return $el
  else
    ## continue walking
    return parentHasVisibilityNone($el.parent())

getReasonIsHidden = ($el) ->
  node = $elements.stringify($el, "short")

  ## returns the reason in human terms why an element is considered not visible
  switch
    when elHasDisplayNone($el)
      "This element '#{node}' is not visible because it has CSS property: 'display: none'"

    when $parent = parentHasDisplayNone($el.parent())
      parentNode = $elements.stringify($parent, "short")
      "This element '#{node}' is not visible because its parent '#{parentNode}' has CSS property: 'display: none'"

    when $parent = parentHasVisibilityNone($el.parent())
      parentNode = $elements.stringify($parent, "short")
      "This element '#{node}' is not visible because its parent '#{parentNode}' has CSS property: 'visibility: hidden'"

    when elHasVisibilityHidden($el)
      "This element '#{node}' is not visible because it has CSS property: 'visibility: hidden'"

    when elHasNoOffsetWidthOrHeight($el)
      width  = elOffsetWidth($el)
      height = elOffsetHeight($el)
      "This element '#{node}' is not visible because it has an effective width and height of: '#{width} x #{height}' pixels."

    when $parent = parentHasNoOffsetWidthOrHeightAndOverflowHidden($el.parent())
      parentNode  = $elements.stringify($parent, "short")
      width       = elOffsetWidth($parent)
      height      = elOffsetHeight($parent)
      "This element '#{node}' is not visible because its parent '#{parentNode}' has CSS property: 'overflow: hidden' and an effective width and height of: '#{width} x #{height}' pixels."

    when elIsOutOfBoundsOfAncestorsOverflow($el)
      "This element '#{node}' is not visible because its content is being clipped by one of its parent elements, which has a CSS property of overflow: 'hidden', 'scroll' or 'auto'"

    else
      "Cypress could not determine why this element '#{node}' is not visible."

module.exports = {
  isVisible

  isHidden

  getReasonIsHidden
}
