$document = require('./document')
$elements = require('./elements')
$ = require('jquery')

_getSelectionBoundsFromTextarea = (el) ->
  {
    start: el.selectionStart
    end: el.selectionEnd
  }

_getSelectionBoundsFromInput = (el) ->
  { type } = el

  ## HACK:
  ## newer versions of Chrome incorrectly report the selection
  ## for number and email types, so we change it to type=text
  ## and blur it (then set it back and focus it further down
  ## after the selection algorithm has taken place)
  shouldChangeType = type is 'email' || type is 'number'

  if shouldChangeType
    el.blur()
    el.type = 'text'

  bounds = {
    start: el.selectionStart
    end: el.selectionEnd
  }

  ## HACK:
  ## selection start and end don't report correctly when input
  ## already has a value set, so if there's a value and there is no
  ## native selection, force it to be at the end of the text

  if shouldChangeType
    el.type = type
    el.focus()

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

_updateSelectionValueContentEditable = (el, text) ->
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
  while el.parentElement && !$elements.tryCallNativeMethod(el, "getAttribute", "contenteditable")
    el = el.parentElement

  return el

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

clearSelection = (el) ->
  if $elements.isContentEditable(el)
    doc = $document.getDocumentFromElement(el)
    
    return doc.execCommand('delete', true, null)

  updateSelectionValue(el, "")

setInputSelectionRange = (el, start, end) ->
  if $elements.canSetSelectionRangeElement(el)
    return el.setSelectionRange(start, end)

  ## NOTE: Some input elements have mobile implementations
  ## and thus may not always have a cursor, so calling setSelectionRange will throw.
  ## we are assuming desktop here, so we cast to type='text', and get the cursor from there.
  { type } = el
  el.blur()
  el.type = 'text'
  el.setSelectionRange(start, end)
  el.type = type
  ## changing the type will lose focus, so focus again
  el.focus()

deleteRightOfSelection = (el) ->
  if $elements.isTextarea(el) || $elements.isInput(el)
    {start, end} = getSelectionBounds(el)
    setInputSelectionRange(el, start, end + 1)
    return clearSelection(el)

  if $elements.isContentEditable(el)
    doc = $document.getDocumentFromElement(el)
    ## same as pressing the Delete key
    doc.execCommand('forwardDelete', true, null)

deleteLeftOfSelection = (el) ->
  if $elements.isTextarea(el) || $elements.isInput(el)
    {start, end} = getSelectionBounds(el)
    if start is end
      setInputSelectionRange(el, start - 1, end)
      wasCollapsed = true
    clearSelection(el)
    return collapsed

  if $elements.isContentEditable(el)
    ## there is no 'backwardDelete' command for execCommand, so we use the Selection API
    doc = $document.getDocumentFromElement(el)
    selection = _getSelectionByEl(el)

    if selection.isCollapsed
      selection.modify('extend', 'backward', 'character')

    return clearSelection(el)

collapseInputOrTextArea = (el, toIndex) ->
  setInputSelectionRange(el, toIndex, toIndex)

moveCursorLeft = (el) ->
  if $elements.isTextarea(el) || $elements.isInput(el)
    {start, end} = getSelectionBounds(el)

    if start isnt end
      return collapseInputOrTextArea(el, start)

    if start is 0
      return

    return setInputSelectionRange(el, start - 1, start - 1)

  if $elements.isContentEditable(el)
    selection = _getSelectionByEl(el)
    selection.modify("move", "backward", "character")

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
  else throw new Error('Not valid')

moveCursorRight = (el) ->
  if $elements.isTextarea(el) || $elements.isInput(el)
    {start, end} = getSelectionBounds(el)
    if start isnt end
      return collapseInputOrTextArea(el, end)

    ## Don't worry about moving past the end of the string
    ## nothing will happen and there is no error.
    return setInputSelectionRange(el, start + 1, end + 1)

  if $elements.isContentEditable(el)
    selection = _getSelectionByEl(el)
    selection.modify("move", "forward", "character")

moveCursorUp = (el) ->
  if $elements.isInput(el)
    ## on an input, instead of moving the cursor
    ## we want to perform the native browser action
    ## which is to increment the step/interval
    el.stepUp?()
    return

  if $elements.isTextarea(el) || $elements.isContentEditable(el)
    selection = _getSelectionByEl(el)
    ## No need to collapse selection, modify will do that for us
    selection.modify("move", "backward", "line")

moveCursorDown = (el) ->
  if $elements.isInput(el)
    ## we can't move up/down in an Input
    el.stepDown?()
    return
  if $elements.isTextarea(el) || $elements.isContentEditable(el)
    selection = _getSelectionByEl(el)
    selection.modify("move", "forward", "line")

selectAll = (el) ->
  if $elements.isTextarea(el) || $elements.isInput(el)
    return el.select()

  if $elements.isContentEditable(el)
    doc = $document.getDocumentFromElement(el)
    doc.execCommand('selectAll', true, null)
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
    setInputSelectionRange(el, length, length)

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

    sel = doc.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)

## TODO: think about renaming this
updateSelectionValue = (el, key) ->
  if $elements.isContentEditable(el)
    return _updateSelectionValueContentEditable(el, key)

  if $elements.isInput(el) or $elements.isTextarea(el)
    {start, end} = getSelectionBounds(el)
    value = $elements.getNativeProp(el, "value") or ''
    updatedValue = _insertSubstring(value, key, [start, end])
    $elements.setNativeProp(el, 'value', updatedValue)
    setInputSelectionRange(el, start + key.length, start + key.length)

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
#   selection.modify('extend', 'forward', 'lineboundary')
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
  deleteRightOfSelection
  deleteLeftOfSelection
  selectAll
  clearSelection
  moveSelectionToEnd
  getCaretPosition
  moveCursorLeft
  moveCursorRight
  moveCursorUp
  moveCursorDown
  updateSelectionValue
}
