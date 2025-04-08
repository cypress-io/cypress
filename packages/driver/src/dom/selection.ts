import _ from 'lodash'
import $document from './document'
import $elements from './elements'

import debugFn from 'debug'

const debug = debugFn('cypress:driver:selection')

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

  if (el.type === 'number') {
    return {
      start: el.value.length,
      end: el.value.length,
    }
  }

  return {
    start: 0,
    end: 0,
  }
}

const _getSelectionBoundsFromContentEditable = (el) => {
  const pos = {
    start: 0,
    end: 0,
  }

  const sel = _getSelectionByEl(el)

  if (!sel.rangeCount) {
    return pos
  }

  const range = sel.getRangeAt(0)
  let preCaretRange = range.cloneRange()

  preCaretRange.selectNodeContents(el)
  preCaretRange.setEnd(range.endContainer, range.endOffset)
  pos.end = preCaretRange.toString().length

  preCaretRange.selectNodeContents(el)
  preCaretRange.setEnd(range.startContainer, range.startOffset)

  pos.start = preCaretRange.toString().length

  return pos
}

// TODO get ACTUAL caret position in contenteditable, not line
const _replaceSelectionContentsContentEditable = function (el, text) {
  const doc = $document.getDocumentFromElement(el)

  // NOTE: insertText will also handle '\n', and render newlines
  let nativeUI = true

  if (Cypress.browser.family === 'firefox') {
    nativeUI = false
  }

  $elements.callNativeMethod(doc, 'execCommand', 'insertText', nativeUI, text)
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

const insertSubstring = (curText, newText, [start, end]) => {
  return curText.substring(0, start) + newText + curText.substring(end)
}

const _getSelectionByEl = function (el) {
  const doc = $document.getDocumentFromElement(el)

  return doc.getSelection()!
}

const deleteSelectionContents = function (el) {
  if ($elements.isContentEditable(el)) {
    const doc = $document.getDocumentFromElement(el)

    $elements.callNativeMethod(doc, 'execCommand', 'delete', false, null)

    return
  }

  return replaceSelectionContents(el, '')
}

const setSelectionRange = function (el, start, end) {
  if ($elements.canSetSelectionRangeElement(el)) {
    $elements.callNativeMethod(el, 'setSelectionRange', start, end)

    return
  }

  // NOTE: Some input elements have mobile implementations
  // and thus may not always have a cursor, so calling setSelectionRange will throw.
  // we are assuming desktop here, so we store our own internal state.

  el[INTERNAL_STATE] = {
    start,
    end,
  }
}

// Whether or not the selection contains any text
// since Selection.isCollapsed will be true when selection
// is inside non-selectionRange input (e.g. input[type=email])
const isSelectionCollapsed = function (selection: Selection) {
  return !selection.toString()
}

/**
 * @returns {boolean} whether or not input events are needed
 */
const deleteRightOfCursor = function (el) {
  if ($elements.isTextarea(el) || $elements.isInput(el)) {
    const { start, end } = getSelectionBounds(el)

    if (start === $elements.getNativeProp(el, 'value').length) {
      // nothing to delete, nothing to right of selection
      return false
    }

    if (start === end) {
      setSelectionRange(el, start, end + 1)
    }

    deleteSelectionContents(el)

    // successful delete, needs input events
    return true
  }

  if ($elements.isContentEditable(el)) {
    const selection = _getSelectionByEl(el)

    if (isSelectionCollapsed(selection)) {
      $elements.callNativeMethod(
        selection,
        'modify',
        'extend',
        'forward',
        'character',
      )
    }

    if ($elements.getNativeProp(selection, 'isCollapsed')) {
      // there's nothing to delete
      return false
    }

    deleteSelectionContents(el)

    // successful delete, does not need input events
    return false
  }

  return false
}

/**
 * @returns {boolean} whether or not input events are needed
 */
const deleteLeftOfCursor = function (el) {
  if ($elements.isTextarea(el) || $elements.isInput(el)) {
    const { start, end } = getSelectionBounds(el)

    debug('delete left of cursor input/textarea', start, end)

    if (start === end) {
      if (start === 0) {
        // there's nothing to delete, nothing before cursor
        return false
      }

      setSelectionRange(el, start - 1, end)
    }

    deleteSelectionContents(el)

    // successful delete
    return true
  }

  if ($elements.isContentEditable(el)) {
    // there is no 'backwardDelete' command for execCommand, so use the Selection API
    const selection = _getSelectionByEl(el)

    if (isSelectionCollapsed(selection)) {
      $elements.callNativeMethod(
        selection,
        'modify',
        'extend',
        'backward',
        'character',
      )
    }

    deleteSelectionContents(el)

    return false
  }

  return false
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

    if (selection.isCollapsed) {
      return $elements.callNativeMethod(selection, 'modify', 'move', 'backward', 'character')
    }

    selection.collapseToStart()

    return
  }
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
  if ($elements.isTextarea(el) || $elements.isInput(el)) {
    const { start, end } = getSelectionBounds(el)

    if (start !== end) {
      return _collapseInputOrTextArea(el, end)
    }

    // Don't worry about moving past the end of the string
    // nothing will happen and there is no error.
    return setSelectionRange(el, start + 1, end + 1)
  }

  if ($elements.isContentEditable(el)) {
    const selection = _getSelectionByEl(el)

    return $elements.callNativeMethod(selection, 'modify', 'move', 'forward', 'character')
  }
}

