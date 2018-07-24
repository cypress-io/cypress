$document = require('./document')
$elements = require('./elements')
$ = require('jquery')

_getSelectionBoundsFromTextarea = (el) ->
  {
    start: $elements.getNativeProp(el, 'selectionStart')
    end: $elements.getNativeProp(el, 'selectionEnd')
  }

_getSelectionBoundsFromInput = (el) ->
  if $elements.canSetSelectionRangeElement(el)
    return {
      start: $elements.getNativeProp(el, 'selectionStart')
      end: $elements.getNativeProp(el, 'selectionEnd')
    }
  ## HACK:
  ## newer versions of Chrome incorrectly report the selection
  ## for number and email types, so we change it to type=text
  ## and blur it (then set it back and focus it further down
  ## after the selection algorithm has taken place)

  type = $elements.getNativeProp(el, 'type')

  $elements.tryCallNativeMethod(el, 'blur')
  
  $elements.setNativeProp(el, 'type', 'text')

  bounds = {
    start: $elements.getNativeProp(el, 'selectionStart')
    end: $elements.getNativeProp(el, 'selectionEnd')
  }

  ## HACK:
  ## selection start and end don't report correctly when input
  ## already has a value set, so if there's a value and there is no
  ## native selection, force it to be at the end of the text

  $elements.setNativeProp(el, 'type', type)
  $elements.callNativeMethod(el, 'focus')

  return bounds

_getSelectionBoundsFromContentEditable = (el) ->
  doc = $document.getDocumentFromElement(el)

  if doc.getSelection
    ## global selection object
    sel = doc.getSelection()
    ## selection has at least one range (most always 1; only 0 at page load)
    if sel.rangeCount
      ## get the first (usually only) range obj
      range = sel.getRangeAt(0)

      ## if div[contenteditable] > text
      hostContenteditable = _getHostContenteditable(range.commonAncestorContainer)
      if hostContenteditable is el
        return {
          start: range.startOffset
          end: range.endOffset
        }

  return {
    start: null
    end: null
  }

  ## TODO get ACTUAL caret position in contenteditable, not line

_replaceSelectionContentsContentEditable = (el, text) ->
  doc = $document.getDocumentFromElement(el)
  ## NOTE: insertText will also handle '\n', and render newlines
  $elements.callNativeMethod(doc, "execCommand", 'insertText', true, text)
  return

  ## Keeping around native implementation
  ## for same reasons as listed below
  ##
  # if text is "\n"
  #   return _insertNewlineIntoContentEditable(el)
  # doc = $document.getDocumentFromElement(el)
  # range = _getSelectionRangeByEl(el)
  # ## delete anything in the selection
  # startNode = range.startContainer
  # range.deleteContents()
  # newTextNode
  # if text is ' '
  #   newTextNode = doc.createElement('p')
  # else
  #   newTextNode = doc.createTextNode(text)
  # if $elements.isElement(startNode)
  #   if startNode.firstChild?.tagName is 'BR'
  #     range.selectNode(startNode.firstChild)
  #     range.deleteContents()
  #   ## else startNode is el, so just insert the node
  #   startNode.appendChild(newTextNode)
  #   if text is ' '
  #     newTextNode.outerHTML = '&nbsp;'
  #   range.selectNodeContents(startNode.lastChild)
  #   range.collapse()
  #   return
  # else
  #   # nodeOffset = range.startOffset
  #   # oldValue = startNode.nodeValue || ''
  #   range.insertNode(newTextNode)
  #   range.selectNodeContents(newTextNode)
  #   range.collapse()
  #   if text is ' '
  #     newTextNode.outerHTML = '&nbsp;'
  #   # updatedValue = _insertSubstring(oldValue, text, [nodeOffset, nodeOffset])
  #   # newNodeOffset = nodeOffset + text.length
  #   # startNode.nodeValue = updatedValue
  #   el.normalize()

_insertSubstring = (curText, newText, [start, end]) ->
  curText.substring(0, start) + newText + curText.substring(end)

