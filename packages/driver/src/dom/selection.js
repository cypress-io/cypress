// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const $document = require('./document')
const $elements = require('./elements')

const INTERNAL_STATE = '__Cypress_state__'

const _getSelectionBoundsFromTextarea = (el) => {
  return {
    start: $elements.getNativeProp(el, 'selectionStart'),
    end: $elements.getNativeProp(el, 'selectionEnd'),
  }
}

const _getSelectionBoundsFromInput = function (el) {
  if ($elements.canSetSelectionRangeElement(el)) {
    return {
      start: $elements.getNativeProp(el, 'selectionStart'),
      end: $elements.getNativeProp(el, 'selectionEnd'),
    }
  }

  const internalState = el[INTERNAL_STATE]

  if (internalState) {
    return {
      start: internalState.start,
      end: internalState.end,
    }
  }

  return {
    start: 0,
    end: 0,
  }
}

const _getSelectionBoundsFromContentEditable = function (el) {
  const doc = $document.getDocumentFromElement(el)

  if (doc.getSelection) {
    //# global selection object
    const sel = doc.getSelection()

    //# selection has at least one range (most always 1; only 0 at page load)
    if (sel.rangeCount) {
      //# get the first (usually only) range obj
      const range = sel.getRangeAt(0)

      //# if div[contenteditable] > text
      const hostContenteditable = _getHostContenteditable(range.commonAncestorContainer)

      if (hostContenteditable === el) {
        return {
          start: range.startOffset,
          end: range.endOffset,
        }
      }
    }
  }

  return {
    start: null,
    end: null,
  }
}

//# TODO get ACTUAL caret position in contenteditable, not line

const _replaceSelectionContentsContentEditable = function (el, text) {
  const doc = $document.getDocumentFromElement(el)

  //# NOTE: insertText will also handle '\n', and render newlines
  $elements.callNativeMethod(doc, 'execCommand', 'insertText', true, text)
}

//# Keeping around native implementation
//# for same reasons as listed below
//#
// if text is "\n"
//   return _insertNewlineIntoContentEditable(el)
// doc = $document.getDocumentFromElement(el)
// range = _getSelectionRangeByEl(el)
// ## delete anything in the selection
// startNode = range.startContainer
// range.deleteContents()
// newTextNode
// if text is ' '
//   newTextNode = doc.createElement('p')
// else
//   newTextNode = doc.createTextNode(text)
// if $elements.isElement(startNode)
//   if startNode.firstChild?.tagName is "BR"
//     range.selectNode(startNode.firstChild)
//     range.deleteContents()
//   ## else startNode is el, so just insert the node
//   startNode.appendChild(newTextNode)
//   if text is ' '
//     newTextNode.outerHTML = '&nbsp;'
//   range.selectNodeContents(startNode.lastChild)
//   range.collapse()
//   return
// else
//   # nodeOffset = range.startOffset
//   # oldValue = startNode.nodeValue || ""
//   range.insertNode(newTextNode)
//   range.selectNodeContents(newTextNode)
//   range.collapse()
//   if text is ' '
//     newTextNode.outerHTML = '&nbsp;'
//   # updatedValue = _insertSubstring(oldValue, text, [nodeOffset, nodeOffset])
//   # newNodeOffset = nodeOffset + text.length
//   # startNode.nodeValue = updatedValue
//   el.normalize()

const _insertSubstring = (curText, newText, [start, end]) => {
  return curText.substring(0, start) + newText + curText.substring(end)
}

const _getHostContenteditable = function (el) {
  let curEl = el

  while (curEl.parentElement && !$elements.tryCallNativeMethod(curEl, 'getAttribute', 'contenteditable')) {
    curEl = curEl.parentElement
  }

  //# if there's no host contenteditable, we must be in designmode
  //# so act as if the original element is the host contenteditable
  //# TODO: remove this when we no longer click before type and move
  //# cursor to the end
  if (!$elements.callNativeMethod(curEl, 'getAttribute', 'contenteditable')) {
    return el
  }

  return curEl
}

const _getInnerLastChild = function (el) {
  while (el.lastChild) {
    el = el.lastChild
  }

  return el
}

const _getSelectionByEl = function (el) {
  const doc = $document.getDocumentFromElement(el)

  return doc.getSelection()
}

const deleteSelectionContents = function (el) {
  if ($elements.isContentEditable(el)) {
    const doc = $document.getDocumentFromElement(el)

    $elements.callNativeMethod(doc, 'execCommand', 'delete', false, null)

    return
  }

  //# for input and textarea, update selected text with empty string
  return replaceSelectionContents(el, '')
}

