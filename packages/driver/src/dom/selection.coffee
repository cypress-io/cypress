$document = require('./document')
$elements = require('./elements')
$ = require('jquery')

_getSelectionBoundsFromTextarea = (el) ->
  {
    start: el.selectionStart
    end: el.selectionEnd
  }

_getSelectionBoundsFromInput = (el) ->
  elType = el.type
  originalType = elType

  ## HACK:
  ## newer versions of Chrome incorrectly report the selection
  ## for number and email types, so we change it to type=text
  ## and blur it (then set it back and focus it further down
  ## after the selection algorithm has taken place)
  shouldChangeType = originalType is 'email' || originalType is 'number'
  if (shouldChangeType)
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
  # if el.value && !caretPos
  #   caretPos = el.value.length

  if shouldChangeType
    el.type = originalType
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


  ##  legacy APIs below, not needed

    # when doc.selection && doc.selection.createRange
    #   range = doc.selection.createRange()
    #   if range.parentElement() is el
    #     tempEl = doc.createElement("span")
    #     el.insertBefore(tempEl, el.firstChild)
    #     tempRange = range.duplicate()
    #     tempRange.moveToElementText(tempEl)
    #     tempRange.setEndPoint("EndToEnd", range)
        
    #     return tempRange.text.length

_insertTextIntoContentEditable = (el, text) ->
  doc = $document.getDocumentFromElement(el)
  ## NOTE: insertText will also handle '\n', and render newlines
  doc.execCommand('insertText', true, text)
  return
  
  ## equivalent logic is below, using Selection API.

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
  while (el.parentElement && !el.getAttribute?('contenteditable')? )
    el = el.parentElement
  if !el.getAttribute?('contenteditable')?
    throw new Error('Failed to get host contenteditable element in selection')
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

getElementText = (el) ->
  if $elements.isInput(el) or $elements.isTextarea(el)
    return $elements.getValue(el)
  if $elements.isContentEditable(el)
    return el.innerText
  throw new Error('Cannot get element text')

clearSelection = (el) ->
  if $elements.isContentEditable(el)
    doc = $document.getDocumentFromElement(el)
    return doc.execCommand('delete', true, null)
  updateValue(el, "")

setInputSelectionRange = (el, start, end) ->
  if !($elements.isInput(el) or $elements.isTextarea(el))
    throw new Error('isnt input or textarea')

  if $elements.canSetSelectionRangeElement(el)
    return el.setSelectionRange(start, end)
  
  else
    ## NOTE: Some input elements have mobile implementations
    ##       and thus may not always have a cursor, so calling setSelectionRange will throw.
    ##       we are assuming desktop here, so we cast to type='text', and get the cursor from there.
    elType = el.type
    originalType = elType
    # el.blur()
    el.type = 'text'
    el.setSelectionRange(start, end)
    el.type = originalType
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
    return
  return new Error('failed to deleteRight')

deleteLeftOfSelection = (el) ->
  if $elements.isTextarea(el) || $elements.isInput(el)
    {start, end} = getSelectionBounds(el)
    setInputSelectionRange(el, start - 1, end)
    return clearSelection(el)
  if $elements.isContentEditable(el)
    ## there is no 'backwardDelete' command for execCommand, so we use the Selection API
    doc = $document.getDocumentFromElement(el)
    selection = _getSelectionByEl(el)
    if selection.isCollapsed
      selection.modify('extend', 'backward', 'character')
    return clearSelection(el)

  return new Error('failed to deleteLeft')

collapseInputOrTextArea = (el, toIndex) ->
  setInputSelectionRange(el, toIndex, toIndex)

moveCursorLeft = (el) ->
  if $elements.isTextarea(el) || $elements.isInput(el)
    {start, end} = getSelectionBounds(el)
    return collapseInputOrTextArea(el, start) if start isnt end
    return if start is 0
    return setInputSelectionRange(el, start - 1, start - 1)
  if $elements.isContentEditable(el)
    selection = _getSelectionByEl(el)
    # if !selection.isCollapsed
    #   selection.collapseToStart()
    selection.modify("move", "backward", "character")

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
    return collapseInputOrTextArea(el, end) if start isnt end
    ## Don't worry about moving past the end of the string: nothing will happen and there is no error.
    return setInputSelectionRange(el, start + 1, end + 1)
  else if $elements.isContentEditable(el)
    selection = _getSelectionByEl(el)
    # if !selection.isCollapsed
    #   return selection.collapseToEnd()
    selection.modify("move", "forward", "character")
    # if range.startOffset >= (range.startContainer.length or 0)
    #   return _contenteditableMoveToStartOfNextLine(el)
    # newOffset = range.startOffset + 1
    # range.setStart(range.startContainer, newOffset)
    # range.setEnd(range.startContainer, newOffset)
  else throw new Error('not valid')

moveCursorUp = (el) ->
  if $elements.isInput(el)
    ## we can't move up/down in an Input
    el.stepUp?()
    return
  if $elements.isTextarea(el) || $elements.isContentEditable(el)
    selection = _getSelectionByEl(el)
    ## No need to collapse selection, modify will do that for us
    selection.modify("move", "backward", "line")

  # else throw new Error('not valid')

moveCursorDown = (el) ->
  if $elements.isInput(el)
    ## we can't move up/down in an Input
    el.stepDown?()
    return
  if $elements.isTextarea(el) || $elements.isContentEditable(el)
    selection = _getSelectionByEl(el)
    # if !selection.isCollapsed
    #   return selection.collapseToStart()
    selection.modify("move", "forward", "line")

  # else throw new Error('not valid')
  
selectAll = (el) ->
  if $elements.isTextarea(el) || $elements.isInput(el)
    return el.select()
  if $elements.isContentEditable(el)
    doc = $document.getDocumentFromElement(el)
    doc.execCommand('selectAll', true, null)
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
    setInputSelectionRange(el, el.value.length, el.value.length)

  else if $elements.isContentEditable(el)
    ## NOTE: can't use execCommand API here because we would have to selectAll and then collapse
    ##       so we use the Selection API
    doc = $document.getDocumentFromElement(el)
    range = doc.createRange()
    hostContenteditable = _getHostContenteditable(el)
    lastTextNode = _getInnerLastChild(hostContenteditable)
    if lastTextNode.tagName is 'BR'
      lastTextNode = lastTextNode.parentNode
    range.setStart(lastTextNode, lastTextNode.length)
    range.setEnd(lastTextNode, lastTextNode.length)
    sel = doc.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)

updateValue = (el, key) ->
  if $elements.isContentEditable(el)
    return _insertTextIntoContentEditable(el, key)
  if $elements.isInput(el) or $elements.isTextarea(el)
    {start, end} = getSelectionBounds(el)
    updatedValue = _insertSubstring(el.value, key, [start, end])
    $elements.setValue(el, updatedValue)
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
  # _contenteditableGetNodesAround
  # _contenteditableMoveToEndOfPrevLine
  # _contenteditableMoveToStartOfNextLine
  getElementText
  getCaretPosition
  moveCursorLeft
  moveCursorRight
  moveCursorUp
  moveCursorDown
  updateValue
}
