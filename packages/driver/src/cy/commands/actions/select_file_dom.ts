import _ from 'lodash'
import mime from 'mime'

import $dom from '../../../dom'
import { addEventCoords, dispatch } from './dispatch_event'

// What cy.selectFile does in the AUT's document, shared with the remote driver's agent

/* dropzone.js relies on an experimental, nonstandard API, webkitGetAsEntry().
 * https://developer.mozilla.org/en-US/docs/Web/API/DataTransferItem/webkitGetAsEntry
 * The behavior here varies between browsers, and though unpleasant, we have to attempt
 * to replicate it as far as possible.
 *
 * In webkit browsers, item.webkitGetAsEntry() returns null, because our File()
 * instances don't actually correspond with a file on disk. But the property is writeable,
 * so we're able to override it with our own implementation that returns a proper object.
 *
 * In Firefox, the builtin webkitGetAsEntry() returns a useful value, but attempting to
 * override webkitGetAsEntry() throws an error.
 *
 */
const tryMockWebKit = (item) => {
  try {
    item.webkitGetAsEntry = () => {
      return {
        isFile: true,
        file: (callback) => callback(item.getAsFile()),
      }
    }
  } catch (e) {
    // We're in a browser where webkitGetAsEntry cannot be mocked (probably Firefox).
  }

  return item
}

export const createDataTransfer = (files: Cypress.FileReferenceObject[], eventTarget: JQuery<any>): DataTransfer => {
  // obtain a reference to the `targetWindow` so we can use the right instances of the `File` and `DataTransfer` classes
  const targetWindow = (eventTarget[0] as HTMLElement).ownerDocument.defaultView || window
  const dataTransfer = new targetWindow.DataTransfer()

  files.forEach(({
    contents,
    fileName = '',
    mimeType = mime.getType(fileName) || '',
    lastModified = Date.now(),
  }) => {
    const file = new targetWindow.File([contents], fileName, { lastModified, type: mimeType })

    dataTransfer.items.add(file)
  })

  const oldItems = dataTransfer.items

  // dataTransfer.items is a getter, and it - and the items read from its
  // returned DataTransferItemList - cannot be assigned to. DataTransferItemLists
  // also cannot be constructed, so we have to use an array instead.
  Object.defineProperty(dataTransfer, 'items', {
    get () {
      return _.map(oldItems, tryMockWebKit)
    },
  })

  // When a real user drags file(s) over an element, dataTransfer.types always contains `['Files']`.
  // In Firefox however, the 'types' array is not properly populated when we construct our dataTransfer.
  if (files.length !== 0 && dataTransfer.types.length === 0) {
    Object.defineProperty(dataTransfer, 'types', {
      get () {
        // This is the value observed from real user events in Firefox 90.
        return ['application/x-moz-file', 'Files']
      },
    })
  }

  return dataTransfer
}

export const SELECT_FILE_ACTIONS = {
  select: (element, dataTransfer, coords, state) => {
    (element as HTMLInputElement).files = dataTransfer.files
    const inputEventOptions = addEventCoords({
      bubbles: true,
      composed: true,
    }, coords)

    const changeEventOptions = addEventCoords({
      bubbles: true,
    }, coords)

    dispatch(element, state('window'), 'input', inputEventOptions)
    dispatch(element, state('window'), 'change', changeEventOptions)
  },
  'drag-drop': (element, dataTransfer, coords, state) => {
    const dragEventOptions = addEventCoords({
      bubbles: true,
      composed: true,
      cancelable: true,
      dataTransfer,
    }, coords)

    dispatch(element, state('window'), 'drag', dragEventOptions)
    dispatch(element, state('window'), 'dragenter', dragEventOptions)
    dispatch(element, state('window'), 'dragover', dragEventOptions)
    dispatch(element, state('window'), 'drop', dragEventOptions)

    // If a user drops file over an <input type="file"> element, browsers attach the file
    // to it, exactly as if they'd selected one from a file list.
    // If a user drops multiple files over an input without the "multiple" attribute,
    // the browser does nothing, and we want to mimic this behavior.
    if ($dom.isInputType(element, 'file') && (dataTransfer.files.length === 1 || element.multiple)) {
      SELECT_FILE_ACTIONS['select'](element, dataTransfer, coords, state)
    }
  },
}