const setSelectionRange = function (el, start, end) {

  if ($elements.canSetSelectionRangeElement(el)) {
    $elements.callNativeMethod(el, 'setSelectionRange', start, end)

    return
  }

  //# NOTE: Some input elements have mobile implementations
  //# and thus may not always have a cursor, so calling setSelectionRange will throw.
  //# we are assuming desktop here, so we store our own internal state.

  el[INTERNAL_STATE] = {
    start,
    end,
  }

}

const deleteRightOfCursor = function (el) {
  if ($elements.isTextarea(el) || $elements.isInput(el)) {
    const { start, end } = getSelectionBounds(el)

    if (start === $elements.getNativeProp(el, 'value').length) {
      //# nothing to delete, nothing to right of selection
      return false
    }

    setSelectionRange(el, start, end + 1)
    deleteSelectionContents(el)

    //# successful delete
    return true
  }

  if ($elements.isContentEditable(el)) {
    const selection = _getSelectionByEl(el)

    $elements.callNativeMethod(selection, 'modify', 'extend', 'forward', 'character')

    if ($elements.getNativeProp(selection, 'isCollapsed')) {
      //# there's nothing to delete
      return false
    }

    deleteSelectionContents(el)

    //# successful delete
    return true
  }
}

const deleteLeftOfCursor = function (el) {
  if ($elements.isTextarea(el) || $elements.isInput(el)) {
    const { start, end } = getSelectionBounds(el)

    if (start === 0) {
      //# there's nothing to delete, nothing before cursor
      return false
    }

    setSelectionRange(el, start - 1, end)
    deleteSelectionContents(el)

    //# successful delete
    return true
  }

  if ($elements.isContentEditable(el)) {
    //# there is no 'backwardDelete' command for execCommand, so use the Selection API
    const selection = _getSelectionByEl(el)

    $elements.callNativeMethod(selection, 'modify', 'extend', 'backward', 'character')

    if (selection.isCollapsed) {
      //# there's nothing to delete
      //# since extending the selection didn't do anything
      return false
    }

    deleteSelectionContents(el)

    //# successful delete
    return true
  }
}

const _collapseInputOrTextArea = (el, toIndex) => {
  return setSelectionRange(el, toIndex, toIndex)
}

const moveCursorLeft = function (el) {
  if ($elements.isTextarea(el) || $elements.isInput(el)) {
    const { start, end } = getSelectionBounds(el)

    if (start !== end) {
      return _collapseInputOrTextArea(el, start)
    }

    if (start === 0) {
      return
    }

    return setSelectionRange(el, start - 1, start - 1)
  }

  if ($elements.isContentEditable(el)) {
    const selection = _getSelectionByEl(el)

    return $elements.callNativeMethod(selection, 'modify', 'move', 'backward', 'character')
  }
}

// const _getSelectionRangeByEl = function (el) {
//   const sel = _getSelectionByEl(el)

//   if (sel.rangeCount > 0) {
//     return sel.getRangeAt(0)
//   }

//   throw new Error('No selection in document')
// }

//# Keeping around native implementation
//# for same reasons as listed below
//#
// range = _getSelectionRangeByEl(el)
// if !range.collapsed
//   return range.collapse(true)
// if range.startOffset is 0
//   return _contenteditableMoveToEndOfPrevLine(el)
// newOffset = range.startOffset - 1
// range.setStart(range.startContainer, newOffset)
// range.setEnd(range.startContainer, newOffset)

const moveCursorRight = function (el) {
  if ($elements.isTextarea(el) || $elements.isInput(el)) {
    const { start, end } = getSelectionBounds(el)

    if (start !== end) {
      return _collapseInputOrTextArea(el, end)
    }

    //# Don't worry about moving past the end of the string
    //# nothing will happen and there is no error.
    return setSelectionRange(el, start + 1, end + 1)
  }

  if ($elements.isContentEditable(el)) {
    const selection = _getSelectionByEl(el)

    return $elements.callNativeMethod(selection, 'modify', 'move', 'forward', 'character')
  }
}

const moveCursorUp = (el) => {
  return _moveCursorUpOrDown(el, true)
}

const moveCursorDown = (el) => {
  return _moveCursorUpOrDown(el, false)
}

