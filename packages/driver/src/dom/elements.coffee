_ = require("lodash")
$ = require("jquery")
$jquery = require("./jquery")
$window = require("./window")
$document = require("./document")
$utils = require("../cypress/utils")

fixedOrStickyRe = /(fixed|sticky)/

focusable = "body,a[href],link[href],button,select,[tabindex],input,textarea,[contenteditable]"

inputTypeNeedSingleValueChangeRe = /^(date|time|month|week|datetime|datetime-local)$/
canSetSelectionRangeElementRe = /^(text|search|URL|tel|password)$/

## rules for native methods and props
## if a setter or getter or function then add a native method
## if a traversal, don't

descriptor = (klass, prop) ->
  Object.getOwnPropertyDescriptor(window[klass].prototype, prop)

_getValue = ->
  switch
    when isInput(this)
      descriptor("HTMLInputElement", "value").get
    when isTextarea(this)
      descriptor("HTMLTextAreaElement", "value").get
    when isSelect(this)
      descriptor("HTMLSelectElement", "value").get
    when isButton(this)
      descriptor("HTMLButtonElement", "value").get
    else
      ## is an option element
      descriptor("HTMLOptionElement", "value").get

_setValue = ->
  switch
    when isInput(this)
      descriptor("HTMLInputElement", "value").set
    when isTextarea(this)
      descriptor("HTMLTextAreaElement", "value").set
    when isSelect(this)
      descriptor("HTMLSelectElement", "value").set
    when isButton(this)
      descriptor("HTMLButtonElement", "value").set
    else
      ## is an options element
      descriptor("HTMLOptionElement", "value").set

_getSelectionStart = ->
  switch
    when isInput(this)
      descriptor('HTMLInputElement', 'selectionStart').get
    when isTextarea(this)
      descriptor('HTMLTextAreaElement', 'selectionStart').get

_getSelectionEnd = ->
  switch
    when isInput(this)
      descriptor('HTMLInputElement', 'selectionEnd').get
    when isTextarea(this)
      descriptor('HTMLTextAreaElement', 'selectionEnd').get

_nativeFocus = ->
  switch
    when $window.isWindow(this)
      window.focus
    when isSvg(this)
      window.SVGElement.prototype.focus
    else
      window.HTMLElement.prototype.focus

_nativeBlur = ->
  switch
    when $window.isWindow(this)
      window.blur
    when isSvg(this)
      window.SVGElement.prototype.blur
    else
      window.HTMLElement.prototype.blur

_nativeSetSelectionRange = ->
  switch
    when isInput(this)
      window.HTMLInputElement.prototype.setSelectionRange
    else
      ## is textarea
      window.HTMLTextAreaElement.prototype.setSelectionRange

_nativeSelect = ->
  switch
    when isInput(this)
      window.HTMLInputElement.prototype.select
    else
      ## is textarea
      window.HTMLTextAreaElement.prototype.select

_isContentEditable = ->
  switch
    when isSvg(this)
      false
    else
      descriptor("HTMLElement", "isContentEditable").get

_setType = ->
  switch
    when isInput(this)
      descriptor("HTMLInputElement", "type").set
    when isButton(this)
      descriptor("HTMLButtonElement", "type").set


_getType = ->
  switch
    when isInput(this)
      descriptor("HTMLInputElement", "type").get
    when isButton(this)
      descriptor("HTMLButtonElement", "type").get

nativeGetters = {
  value: _getValue
  isContentEditable: _isContentEditable
  isCollapsed: descriptor("Selection", 'isCollapsed').get
  selectionStart: _getSelectionStart
  selectionEnd: _getSelectionEnd
  type: _getType
  frameElement: Object.getOwnPropertyDescriptor(window, "frameElement").get
  activeElement: descriptor("Document", "activeElement").get
}

nativeSetters = {
  value: _setValue
  type: _setType
}

nativeMethods = {
  addEventListener: window.EventTarget.prototype.addEventListener
  removeEventListener: window.EventTarget.prototype.removeEventListener
  createRange: window.document.createRange
  getSelection: window.document.getSelection
  removeAllRanges: window.Selection.prototype.removeAllRanges
  addRange: window.Selection.prototype.addRange
  execCommand: window.document.execCommand
  getAttribute: window.Element.prototype.getAttribute
  setSelectionRange: _nativeSetSelectionRange
  modify: window.Selection.prototype.modify
  focus: _nativeFocus
  blur: _nativeBlur
  select: _nativeSelect
}

