_ = require("lodash")
$jquery = require("./jquery")
$window = require("./window")
$document = require("./document")

fixedOrStickyRe = /(fixed|sticky)/

isElement = (obj) ->
  try
    !!(obj and obj[0] and _.isElement(obj[0])) or _.isElement(obj)
  catch
    false

isType = ($el, type) ->
  ($el.attr("type") or "").toLowerCase() is type

isScrollOrAuto = (prop) ->
  prop is "scroll" or prop is "auto"

isAncestor = ($el, $maybeAncestor) ->
  $el.parents().index($maybeAncestor) >= 0

isSelector = ($el, selector) ->
  $el.is(selector)

isTextLike = ($el) ->
  sel = (selector) -> isSelector($el, selector)
  type = (type) -> isType($el, type)

  _.some([
    sel("textarea")
    sel(":text")
    sel("[contenteditable]")
    type("password")
    type("email")
    type("number")
    type("date")
    type("week")
    type("month")
    type("time")
    type("datetime")
    type("datetime-local")
    type("search")
    type("url")
    type("tel")
  ])

isScrollable = ($el) ->
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
    when $window.isWindow($el)
      win = $el

      checkDocumentElement(win, win.document.documentElement)
    else
      ## if we're any other element, we do some css calculations
      ## to see that the overflow is correct and the scroll
      ## area is larger than the actual height or width
      el = $el[0]

      {overflow, overflowY, overflowX} = window.getComputedStyle(el)

      ## y axis
      ## if our content height is less than the total scroll height
      if el.clientHeight < el.scrollHeight
        ## and our element has scroll or auto overflow or overflowX
        return true if isScrollOrAuto(overflow) or isScrollOrAuto(overflowY)

      ## x axis
      if el.clientWidth < el.scrollWidth
        return true if isScrollOrAuto(overflow) or isScrollOrAuto(overflowX)

      return false

isDescendent = ($el1, $el2) ->
  return false if not $el2

  !!(($el1.get(0) is $el2.get(0)) or $el1.has($el2).length)

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
    if $parent.is("html,body") or $dom.isDocument($parent)
      return null

    if isScrollable($parent)
      return $parent

    return search($parent)

  return search($el)

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

getElements = ($el) ->
  return if not $el?.length

  if $el.length is 1
    $el.get(0)
  else
    _.reduce $el, (memo, el) ->
      memo.push(el)
      memo
    , []

## short form css-inlines the element
## long form returns the outerHTML
stringify = (el, form = "long") ->
  ## if we are formatting the window object
  if $window.isWindow(el)
    return "<window>"

  ## if we are formatting the document object
  if $document.isDocument(el)
    return "<document>"

  ## convert this to jquery if its not already one
  $el = $jquery.wrapInjQuery(el)

  switch form
    when "long"
      text     = _.chain($el.text()).clean().truncate({length: 10 }).value()
      children = $el.children().length
      str      = $el.clone().empty().prop("outerHTML")
      switch
        when children then str.replace("></", ">...</")
        when text     then str.replace("></", ">#{text}</")
        else
          str
    when "short"
      str = $el.prop("tagName").toLowerCase()
      if id = $el.prop("id")
        str += "#" + id

      ## using attr here instead of class because
      ## svg's return an SVGAnimatedString object
      ## instead of a normal string when calling
      ## the property 'class'
      if klass = $el.attr("class")
        str += "." + klass.split(/\s+/).join(".")

      ## if we have more than one element,
      ## format it so that the user can see there's more
      if $el.length > 1
        "[ <#{str}>, #{$el.length - 1} more... ]"
      else
        "<#{str}>"


module.exports = {
  isType

  isElement

  isSelector

  isScrollOrAuto

  isAncestor

  isScrollable

  isTextLike

  isDescendent

  stringify

  positionProps

  getElements

  getFirstFixedOrStickyPositionParent

  getFirstScrollableParent
}