const _moveCursorUpOrDown = function (el, up) {
  if ($elements.isInput(el)) {
  //# on an input, instead of moving the cursor
  //# we want to perform the native browser action
  //# which is to increment the step/interval
    if ($elements.isType(el, 'number')) {
      if (up) {
        if (typeof el.stepUp === 'function') {
          el.stepUp()
        }
      } else {
        if (typeof el.stepDown === 'function') {
          el.stepDown()
        }
      }
    }

    return
  }

  if ($elements.isTextarea(el) || $elements.isContentEditable(el)) {
    const selection = _getSelectionByEl(el)

    return $elements.callNativeMethod(selection, 'modify',
      'move',
      up ? 'backward' : 'forward',
      'line'
    )
  }
}

const moveCursorToLineStart = (el) => {
  return _moveCursorToLineStartOrEnd(el, true)
}

const moveCursorToLineEnd = (el) => {
  return _moveCursorToLineStartOrEnd(el, false)
}

const _moveCursorToLineStartOrEnd = function (el, toStart) {
  if ($elements.isContentEditable(el) || $elements.isInput(el) || $elements.isTextarea(el)) {
    const selection = _getSelectionByEl(el)

    // the selection.modify API is non-standard, may work differently in other browsers, and is not in IE11.
    // https://developer.mozilla.org/en-US/docs/Web/API/Selection/modify
    return $elements.callNativeMethod(selection, 'modify', 'move', toStart ? 'backward' : 'forward', 'lineboundary')
  }
}

const isCollapsed = function (el) {
  if ($elements.isTextarea(el) || $elements.isInput(el)) {
    const { start, end } = getSelectionBounds(el)

    return start === end
  }

  if ($elements.isContentEditable(el)) {
    const selection = _getSelectionByEl(el)

    return selection.isCollapsed
  }
}

const selectAll = function (el) {
  if ($elements.isTextarea(el) || $elements.isInput(el)) {
    setSelectionRange(el, 0, $elements.getNativeProp(el, 'value').length)

    return
  }

  if ($elements.isContentEditable(el)) {
    const doc = $document.getDocumentFromElement(el)

    return $elements.callNativeMethod(doc, 'execCommand', 'selectAll', false, null)
  }
}
//# Keeping around native implementation
//# for same reasons as listed below
//#
// range = _getSelectionRangeByEl(el)
// range.selectNodeContents(el)
// range.deleteContents()
// return
// startTextNode = _getFirstTextNode(el.firstChild)
// endTextNode = _getInnerLastChild(el.lastChild)
// range.setStart(startTextNode, 0)
// range.setEnd(endTextNode, endTextNode.length)

const getSelectionBounds = function (el) {
  //# this function works for input, textareas, and contentEditables
  switch (false) {
    case !$elements.isInput(el):
      return _getSelectionBoundsFromInput(el)
    case !$elements.isTextarea(el):
      return _getSelectionBoundsFromTextarea(el)
    case !$elements.isContentEditable(el):
      return _getSelectionBoundsFromContentEditable(el)
    default:
      return {
        start: null,
        end: null,
      }
  }
}

const moveSelectionToEnd = function (el) {
  let length

  if ($elements.isInput(el) || $elements.isTextarea(el)) {
    ({ length } = $elements.getNativeProp(el, 'value'))

    return setSelectionRange(el, length, length)

  }

  if ($elements.isContentEditable(el)) {
    //# NOTE: can't use execCommand API here because we would have
    //# to selectAll and then collapse so we use the Selection API
    const doc = $document.getDocumentFromElement(el)
    const range = $elements.callNativeMethod(doc, 'createRange')
    const hostContenteditable = _getHostContenteditable(el)
    let lastTextNode = _getInnerLastChild(hostContenteditable)

    if (lastTextNode.tagName === 'BR') {
      lastTextNode = lastTextNode.parentNode
    }

    range.setStart(lastTextNode, lastTextNode.length)
    range.setEnd(lastTextNode, lastTextNode.length)

    const sel = $elements.callNativeMethod(doc, 'getSelection')

    $elements.callNativeMethod(sel, 'removeAllRanges')

    return $elements.callNativeMethod(sel, 'addRange', range)
  }
}

//# TODO: think about renaming this
const replaceSelectionContents = function (el, key) {
  if ($elements.isContentEditable(el)) {
    return _replaceSelectionContentsContentEditable(el, key)
  }

  if ($elements.isInput(el) || $elements.isTextarea(el)) {
    const { start, end } = getSelectionBounds(el)

    const value = $elements.getNativeProp(el, 'value') || ''
    const updatedValue = _insertSubstring(value, key, [start, end])

    $elements.setNativeProp(el, 'value', updatedValue)

    return setSelectionRange(el, start + key.length, start + key.length)
  }
}