tryCallNativeMethod = ->
  try
    callNativeMethod.apply(null, arguments)
  catch err
    return

callNativeMethod = (obj, fn, args...) ->
  if not nativeFn = nativeMethods[fn]
    fns = _.keys(nativeMethods).join(", ")
    throw new Error("attempted to use a native fn called: #{fn}. Available fns are: #{fns}")

  retFn = nativeFn.apply(obj, args)

  if _.isFunction(retFn)
    retFn = retFn.apply(obj, args)

  return retFn

getNativeProp = (obj, prop) ->
  if not nativeProp = nativeGetters[prop]
    props = _.keys(nativeGetters).join(", ")
    throw new Error("attempted to use a native getter prop called: #{prop}. Available props are: #{props}")

  retProp = nativeProp.call(obj, prop)

  if _.isFunction(retProp)
    ## if we got back another function
    ## then invoke it again
    retProp = retProp.call(obj, prop)

  return retProp

setNativeProp = (obj, prop, val) ->
  if not nativeProp = nativeSetters[prop]
    fns = _.keys(nativeSetters).join(", ")
    throw new Error("attempted to use a native setter prop called: #{fn}. Available props are: #{fns}")

  retProp = nativeProp.call(obj, val)

  if _.isFunction(retProp)
    retProp = retProp.call(obj, val)

  return retProp

isNeedSingleValueChangeInputElement = (el) ->
  if !isInput(el)
    return false

  return inputTypeNeedSingleValueChangeRe.test(el.type)

canSetSelectionRangeElement = (el) ->
  isTextarea(el) or (isInput(el) and canSetSelectionRangeElementRe.test(getNativeProp(el, 'type')))

getTagName = (el) ->
  tagName = el.tagName or ""
  tagName.toLowerCase()

isContentEditable = (el) ->
  ## this property is the tell-all for contenteditable
  ## should be true for elements:
  ##   - with [contenteditable]
  ##   - with document.designMode = 'on'
  getNativeProp(el, "isContentEditable")

isTextarea = (el) ->
  getTagName(el) is 'textarea'

isInput = (el) ->
  getTagName(el) is 'input'

isButton = (el) ->
  getTagName(el) is 'button'

isSelect = (el) ->
  getTagName(el) is 'select'

isOption = (el) ->
  getTagName(el) is 'option'

isBody = (el) ->
  getTagName(el) is 'body'

isSvg = (el) ->
  try
    "ownerSVGElement" of el
  catch
    false

isElement = (obj) ->
  try
    !!(obj and obj[0] and _.isElement(obj[0])) or _.isElement(obj)
  catch
    false

isFocusable = ($el) ->
  $el.is(focusable)

isType = ($el, type) ->
  el = [].concat($jquery.unwrap($el))[0]
  ## NOTE: use DOMElement.type instead of getAttribute('type') since
  ##       <input type="asdf"> will have type="text", and behaves like text type
  (getNativeProp(el, 'type') or "").toLowerCase() is type

isScrollOrAuto = (prop) ->
  prop is "scroll" or prop is "auto"

isAncestor = ($el, $maybeAncestor) ->
  $el.parents().index($maybeAncestor) >= 0

isSelector = ($el, selector) ->
  $el.is(selector)

isDetached = ($el) ->
  not isAttached($el)

isAttached = ($el) ->
  ## if we're being given window
  ## then these are automaticallyed attached
  if $window.isWindow($el)
    ## there is a code path when forcing focus and
    ## blur on the window where this check is necessary.
    return true

  ## if this is a document we can simply check
  ## whether or not it has a defaultView (window).
  ## documents which are part of stale pages
  ## will have this property null'd out
  if $document.isDocument($el)
    return $document.hasActiveWindow($el)

  ## normalize into an array
  els = [].concat($jquery.unwrap($el))

  ## we could be passed an empty array here
  ## which in that case it is not attached
  if els.length is 0
    return false

  ## get the document from the first element
  doc = $document.getDocumentFromElement(els[0])

  ## TODO: i guess its possible each element
  ## is technically bound to a differnet document
  ## but c'mon
  isIn = (el) ->
    $.contains(doc, el)

  ## make sure the document is currently
  ## active (it has a window) and
  ## make sure every single element
  ## is attached to this document
  return $document.hasActiveWindow(doc) and _.every(els, isIn)

