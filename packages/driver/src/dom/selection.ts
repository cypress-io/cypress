import _ from 'lodash'
import * as $dom from '../dom'
import * as $document from './document'
import * as $elements from './elements'

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

  const doc = $document.getDocumentFromElement(el)
  const range = _getSelectionRange(doc)

  return {
    start: range.startOffset,
    end: range.endOffset,
  }
}

const _getSelectionRange = (doc: Document) => {
  const sel = doc.getSelection()

  // selection has at least one range (most always 1; only 0 at page load)
  if (sel && sel.rangeCount) {
    // get the first (usually only) range obj
    return sel.getRangeAt(0)
  }

  return doc.createRange()
}

const _getSelectionBoundsFromContentEditable = function (el) {
  const doc = $document.getDocumentFromElement(el)
  const range = _getSelectionRange(doc)
  const hostContenteditable = getHostContenteditable(range.commonAncestorContainer)

  if (hostContenteditable === el) {
    return {
      start: range.startOffset,
      end: range.endOffset,
    }
  }

  return {
    start: 0,
    end: 0,
  }
}

// TODO get ACTUAL caret position in contenteditable, not line
const _replaceSelectionContentsWithExecCommand = function (doc, text) {
  // NOTE: insertText will also handle '\n', and render newlines
  return $elements.callNativeMethod(doc, 'execCommand', 'insertText', true, text)
}

// Keeping around native implementation
// for same reasons as listed below
//
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

const _hasContenteditableAttr = (el) => {
  const attr = $elements.tryCallNativeMethod(el, 'getAttribute', 'contenteditable')

  return attr !== undefined && attr !== null && attr !== 'false'
}

const getHostContenteditable = function (el) {
  let curEl = el

  while (curEl.parentElement && !_hasContenteditableAttr(curEl)) {
    curEl = curEl.parentElement
  }

  // if there's no host contenteditable, we must be in designmode
  // so act as if the body element is the host contenteditable
  if (!_hasContenteditableAttr(curEl)) {
    return el.ownerDocument.body
  }

  return curEl
}

/**
 *
 * @param {HTMLElement} el
 * @returns {Selection}
 */
const _getSelectionByEl = function (el) {
  const doc = $document.getDocumentFromElement(el)

  return doc.getSelection()!
}

const deleteSelectionContents = function (el: HTMLElement) {
  if ($elements.isContentEditable(el)) {
    const doc = $document.getDocumentFromElement(el)

    $elements.callNativeMethod(doc, 'execCommand', 'delete', false, null)

    return false
  }

  return replaceSelectionContents(el, '')
}

const setSelectionRange = function (el, start, end) {
  $elements.callNativeMethod(el, 'setSelectionRange', start, end)
}

// Whether or not the selection contains any text
// since Selection.isCollapsed will be true when selection
// is inside non-selectionRange input (e.g. input[type=email])
const isSelectionCollapsed = function (selection: Selection) {
  return !selection.toString()
}

const deleteRightOfCursor = function (el) {
  if ($elements.canSetSelectionRangeElement(el)) {
    const { start, end } = getSelectionBounds(el)

    if (start === end) {
      setSelectionRange(el, start, end + 1)
    }

    return deleteSelectionContents(el)
  }

  const selection = _getSelectionByEl(el)

  if (isSelectionCollapsed(selection)) {
    $elements.callNativeMethod(
      selection,
      'modify',
      'extend',
      'forward',
      'character'
    )
  }

  deleteSelectionContents(el)

  return false
}

const deleteLeftOfCursor = function (el) {
  if ($elements.canSetSelectionRangeElement(el)) {
    const { start, end } = getSelectionBounds(el)

    if (start === end) {
      setSelectionRange(el, start - 1, end)
    }

    return deleteSelectionContents(el)
  }

  const selection = _getSelectionByEl(el)

  if (isSelectionCollapsed(selection)) {
    $elements.callNativeMethod(
      selection,
      'modify',
      'extend',
      'backward',
      'character'
    )
  }

  deleteSelectionContents(el)

  return false
}

const _collapseInputOrTextArea = (el, toIndex) => {
  return setSelectionRange(el, toIndex, toIndex)
}

const moveCursorLeft = function (el) {
  if ($elements.canSetSelectionRangeElement(el)) {
    const { start, end } = getSelectionBounds(el)

    if (start !== end) {
      return _collapseInputOrTextArea(el, start)
    }

    if (start === 0) {
      return
    }

    return setSelectionRange(el, start - 1, start - 1)
  }

  // if ($elements.isContentEditable(el)) {
  const selection = _getSelectionByEl(el)

  return $elements.callNativeMethod(
    selection,
    'modify',
    'move',
    'backward',
    'character'
  )
  // }
}

// Keeping around native implementation
// for same reasons as listed below
//
// range = _getSelectionRangeByEl(el)
// if !range.collapsed
//   return range.collapse(true)
// if range.startOffset is 0
//   return _contenteditableMoveToEndOfPrevLine(el)
// newOffset = range.startOffset - 1
// range.setStart(range.startContainer, newOffset)
// range.setEnd(range.startContainer, newOffset)

const moveCursorRight = function (el) {
  if ($elements.canSetSelectionRangeElement(el)) {
    const { start, end } = getSelectionBounds(el)

    if (start !== end) {
      return _collapseInputOrTextArea(el, end)
    }

    // Don't worry about moving past the end of the string
    // nothing will happen and there is no error.
    return setSelectionRange(el, start + 1, end + 1)
  }

  const selection = _getSelectionByEl(el)

  return $elements.callNativeMethod(
    selection,
    'modify',
    'move',
    'forward',
    'character'
  )
}