_getHostContenteditable = (el) ->
  curEl = el
  while curEl.parentElement && !$elements.tryCallNativeMethod(curEl, "getAttribute", "contenteditable")
    curEl = curEl.parentElement
  ## if there's no host contenteditable, we must be in designmode
  ## so act as if the original element is the host contenteditable
  ## TODO: remove this when we no longer click before type and move 
  ## cursor to the end
  if !$elements.callNativeMethod(curEl, "getAttribute", "contenteditable")
    return el
  return curEl

_getInnerLastChild = (el) ->
  while (el.lastChild)
    el = el.lastChild
  return el

_getSelectionByEl = (el) ->
  doc = $document.getDocumentFromElement(el)
  doc.getSelection()

_getSelectionRangeByEl = (el) ->
  sel = _getSelectionByEl(el)
  if sel.rangeCount > 0
    sel.getRangeAt(0)
  else throw new Error('No selection in document')

deleteSelectionContents = (el) ->
  if $elements.isContentEditable(el)
    doc = $document.getDocumentFromElement(el)
    
    # return doc.execCommand('delete', true, null)
    $elements.callNativeMethod(doc, "execCommand", 'delete', true, null)
    return

  ## for input and textarea, update selected text with empty string
  replaceSelectionContents(el, "")

setSelectionRange = (el, start, end) ->
  if $elements.isTextarea(el) || $elements.canSetSelectionRangeElement(el)
    $elements.callNativeMethod(el, "setSelectionRange", start, end)
    return
  ## NOTE: Some input elements have mobile implementations
  ## and thus may not always have a cursor, so calling setSelectionRange will throw.
  ## we are assuming desktop here, so we cast to type='text', and get the cursor from there.
  type = $elements.getNativeProp(el, 'type')
  $elements.callNativeMethod(el, 'blur')
  $elements.setNativeProp(el, 'type', 'text')
  $elements.callNativeMethod(el, "setSelectionRange", start, end)
  $elements.setNativeProp(el, 'type', type)
  ## changing the type will lose focus, so focus again
  $elements.callNativeMethod(el, "focus")


deleteRightOfCursor = (el) ->
  if $elements.isTextarea(el) || $elements.isInput(el)
    {start, end} = getSelectionBounds(el)

    if start is $elements.getNativeProp(el, "value").length
      ## nothing to delete, nothing to right of selection
      return false

    setSelectionRange(el, start, end + 1)
    deleteSelectionContents(el)
    ## successful delete
    return true

  if $elements.isContentEditable(el)
    selection = _getSelectionByEl(el)
    $elements.callNativeMethod(selection, "modify", 'extend', 'forward', 'character')

    if $elements.getNativeProp(selection, 'isCollapsed')
      ## there's nothing to delete
      return false

    deleteSelectionContents(el)
    ## successful delete
    return true

deleteLeftOfCursor = (el) ->
  if $elements.isTextarea(el) || $elements.isInput(el)
    {start, end} = getSelectionBounds(el)

    if start is 0
      ## there's nothing to delete, nothing before cursor
      return false

    setSelectionRange(el, start - 1, end)
    deleteSelectionContents(el)
    ## successful delete
    return true

  if $elements.isContentEditable(el)
    ## there is no 'backwardDelete' command for execCommand, so use the Selection API
    selection = _getSelectionByEl(el)
    $elements.callNativeMethod(selection, 'modify', 'extend', 'backward', 'character')

    if selection.isCollapsed
      ## there's nothing to delete
      ## since extending the selection didn't do anything
      return false

    deleteSelectionContents(el)
    ## successful delete
    return true

_collapseInputOrTextArea = (el, toIndex) ->
  setSelectionRange(el, toIndex, toIndex)

moveCursorLeft = (el) ->
  if $elements.isTextarea(el) || $elements.isInput(el)
    {start, end} = getSelectionBounds(el)

    if start isnt end
      return _collapseInputOrTextArea(el, start)

    if start is 0
      return

    return setSelectionRange(el, start - 1, start - 1)

  if $elements.isContentEditable(el)
    selection = _getSelectionByEl(el)
    $elements.callNativeMethod(selection, "modify", "move", "backward", "character")

    ## Keeping around native implementation
    ## for same reasons as listed below
    ##
    # range = _getSelectionRangeByEl(el)
    # if !range.collapsed
    #   return range.collapse(true)
    # if range.startOffset is 0
    #   return _contenteditableMoveToEndOfPrevLine(el)
    # newOffset = range.startOffset - 1
    # range.setStart(range.startContainer, newOffset)
    # range.setEnd(range.startContainer, newOffset)