const _moveCursorUpOrDown = function (up: boolean, el: HTMLElement) {
  if ($elements.isInput(el)) {
    // on an input, instead of moving the cursor
    // we want to perform the native browser action
    // which is to increment the step/interval

    const validInputTypes = [
      'number',
      'datetime-local',
      'date',
      'time',
      'week',
      'month',
      'range',
    ]

    let check = validInputTypes.some((type) => $elements.isInputType(el, type))

    if (check) {
      if (up) {
        if (typeof el.stepUp === 'function') {
          const changeEvent = new Event('change')

          const inputEvent = new Event('input')

          el.stepUp()
          el.dispatchEvent(inputEvent)
          el.dispatchEvent(changeEvent)
        }
      } else {
        if (typeof el.stepDown === 'function') {
          const changeEvent = new Event('change')
          const inputEvent = new Event('input')

          el.stepDown()
          el.dispatchEvent(inputEvent)
          el.dispatchEvent(changeEvent)
        }
      }
    }

    return
  }

  const isTextarea = $elements.isTextarea(el)

  if (isTextarea && Cypress.browser.family === 'firefox') {
    const val = $elements.getNativeProp(el as HTMLTextAreaElement, 'value')
    const bounds = _getSelectionBoundsFromTextarea(el as HTMLTextAreaElement)
    let toPos

    if (up) {
      const partial = val.slice(0, bounds.start)
      const lastEOL = partial.lastIndexOf('\n')
      const offset = partial.length - lastEOL - 1
      const SOL = partial.slice(0, lastEOL).lastIndexOf('\n') + 1
      const toLineLen = partial.slice(SOL, lastEOL).length

      toPos = SOL + Math.min(toLineLen, offset)

      // const baseLen = arr.slice(0, -2).join().length - 1
      // toPos = baseLen + arr.slice(-1)[0].length
    } else {
      const partial = val.slice(bounds.end)
      const arr = partial.split('\n')
      const baseLen = arr.slice(0, 1).join('\n').length + bounds.end

      toPos = baseLen + (bounds.end - val.slice(0, bounds.end).lastIndexOf('\n'))
    }

    setSelectionRange(el, toPos, toPos)

    return
  }

  if (isTextarea || $elements.isContentEditable(el)) {
    const selection = _getSelectionByEl(el)

    if (Cypress.browser.family === 'firefox' && !selection.isCollapsed) {
      up ? selection.collapseToStart() : selection.collapseToEnd()

      return
    }

    return $elements.callNativeMethod(selection, 'modify',
      'move',
      up ? 'backward' : 'forward',
      'line')
  }
}

const moveCursorUp = _.curry(_moveCursorUpOrDown)(true)
const moveCursorDown = _.curry(_moveCursorUpOrDown)(false)

const _moveCursorToLineStartOrEnd = function (toStart: boolean, el: HTMLElement) {
  const isInput = $elements.isInput(el)
  const isTextarea = $elements.isTextarea(el)
  const isInputOrTextArea = isInput || isTextarea

  if ($elements.isContentEditable(el) || isInputOrTextArea) {
    const selection = _getSelectionByEl(el)

    if (Cypress.browser.family === 'firefox' && isInputOrTextArea) {
      if (isInput) {
        let toPos = 0

        if (!toStart) {
          toPos = $elements.getNativeProp(el as HTMLInputElement, 'value').length
        }

        setSelectionRange(el, toPos, toPos)

        return
      }

      if (isTextarea) {
        const bounds = _getSelectionBoundsFromTextarea(el)
        const value = $elements.getNativeProp(el as HTMLTextAreaElement, 'value')
        let toPos: number

        if (toStart) {
          toPos = value.slice(0, bounds.start).lastIndexOf('\n') + 1
        } else {
          const valSlice = value.slice(bounds.end)
          const EOLNewline = valSlice.indexOf('\n')
          const EOL = EOLNewline === -1 ? valSlice.length : EOLNewline

          toPos = bounds.end + EOL
        }

        setSelectionRange(el, toPos, toPos)

        return
      }
    }

    // the selection.modify API is non-standard, may work differently in other browsers, and is not in IE11.
    // https://developer.mozilla.org/en-US/docs/Web/API/Selection/modify
    return $elements.callNativeMethod(selection, 'modify', 'move', toStart ? 'backward' : 'forward', 'lineboundary')
  }
}

