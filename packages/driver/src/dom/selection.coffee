$window = require('./window')
$elements = require('./elements')
$ = require('jquery')

updateValue = (el, key) ->
  if $elements.isContentEditable(el)
    return _insertTextIntoContentEditable(el, key)
  if $elements.isInput(el) or $elements.isTextarea(el)
    {start, end} = getSelectionBounds(el)
    updatedValue = _insertSubstring(el.value, key, [start, end])
    $elements.setValue(el, updatedValue)
    el.setSelectionRange(start + key.length, start + key.length)

_insertTextIntoContentEditable = (el, text) ->
  if text is "\n"
    return _insertNewlineIntoContentEditable(el)
  range = _getSelectionRangeByEl(el)
  debugger
  ## delete anything in the selection
  startNode = range.startContainer
  range.deleteContents()
  if $elements.isElement(startNode)
    newTextNode = document.createTextNode(text)
    if startNode.tagName is 'BR'
      startNode.parentNode.insertBefore(newTextNode, startNode)
      # range.selectNodeContents(startNode)
      # range.deleteContents()
      # newTextNode = document.createTextNode(text)
      # range.insertNode(newTextNode)
      # range.selectNodeContents(newTextNode)
      # range.collapse()
    else if startNode is el
      el.appendNode(newTextNode)
      range.setStart(newTextNode, text.length)
      range.setEnd(newTextNode, text.length)
      # range.selectNodeContents(newTextNode)
      # range.collapse()
    range.setStart(startNode, newNodeOffset)
    range.setEnd(startNode, newNodeOffset)
  # debugger
  else
    debugger
    nodeOffset = range.startOffset
    oldValue = startNode.nodeValue || ''
    updatedValue = _insertSubstring(oldValue, text, [nodeOffset, nodeOffset])
    newNodeOffset = nodeOffset + text.length
    startNode.nodeValue = updatedValue
    # el.normalize()
    range.setStart(startNode, newNodeOffset)
    range.setEnd(startNode, newNodeOffset)
  
  ## update selection
  
  

_insertSubstring = (curText, newText, [start, end]) ->
  curText.substring(0, start) + newText + curText.substring(end)

# setSelectionRange = (el, [start, end]) ->
#   if $elements.isTextarea(el) || $elements.isInput(el)
#     el.setSelectionRange([start, end])
#   if $elements.isContentEditable(el)
#     win = $window.getWindowByElement(el)
#     doc = win.document
#     range = doc.createRange()
#     range.selectNodeContents(el)
#     sel = doc.getSelection()
#     sel.removeAllRanges()
#     sel.addRange(range)

# substituteText = (text, newText, [start, end]) ->
#   curText.substring(0, start) + newText + curText.substring(bounds[1])

getElementText = (el) ->
  if $elements.isInput(el) or $elements.isTextarea(el)
    return $elements.getValue(el)
  if $elements.isContentEditable(el)
    return el.innerText
  throw new Error('Cannot get element text')

clearSelection = (el) ->
  if $elements.isContentEditable(el)
    range = _getSelectionRangeByEl(el)
    return range.deleteContents()
  updateValue(el, "")

setInputSelectionRange = (el, start, end) ->
  if !($elements.isInput(el) or $elements.isTextarea(el))
    throw new Error('isnt input or textarea')

  if $elements.isInputType(el, 'number') or $elements.isInputType(el, 'email')
    elType = el.type
    originalType = elType
    
    el.blur()
    el.type = 'text'
  
    el.setSelectionRange(start, end)

    el.type = originalType
    el.focus()

    return

  el.setSelectionRange(start, end)


deleteRightOfSelection = (el) ->
  if $elements.isTextarea(el) || $elements.isInput(el)
    {start, end} = getSelectionBounds(el)
    setInputSelectionRange(el, start, end + 1)
    return clearSelection(el)
  if $elements.isContentEditable(el)
    range = _getSelectionRangeByEl(el)
    range.setStart(range.startContainer, range.startOffset)
    range.setEnd(range.startContainer, range.startOffset + 1)
    return clearSelection(el)
  return new Error('failed to deleteRight')

deleteLeftOfSelection = (el) ->
  if $elements.isTextarea(el) || $elements.isInput(el)
    {start, end} = getSelectionBounds(el)
    setInputSelectionRange(el, start - 1, end)
    return clearSelection(el)
  if $elements.isContentEditable(el)
    range = _getSelectionRangeByEl(el)
    range.setStart(range.startContainer, range.startOffset - 1)
    range.setEnd(range.startContainer, range.startOffset)
    return clearSelection(el)
  return new Error('failed to deleteLeft')

collapseInputOrTextArea = (el, toIndex) ->
  setInputSelectionRange(el, toIndex, toIndex)


moveCursorLeft = (el) ->
  if $elements.isTextarea(el) || $elements.isInput(el)
    {start, end} = getSelectionBounds(el)
    return collapseInputOrTextArea(el, start) if start isnt end
    return setInputSelectionRange(el, start - 1, end - 1)
  if $elements.isContentEditable(el)
    selection = _getSelectionByEl(el)
    if !selection.isCollapsed
      return selection.collapseToStart()
    selection.modify("move", "backward", "character")

    # range = _getSelectionRangeByEl(el)
    # console.log(range.startOffset)
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
    setInputSelectionRange(el, start + 1, end + 1)
  else if $elements.isContentEditable(el)
    selection = _getSelectionByEl(el)
    if !selection.isCollapsed
      return selection.collapseToEnd()
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
    # if !selection.isCollapsed
    #   return selection.collapseToStart()
    selection.modify("move", "backward", "line")
  else throw new Error('not valid')

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
  else throw new Error('not valid')
  