moveCursorRight = (el) ->
  if $elements.isTextarea(el) || $elements.isInput(el)
    {start, end} = getSelectionBounds(el)
    if start isnt end
      return _collapseInputOrTextArea(el, end)

    ## Don't worry about moving past the end of the string
    ## nothing will happen and there is no error.
    return setSelectionRange(el, start + 1, end + 1)

  if $elements.isContentEditable(el)
    selection = _getSelectionByEl(el)
    $elements.callNativeMethod(selection, "modify", "move", "forward", "character")

moveCursorUp = (el) ->
  _moveCursorUpOrDown(el, true)

moveCursorDown = (el) ->
  _moveCursorUpOrDown(el, false)

_moveCursorUpOrDown = (el, up) ->
  if $elements.isInput(el)
  ## on an input, instead of moving the cursor
  ## we want to perform the native browser action
  ## which is to increment the step/interval
    if $elements.isInputType(el, 'number')
      if up then el.stepUp?() else el.stepDown?()
    return

  if $elements.isTextarea(el) || $elements.isContentEditable(el)
    selection = _getSelectionByEl(el)
    $elements.callNativeMethod(selection, "modify", 
      "move"
      if up then "backward" else "forward"
      "line"
    )

isCollapsed = (el) ->
  if $elements.isTextarea(el) || $elements.isInput(el)
    {start, end} = getSelectionBounds(el)
    return start is end

  if $elements.isContentEditable(el)
    selection = _getSelectionByEl(el)
    return selection.isCollapsed

selectAll = (el) ->
  if $elements.isTextarea(el) || $elements.isInput(el)
    return $elements.callNativeMethod(el, 'select')

  if $elements.isContentEditable(el)
    doc = $document.getDocumentFromElement(el)
    ## doc.execCommand('selectAll', true, null)
    $elements.callNativeMethod(doc, 'execCommand', 'selectAll', true, null)
    ## Keeping around native implementation
    ## for same reasons as listed below
    ##
    # range = _getSelectionRangeByEl(el)
    # range.selectNodeContents(el)
    # range.deleteContents()
    # return
    # startTextNode = _getFirstTextNode(el.firstChild)
    # endTextNode = _getInnerLastChild(el.lastChild)
    # range.setStart(startTextNode, 0)
    # range.setEnd(endTextNode, endTextNode.length)

getSelectionBounds = (el) ->
  ## this function works for input, textareas, and contentEditables
  switch
    when $elements.isInput(el)
      _getSelectionBoundsFromInput(el)
    when $elements.isTextarea(el)
      _getSelectionBoundsFromTextarea(el)
    when $elements.isContentEditable(el)
      _getSelectionBoundsFromContentEditable(el)
    else
      {
        start: null
        end: null
      }

moveSelectionToEnd = (el) ->
  if $elements.isInput(el) || $elements.isTextarea(el)
    length = $elements.getNativeProp(el, "value").length
    setSelectionRange(el, length, length)

  else if $elements.isContentEditable(el)
    ## NOTE: can't use execCommand API here because we would have
    ## to selectAll and then collapse so we use the Selection API
    doc = $document.getDocumentFromElement(el)
    range = $elements.callNativeMethod(doc, "createRange")
    hostContenteditable = _getHostContenteditable(el)
    lastTextNode = _getInnerLastChild(hostContenteditable)

    if lastTextNode.tagName is 'BR'
      lastTextNode = lastTextNode.parentNode

    range.setStart(lastTextNode, lastTextNode.length)
    range.setEnd(lastTextNode, lastTextNode.length)

    sel = $elements.callNativeMethod(doc, 'getSelection')
    $elements.callNativeMethod(sel, 'removeAllRanges')
    $elements.callNativeMethod(sel, 'addRange', range)

