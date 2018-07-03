$window = require('./window')
$elements = require('./elements')
$ = require('jquery')

updateValue = (el, key) ->
  if $elements.isContentEditable(el)
    return _insertTextIntoContentEditable(el, key)
  if $elements.isInput or $elements.isTextarea(el)
    {start, end} = getSelectionBounds(el)
    updatedValue = _insertSubstring(el.value, key, [start, end])
    $elements.setValue(el, updatedValue)

_insertTextIntoContentEditable = (el, text) ->

  if text is "\n"
    return _insertNewlineIntoContentEditable(el)

  range = $window.getWindowByElement(el).document.getSelection().getRangeAt(0)
  newTextNode = document.createTextNode(text)
  
  ## delete anything in the selection
  range.deleteContents()
  range.insertNode(newTextNode)
  el.normalize()
  range.collapse()
  

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

getElementTextLength = (el) ->
  $elements.getValue(el).length
  ## TODO implement for contenteditable


clearSelection = (el) ->
  if $elements.isContentEditable(el)
    doc = $window.getWindowByElement(el).document
    range = doc.getSelection().getRangeAt(0)
    return range.deleteContents()
  updateValue(el, "")


deleteRightOfSelection = (el) ->
  if $elements.isTextarea(el) || $elements.isInput(el)
    el.setSelectionRange(el.selectionStart, el.selectionEnd + 1)
  else if $elements.isContentEditable(el)
    win = $window.getWindowByElement(el)
    range = doc.getSelection().getRangeAt(0)
    range.setStart(range.startContainer, range.startOffset)
    range.setEnd(range.startContainer, range.startOffset + 1)
  else return new Error('asdf')
  clearSelection(el)

deleteLeftOfSelection = (el) ->
  if $elements.isTextarea(el) || $elements.isInput(el)
    el.setSelectionRange(el.selectionStart - 1, el.selectionEnd)
  else if $elements.isContentEditable(el)
    win = $window.getWindowByElement(el)
    range = doc.getSelection().getRangeAt(0)
    range.setStart(range.startContainer, range.startOffset - 1)
    range.setEnd(range.startContainer, range.startOffset)
  else return new Error('asdf')
  clearSelection(el)

moveCursorLeft = (el) ->
  if $elements.isTextarea(el) || $elements.isInput(el)
    el.setSelectionRange(el.selectionStart - 1, el.selectionEnd - 1)
  else if $elements.isContentEditable(el)
    win = $window.getWindowByElement(el)
    range = doc.getSelection().getRangeAt(0)
    if !range.collaped
      return range.collapse(true)
    range.setStart(range.startContainer, range.startOffset - 1)
    range.setEnd(range.startContainer, range.startOffset - 1)
  else throw new Error('Not valid')

moveCursorRight = (el) ->
  if $elements.isTextarea(el) || $elements.isInput(el)
    el.setSelectionRange(el.selectionStart + 1, el.selectionEnd + 1)
  else if $elements.isContentEditable(el)
    win = $window.getWindowByElement(el)
    range = doc.getSelection().getRangeAt(0)
    if !range.collaped
      return range.collapse()
    range.setStart(range.startContainer, range.startOffset + 1)
    range.setEnd(range.startContainer, range.startOffset + 1)
  else throw new Error('not valid')

selectAll = (el) ->
  if $elements.isTextarea(el) || $elements.isInput(el)
    el.select()
  if $elements.isContentEditable(el)
    win = $window.getWindowByElement(el)
    doc = win.document
    range = doc.createRange()
    range.selectNodeContents(el)
    sel = doc.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)

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

  switch
    when win.getSelection
      ## global selection object
      sel = win.getSelection()
      ## selection has at least one range (most always 1; only 0 at page load)
      if sel.rangeCount
        ## get the first (usually only) range obj
        range = sel.getRangeAt(0)
      
        ## if div[contenteditable] > text
        parent = range.commonAncestorContainer.parentNode
        if parent is el || parent?.parentNode? is el
          return {
            start: range.startOffset
            end: range.endOffset
          }
    else null
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
      null

moveSelectionToEnd = (el) ->
  win = $window.getWindowByElement(el)
  doc = win.document

  if $elements.isContentEditable(el)
    range = doc.createRange()
    lastTextNode = _getLastTextNode(el)
    range.setStart(lastTextNode, lastTextNode.length)
    range.setEnd(lastTextNode, lastTextNode.length)
    sel = doc.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)
    return
  if $elements.isInput(el) || $elements.isTextarea(el)
    el.focus()
    try
      el.setSelectionRange(el.value.length, el.value.length)
    catch e
      console.log(e)

_getLastTextNode = (el) ->
  while (el.lastChild)
    el = el.lastChild
  return el


getCaretPosition = (el) ->
  bounds = getSelectionBounds(el)
  if bounds.start is bounds.end
    return bounds.start
  return null

_insertNewlineIntoContentEditable = (el) ->
  range = _getSelectionRangeByEl(el)
  elementToInsertAfter
  if range.startContainer is el
    elementToInsertAfter = _getLastTextNode(el)
  else
    elementToInsertAfter = range.startContainer
  newElement = $('<div><br></div>')
  newElement.insertAfter(elementToInsertAfter)
  range.selectNodeContents(newElement.get(0))

_getSelectionRangeByEl = (el) ->
  win = $window.getWindowByElement(el)
  win.document.getSelection().getRangeAt(0)

module.exports = {
  getSelectionBounds
  deleteRightOfSelection
  deleteLeftOfSelection
  selectAll
  clearSelection
  moveSelectionToEnd
  getElementTextLength
  getCaretPosition
  moveCursorLeft
  moveCursorRight
  updateValue
}