selectAll = (el) ->
  if $elements.isTextarea(el) || $elements.isInput(el)
    return el.select()
  if $elements.isContentEditable(el)
    range = _getSelectionRangeByEl(el)
    startTextNode = _getFirstTextNode(el.firstChild)
    endTextNode = _getLastTextNode(el.lastChild)
    range.setStart(startTextNode, 0)
    range.setEnd(endTextNode, endTextNode.length)

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
  win = $window.getWindowByElement(el)
  doc = win.document

  if win.getSelection
    ## global selection object
    sel = win.getSelection()
    ## selection has at least one range (most always 1; only 0 at page load)
    if sel.rangeCount
      ## get the first (usually only) range obj
      range = sel.getRangeAt(0)
    
      ## if div[contenteditable] > text
      parentContentEditable = _getParentContentEditable(range.commonAncestorContainer)
      if parentContentEditable is el
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
  win = $window.getWindowByElement(el)
  doc = win.document

  if $elements.isContentEditable(el)
    range = doc.createRange()
    el = _getParentContentEditable(el)
    lastTextNode = _getLastTextNode(el)
    range.setStart(lastTextNode, lastTextNode.length)
    range.setEnd(lastTextNode, lastTextNode.length)
    sel = doc.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)
    return
  if $elements.isInput(el) || $elements.isTextarea(el)
    # el.focus()
    # try
      # el.setSelectionRange(el.value.length, el.value.length)
    setInputSelectionRange(el, el.value.length, el.value.length)
    # catch e
    #   console.log(e)

_getParentContentEditable = (el) ->
  while (el.parentElement && !el.getAttribute?('contenteditable')? )
    el = el.parentElement
  el

_getLastTextNode = (el) ->
  while (el.lastChild)
    el = el.lastChild
  return el

_getFirstTextNode = (el) ->
  while (el.firstChild)
    el = el.firstChild
  return el


getCaretPosition = (el) ->
  bounds = getSelectionBounds(el)
  if !bounds.start?
    ## no selection
    return null
  if bounds.start is bounds.end
    return bounds.start
  return null

_insertNewlineIntoContentEditable = (el) ->
  selection = _getSelectionByEl(el)
  selection.deleteFromDocument()
  selection.modify('extend', 'forward', 'lineboundary')
  range = selection.getRangeAt(0)
  clonedElements = range.cloneContents()
  selection.deleteFromDocument()

  elementToInsertAfter
  if range.startContainer is el
    elementToInsertAfter = _getLastTextNode(el)
  else
    curEl = range.startContainer
    ## make sure we have firstLevel child element from contentEditable
    while (curEl.parentElement && curEl.parentElement isnt el  )
      curEl = curEl.parentElement
    elementToInsertAfter = curEl
  range = _getSelectionRangeByEl(el)

  outerNewElement = '<div></div>'

  ## TODO: In contenteditables, should insert newline element as either <div> or <p> depending on existing nodes
  ##       but this shouldn't really matter that much, so ignore for now
  # if elementToInsertAfter.tagName is 'P'
  #   typeOfNewElement = '<p></p>'

  $newElement = $(outerNewElement).append(clonedElements)
  $newElement.insertAfter(elementToInsertAfter)
  newElement = $newElement.get(0)
  if !newElement.innerHTML
    newElement.innerHTML = '<br>'
  newTextNode = _getFirstTextNode(newElement)
  range.selectNodeContents(newTextNode)
  range.collapse(true)

_getSelectionByEl = (el) ->
  win = $window.getWindowByElement(el)
  win.document.getSelection()

_getSelectionRangeByEl = (el) ->
  sel = _getSelectionByEl(el)
  if sel.rangeCount > 0
    sel.getRangeAt(0)


_contenteditableMoveToEndOfPrevLine = (el) ->
  bounds = _contenteditableGetNodesAround(el)
  if bounds.prev
    range = _getSelectionRangeByEl(el)
    prevTextNode = _getLastTextNode(bounds.prev)
    range.setStart(prevTextNode, prevTextNode.length)
    range.setEnd(prevTextNode, prevTextNode.length)

_contenteditableMoveToStartOfNextLine = (el) ->
  bounds = _contenteditableGetNodesAround(el)
  if bounds.next
    range = _getSelectionRangeByEl(el)
    nextTextNode = _getFirstTextNode(bounds.next)
    range.setStart(nextTextNode, 1)
    range.setEnd(nextTextNode, 1)


_contenteditableGetNodesAround = (el) ->
  range = _getSelectionRangeByEl(el)
  textNode = range.startContainer
  curEl = textNode
  while curEl && !curEl.nextSibling?
    curEl = curEl.parentNode
  nextTextNode = _getFirstTextNode(curEl.nextSibling)
  curEl = textNode
  while curEl && !curEl.previousSibling?
    curEl = curEl.parentNode
  prevTextNode = _getLastTextNode(curEl.previousSibling)
  {
    prev: prevTextNode
    next: nextTextNode
  }
  

module.exports = {
  getSelectionBounds
  deleteRightOfSelection
  deleteLeftOfSelection
  selectAll
  clearSelection
  moveSelectionToEnd
  _contenteditableGetNodesAround
  _contenteditableMoveToEndOfPrevLine
  _contenteditableMoveToStartOfNextLine
  getElementText
  getCaretPosition
  moveCursorLeft
  moveCursorRight
  moveCursorUp
  moveCursorDown
  updateValue
}