## TODO: think about renaming this
replaceSelectionContents = (el, key) ->
  if $elements.isContentEditable(el)
    return _replaceSelectionContentsContentEditable(el, key)

  if $elements.isInput(el) or $elements.isTextarea(el)
    {start, end} = getSelectionBounds(el)
    value = $elements.getNativeProp(el, "value") or ''
    updatedValue = _insertSubstring(value, key, [start, end])
    $elements.setNativeProp(el, 'value', updatedValue)
    setSelectionRange(el, start + key.length, start + key.length)

getCaretPosition = (el) ->
  bounds = getSelectionBounds(el)
  if !bounds.start?
    ## no selection
    return null
  if bounds.start is bounds.end
    return bounds.start
  return null

## Selection API implementation of insert newline.
## Worth keeping around if we ever have to insert native
## newlines if we are trying to support a browser or
## environment without the document.execCommand('insertText', etc...)
##
# _insertNewlineIntoContentEditable = (el) ->
#   selection = _getSelectionByEl(el)
#   selection.deleteFromDocument()
#   $elements.callNativeMethod(selection, "modify", 'extend', 'forward', 'lineboundary')
#   range = selection.getRangeAt(0)
#   clonedElements = range.cloneContents()
#   selection.deleteFromDocument()
#   elementToInsertAfter
#   if range.startContainer is el
#     elementToInsertAfter = _getInnerLastChild(el)
#   else
#     curEl = range.startContainer
#     ## make sure we have firstLevel child element from contentEditable
#     while (curEl.parentElement && curEl.parentElement isnt el  )
#       curEl = curEl.parentElement
#     elementToInsertAfter = curEl
#   range = _getSelectionRangeByEl(el)
#   outerNewElement = '<div></div>'
#   ## TODO: In contenteditables, should insert newline element as either <div> or <p> depending on existing nodes
#   ##       but this shouldn't really matter that much, so ignore for now
#   # if elementToInsertAfter.tagName is 'P'
#   #   typeOfNewElement = '<p></p>'
#   $newElement = $(outerNewElement).append(clonedElements)
#   $newElement.insertAfter(elementToInsertAfter)
#   newElement = $newElement.get(0)
#   if !newElement.innerHTML
#     newElement.innerHTML = '<br>'
#     range.selectNodeContents(newElement)
#   else
#     newTextNode = _getFirstTextNode(newElement)
#     range.selectNodeContents(newTextNode)
#   range.collapse(true)


# _contenteditableMoveToEndOfPrevLine = (el) ->
#   bounds = _contenteditableGetNodesAround(el)
#   if bounds.prev
#     range = _getSelectionRangeByEl(el)
#     prevTextNode = _getInnerLastChild(bounds.prev)
#     range.setStart(prevTextNode, prevTextNode.length)
#     range.setEnd(prevTextNode, prevTextNode.length)


# _contenteditableMoveToStartOfNextLine = (el) ->
#   bounds = _contenteditableGetNodesAround(el)
#   if bounds.next
#     range = _getSelectionRangeByEl(el)
#     nextTextNode = _getFirstTextNode(bounds.next)
#     range.setStart(nextTextNode, 1)
#     range.setEnd(nextTextNode, 1)


# _contenteditableGetNodesAround = (el) ->
#   range = _getSelectionRangeByEl(el)
#   textNode = range.startContainer
#   curEl = textNode
#   while curEl && !curEl.nextSibling?
#     curEl = curEl.parentNode
#   nextTextNode = _getFirstTextNode(curEl.nextSibling)
#   curEl = textNode
#   while curEl && !curEl.previousSibling?
#     curEl = curEl.parentNode
#   prevTextNode = _getInnerLastChild(curEl.previousSibling)
#   {
#     prev: prevTextNode
#     next: nextTextNode
#   }


# _getFirstTextNode = (el) ->
#   while (el.firstChild)
#     el = el.firstChild
#   return el


module.exports = {
  getSelectionBounds
  deleteRightOfCursor
  deleteLeftOfCursor
  selectAll
  deleteSelectionContents
  moveSelectionToEnd
  getCaretPosition
  moveCursorLeft
  moveCursorRight
  moveCursorUp
  moveCursorDown
  replaceSelectionContents
  isCollapsed
}