isSame = ($el1, $el2) ->
  el1 = $jquery.unwrap($el1)
  el2 = $jquery.unwrap($el2)

  el1 and el2 and _.isEqual(el1, el2)

isTextLike = ($el) ->
  sel = (selector) -> isSelector($el, selector)
  type = (type) -> isType($el, type)

  isContentEditableElement = isContentEditable($el.get(0))

  _.some([
    isContentEditableElement
    sel("textarea")
    sel(":text")
    type("text")
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

## in order to simulate actual user behavior we need to do the following:
## 1. take our element and figure out its center coordinate
## 2. check to figure out the element listed at those coordinates
## 3. if this element is ourself or our descendants, click whatever was returned
## 4. else throw an error because something is covering us up
getFirstFocusableEl = ($el) ->
  return $el if isFocusable($el)

  parent = $el.parent()

  ## if we have no parent then just return
  ## the window since that can receive focus
  if not parent.length
    win = $window.getWindowByElement($el.get(0))

    return $(win)

  getFirstFocusableEl($el.parent())

getFirstFixedOrStickyPositionParent = ($el) ->
  ## return null if we're at body/html
  ## cuz that means nothing has fixed position
  return null if not $el or $el.is("body,html")

  ## if we have fixed position return ourselves
  if fixedOrStickyRe.test($el.css("position"))
    return $el

  ## else recursively continue to walk up the parent node chain
  getFirstFixedOrStickyPositionParent($el.parent())

getFirstStickyPositionParent = ($el) ->
  ## return null if we're at body/html
  ## cuz that means nothing has sticky position
  return null if not $el or $el.is("body,html")

  ## if we have sticky position return ourselves
  if $el.css("position") == "sticky"
    return $el

  ## else recursively continue to walk up the parent node chain
  getFirstStickyPositionParent($el.parent())

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
    if $parent.is("html,body") or $document.isDocument($parent)
      return null

    if isScrollable($parent)
      return $parent

    return search($parent)

  return search($el)

getElements = ($el) ->
  return if not $el?.length

  ## unroll the jquery object
  els = $jquery.unwrap($el)

  if els.length is 1
    els[0]
  else
    els

getContainsSelector = (text, filter = "") ->
  escapedText = $utils.escapeQuotes(text)
  "#{filter}:not(script):contains('#{escapedText}'), #{filter}[type='submit'][value~='#{escapedText}']"

priorityElement = "input[type='submit'], button, a, label"

getFirstDeepestElement = (elements, index = 0) ->
  ## iterate through all of the elements in pairs
  ## and check if the next item in the array is a
  ## descedent of the current. if it is continue
  ## to recurse. if not, or there is no next item
  ## then return the current
  $current = elements.slice(index,     index + 1)
  $next    = elements.slice(index + 1, index + 2)

  return $current if not $next

  ## does current contain next?
  if $.contains($current.get(0), $next.get(0))
    getFirstDeepestElement(elements, index + 1)
  else
    ## return the current if it already is a priority element
    return $current if $current.is(priorityElement)

    ## else once we find the first deepest element then return its priority
    ## parent if it has one and it exists in the elements chain
    $priorities = elements.filter $current.parents(priorityElement)
    if $priorities.length then $priorities.last() else $current

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
  $el = $jquery.wrap(el)

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
  isElement

  isSelector

  isScrollOrAuto

  isFocusable

  isAttached

  isDetached

  isAncestor

  isScrollable

  isTextLike

  isDescendent

  isContentEditable

  isSame

  isBody

  isInput

  isTextarea

  isType

  isNeedSingleValueChangeInputElement

  canSetSelectionRangeElement

  stringify

  getNativeProp

  setNativeProp

  callNativeMethod

  tryCallNativeMethod

  getElements

  getFirstFocusableEl

  getContainsSelector

  getFirstDeepestElement

  getFirstFixedOrStickyPositionParent

  getFirstStickyPositionParent

  getFirstScrollableParent
}