const moveCursorUp = (el) => {
  return _moveCursorUpOrDown(el, true)
}

const moveCursorDown = (el) => {
  return _moveCursorUpOrDown(el, false)
}

const _moveCursorUpOrDown = function (el, up) {
  if ($elements.isInput(el)) {
    // on an input, instead of moving the cursor
    // we want to perform the native browser action
    // which is to increment the step/interval
    if ($elements.isInputType(el, 'number')) {
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

    return $elements.callNativeMethod(
      selection,
      'modify',
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

const isCollapsed = (el: HTMLElement) => {
  if ($elements.canSetSelectionRangeElement(el)) {
    const { start, end } = getSelectionBounds(el)

    return start === end
  }

  const doc = $document.getDocumentFromElement(el)

  return _getSelectionRange(doc).collapsed
}

const selectAll = function (doc) {
  const el = _getActive(doc)

  if ($elements.canSetSelectionRangeElement(el)) {
    setSelectionRange(el, 0, $elements.getNativeProp(el, 'value').length)

    return
  }

  return $elements.callNativeMethod(
    doc,
    'execCommand',
    'selectAll',
    false,
    null
  )
}
// Keeping around native implementation
// for same reasons as listed below
//
// range = _getSelectionRangeByEl(el)
// range.selectNodeContents(el)
// range.deleteContents()
// return
// startTextNode = _getFirstTextNode(el.firstChild)
// endTextNode = _getInnerLastChild(el.lastChild)
// range.setStart(startTextNode, 0)
// range.setEnd(endTextNode, endTextNode.length)

const getSelectionBounds = function (el) {
  // this function works for input, textareas, and contentEditables
  switch (true) {
    case !!$elements.isInput(el):
      return _getSelectionBoundsFromInput(el)
    case !!$elements.isTextarea(el):
      return _getSelectionBoundsFromTextarea(el)
    case !!$elements.isContentEditable(el):
      return _getSelectionBoundsFromContentEditable(el)
    default:
      return {
        start: 0,
        end: 0,
      }
  }
}

const _moveSelectionTo = function (toStart: boolean, doc: Document, options = {}) {
  const opts = _.defaults({}, options, {
    onlyIfEmptySelection: false,
  })

  const el = _getActive(doc)

  if ($elements.canSetSelectionRangeElement(el)) {
    if (opts.onlyIfEmptySelection) {
      const { start, end } = getSelectionBounds(el)

      if (start !== end) return
    }

    let cursorPosition

    if (toStart) {
      cursorPosition = 0
    } else {
      cursorPosition = $elements.getNativeProp(el, 'value').length
    }

    setSelectionRange(el, cursorPosition, cursorPosition)

    return
  }

  $elements.callNativeMethod(doc, 'execCommand', 'selectAll', false, null)
  const selection = doc.getSelection()

  if (!selection) {
    return
  }

  // collapsing the range doesn't work on input/textareas, since the range contains more than the input element
  // However, IE can always* set selection range, so only modern browsers (with the selection API) will need this
  const direction = toStart ? 'backward' : 'forward'

  selection.modify('move', direction, 'line')
}

const moveSelectionToEnd = _.curry(_moveSelectionTo)(false)

const moveSelectionToStart = _.curry(_moveSelectionTo)(true)

const replaceSelectionContents = function (el: HTMLElement, key: string) {
  if ($elements.canSetSelectionRangeElement(el)) {
    // if ($elements.isRead)
    const { start, end } = getSelectionBounds(el)

    const value = $elements.getNativeProp(el, 'value') || ''
    const updatedValue = _insertSubstring(value, key, [start, end])

    if (value === updatedValue) {
      return false
    }

    $elements.setNativeProp(el, 'value', updatedValue)

    setSelectionRange(el, start + key.length, start + key.length)

    return true
  }

  const doc = $document.getDocumentFromElement(el)

  _replaceSelectionContentsWithExecCommand(doc, key)

  return false
}

const getCaretPosition = function (el) {
  const bounds = getSelectionBounds(el)

  if (bounds.start == null) {
    // no selection
    return null
  }

  if (bounds.start === bounds.end) {
    return bounds.start
  }

  return null
}

const _getActive = function (doc) {
  // TODO: remove this state access
  // eslint-disable-next-line
  const activeEl = $elements.getNativeProp(doc, 'activeElement')

  return activeEl
}

const focusCursor = function (el, doc) {
  const elToFocus = $elements.getFirstFocusableEl($dom.wrap(el)).get(0)

  const prevFocused = _getActive(doc)

  elToFocus.focus()

  if ($elements.isInput(elToFocus) || $elements.isTextarea(elToFocus)) {
    moveSelectionToEnd(doc)
  }

  if ($elements.isContentEditable(elToFocus) && prevFocused !== elToFocus) {
    moveSelectionToEnd(doc)
  }
}

// Selection API implementation of insert newline.
// Worth keeping around if we ever have to insert native
// newlines if we are trying to support a browser or
// environment without the document.execCommand('insertText', etc...)
//
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

export {
  getSelectionBounds,
  deleteRightOfCursor,
  deleteLeftOfCursor,
  selectAll,
  deleteSelectionContents,
  moveSelectionToEnd,
  moveSelectionToStart,
  getCaretPosition,
  getHostContenteditable,
  moveCursorLeft,
  moveCursorRight,
  moveCursorUp,
  moveCursorDown,
  moveCursorToLineStart,
  moveCursorToLineEnd,
  replaceSelectionContents,
  isCollapsed,
  focusCursor,
}