const getCaretPosition = function (el) {
  const bounds = getSelectionBounds(el)

  if ((bounds.start == null)) {
    //# no selection
    return null
  }

  if (bounds.start === bounds.end) {
    return bounds.start
  }

  return null
}

const interceptSelect = function () {
  if ($elements.isInput(this) && !$elements.canSetSelectionRangeElement(this)) {
    setSelectionRange(this, 0, $elements.getNativeProp(this, 'value').length)
  }

  return $elements.callNativeMethod(this, 'select')
}

//# Selection API implementation of insert newline.
//# Worth keeping around if we ever have to insert native
//# newlines if we are trying to support a browser or
//# environment without the document.execCommand('insertText', etc...)
//#
// _insertNewlineIntoContentEditable = (el) ->
//   selection = _getSelectionByEl(el)
//   selection.deleteFromDocument()
//   $elements.callNativeMethod(selection, "modify", "extend", "forward", "lineboundary")
//   range = selection.getRangeAt(0)
//   clonedElements = range.cloneContents()
//   selection.deleteFromDocument()
//   elementToInsertAfter
//   if range.startContainer is el
//     elementToInsertAfter = _getInnerLastChild(el)
//   else
//     curEl = range.startContainer
//     ## make sure we have firstLevel child element from contentEditable
//     while (curEl.parentElement && curEl.parentElement isnt el  )
//       curEl = curEl.parentElement
//     elementToInsertAfter = curEl
//   range = _getSelectionRangeByEl(el)
//   outerNewElement = '<div></div>'
//   ## TODO: In contenteditables, should insert newline element as either <div> or <p> depending on existing nodes
//   ##       but this shouldn't really matter that much, so ignore for now
//   # if elementToInsertAfter.tagName is 'P'
//   #   typeOfNewElement = '<p></p>'
//   $newElement = $(outerNewElement).append(clonedElements)
//   $newElement.insertAfter(elementToInsertAfter)
//   newElement = $newElement.get(0)
//   if !newElement.innerHTML
//     newElement.innerHTML = '<br>'
//     range.selectNodeContents(newElement)
//   else
//     newTextNode = _getFirstTextNode(newElement)
//     range.selectNodeContents(newTextNode)
//   range.collapse(true)

// _contenteditableMoveToEndOfPrevLine = (el) ->
//   bounds = _contenteditableGetNodesAround(el)
//   if bounds.prev
//     range = _getSelectionRangeByEl(el)
//     prevTextNode = _getInnerLastChild(bounds.prev)
//     range.setStart(prevTextNode, prevTextNode.length)
//     range.setEnd(prevTextNode, prevTextNode.length)

// _contenteditableMoveToStartOfNextLine = (el) ->
//   bounds = _contenteditableGetNodesAround(el)
//   if bounds.next
//     range = _getSelectionRangeByEl(el)
//     nextTextNode = _getFirstTextNode(bounds.next)
//     range.setStart(nextTextNode, 1)
//     range.setEnd(nextTextNode, 1)

// _contenteditableGetNodesAround = (el) ->
//   range = _getSelectionRangeByEl(el)
//   textNode = range.startContainer
//   curEl = textNode
//   while curEl && !curEl.nextSibling?
//     curEl = curEl.parentNode
//   nextTextNode = _getFirstTextNode(curEl.nextSibling)
//   curEl = textNode
//   while curEl && !curEl.previousSibling?
//     curEl = curEl.parentNode
//   prevTextNode = _getInnerLastChild(curEl.previousSibling)
//   {
//     prev: prevTextNode
//     next: nextTextNode
//   }

// _getFirstTextNode = (el) ->
//   while (el.firstChild)
//     el = el.firstChild
//   return el

module.exports = {
  getSelectionBounds,
  deleteRightOfCursor,
  deleteLeftOfCursor,
  selectAll,
  deleteSelectionContents,
  moveSelectionToEnd,
  getCaretPosition,
  moveCursorLeft,
  moveCursorRight,
  moveCursorUp,
  moveCursorDown,
  moveCursorToLineStart,
  moveCursorToLineEnd,
  replaceSelectionContents,
  isCollapsed,
  interceptSelect,
}