const moveCursorToLineStart = _.curry(_moveCursorToLineStartOrEnd)(true)
const moveCursorToLineEnd = _.curry(_moveCursorToLineStartOrEnd)(false)

const isCollapsed = function (el) {
  if ($elements.isTextarea(el) || $elements.isInput(el)) {
    const { start, end } = getSelectionBounds(el)

    return start === end
  }

  if ($elements.isContentEditable(el)) {
    const selection = _getSelectionByEl(el)

    return selection.isCollapsed
  }

  return false
}

const selectAll = function (el: HTMLElement) {
  if ($elements.isTextarea(el) || $elements.isInput(el)) {
    setSelectionRange(el, 0, $elements.getNativeProp(el, 'value').length)

    return
  }

  if ($elements.isContentEditable(el)) {
    const doc = $document.getDocumentFromElement(el)

    return $elements.callNativeMethod(doc, 'execCommand', 'selectAll', false, null)
  }
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

const _moveSelectionTo = function (toStart: boolean, el: HTMLElement, options = {}) {
  const opts = _.defaults({}, options, {
    onlyIfEmptySelection: false,
  })

  const doc = $document.getDocumentFromElement(el)

  if ($elements.isInput(el) || $elements.isTextarea(el)) {
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

  if ($elements.isContentEditable(el)) {
    const selection = _getSelectionByEl(el)

    if (!selection) {
      return
    }

    // We need to check if element is the root contenteditable element or elements inside it
    // because they should be handled differently.
    if ($elements.hasContenteditableAttr(el)) {
      if (Cypress.isBrowser({ family: 'firefox' })) {
        // FireFox doesn't treat a selectAll+arrow the same as clicking the start/end of a contenteditable
        // so we need to select the specific nodes inside the contenteditable.
        let elToSelect = el.childNodes[toStart ? 0 : el.childNodes.length - 1]

        // in firefox, when an empty contenteditable is a single <br> element or <div><br/></div>
        // its innerText will be '\n' (maybe find a more efficient measure)
        if (!elToSelect || el.innerText === '\n') {
          // we must be in an empty contenteditable, so we're already at both the start and end
          return
        }

        // if we're on a <br> but the text isn't empty, we need to
        if ($elements.getTagName(elToSelect) === 'br') {
          if (el.childNodes.length < 2) {
            // no other node to target, shouldn't really happen but we should behave like the contenteditable is empty
            return
          }

          elToSelect = toStart ? el.childNodes[1] : el.childNodes[el.childNodes.length - 2]
        }

        const range = selection.getRangeAt(0)

        range.selectNodeContents(elToSelect)
      } else {
        $elements.callNativeMethod(doc, 'execCommand', 'selectAll', false, null)
      }
    } else {
      selection.selectAllChildren(el)
    }

    toStart ? selection.collapseToStart() : selection.collapseToEnd()
  }

  return
}

const moveSelectionToEnd = _.curry(_moveSelectionTo)(false)

const moveSelectionToStart = _.curry(_moveSelectionTo)(true)

const replaceSelectionContents = function (el, key) {
  if ($elements.isContentEditable(el)) {
    _replaceSelectionContentsContentEditable(el, key)

    return
  }

  if ($elements.isInput(el) || $elements.isTextarea(el)) {
    const { start, end } = getSelectionBounds(el)

    const value = $elements.getNativeProp(el, 'value') || ''

    const updatedValue = insertSubstring(value, key, [start, end])

    debug(`inserting at selection ${JSON.stringify({ start, end })}`, 'rewriting value to ', updatedValue)

    $elements.setNativeProp(el, 'value', updatedValue)

    setSelectionRange(el, start + key.length, start + key.length)

    return
  }
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

const interceptSelect = function (this: any) {
  if ($elements.isInput(this) && !$elements.canSetSelectionRangeElement(this)) {
    setSelectionRange(this, 0, $elements.getNativeProp(this, 'value').length)
  }

  return $elements.callNativeMethod(this, 'select')
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

export default {
  getSelectionBounds,
  deleteRightOfCursor,
  deleteLeftOfCursor,
  selectAll,
  deleteSelectionContents,
  moveSelectionToEnd,
  moveSelectionToStart,
  getCaretPosition,
  moveCursorLeft,
  moveCursorRight,
  moveCursorUp,
  moveCursorDown,
  moveCursorToLineStart,
  moveCursorToLineEnd,
  replaceSelectionContents,
  isCollapsed,
  insertSubstring,
  interceptSelect,
}
