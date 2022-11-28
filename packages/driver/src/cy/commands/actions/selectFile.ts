import { basename } from 'path'
import _ from 'lodash'
import mime from 'mime-types'

import $dom from '../../../dom'
import $errUtils from '../../../cypress/error_utils'
import $actionability from '../../actionability'
import { addEventCoords, dispatch } from './trigger'

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

const createDataTransfer = (files: Cypress.FileReferenceObject[], eventTarget: JQuery<any>): DataTransfer => {
  // obtain a reference to the `targetWindow` so we can use the right instances of the `File` and `DataTransfer` classes
  const targetWindow = (eventTarget[0] as HTMLElement).ownerDocument.defaultView || window
  const dataTransfer = new targetWindow.DataTransfer()

  files.forEach(({
    contents,
    fileName = '',
    mimeType = mime.lookup(fileName) || '',
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

interface InternalSelectFileOptions extends Cypress.SelectFileOptions {
  _log: any
  $el: JQuery
}

const ACTIONS = {
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
      ACTIONS['select'](element, dataTransfer, coords, state)
    }
  },
}

export default (Commands, Cypress, cy, state, config) => {
  const handleAlias = (file, options) => {
    const aliasObj = cy.getAlias(file.contents, 'selectFile', options._log)

    if (!aliasObj) {
      return
    }

    if (aliasObj.subject == null) {
      $errUtils.throwErrByPath('selectFile.invalid_alias', {
        onFail: options._log,
        args: { alias: file.contents, subject: aliasObj.subject },
      })
    }

    if ($dom.isElement(aliasObj.subject)) {
      const subject = $dom.stringify(aliasObj.subject)

      $errUtils.throwErrByPath('selectFile.invalid_alias', {
        onFail: options._log,
        args: { alias: file.contents, subject },
      })
    }

    return {
      fileName: aliasObj.fileName,
      ...file,
      contents: aliasObj.subject,
    }
  }

  // Uses backend read:file rather than cy.readFile because we don't want to retry
  // loading a specific file until timeout, but rather retry the selectFile command as a whole
  const handlePath = async (file, options) => {
    return Cypress.backend('read:file', file.contents, { encoding: null })
    .then(({ contents }) => {
      return {
      // We default to the filename on the path, but allow them to override
        fileName: basename(file.contents),
        ...file,
        contents: Cypress.Buffer.from(contents),
      }
    })
    .catch((err) => {
      if (err.code === 'ENOENT') {
        $errUtils.throwErrByPath('files.nonexistent', {
          args: { cmd: 'selectFile', file: file.contents, filePath: err.filePath },
        })
      }

      $errUtils.throwErrByPath('files.unexpected_error', {
        onFail: options._log,
        args: { cmd: 'selectFile', action: 'read', file, filePath: err.filePath, error: err.message },
      })
    })
  }

  /*
   * Turns a user-provided file - a string shorthand, ArrayBuffer, or object
   * into an object of form {
   *   contents,
   *   fileName?,
   *   lastModified?,
   * }.
   *
   * Or throws an error. Users do many strange things, and this is where
   * we warn them and suggest how to fix it.
   */
  const parseFile = (options) => {
    return async (file: any, index: number, filesArray: any[]): Promise<Cypress.FileReferenceObject> => {
      if (typeof file === 'string' || ArrayBuffer.isView(file)) {
        file = { contents: file }
      }

      if (!file || file.contents == null) {
        // Different error messages if the user passed in one file vs. an array of files
        if (filesArray.length > 1) {
          $errUtils.throwErrByPath('selectFile.invalid_array_file_reference', {
            onFail: options._log,
            args: { file: JSON.stringify(file), index },
          })
        } else {
          $errUtils.throwErrByPath('selectFile.invalid_single_file_reference', {
            onFail: options._log,
            args: { file: JSON.stringify(file) },
          })
        }
      }

      if (typeof file.contents === 'string') {
        file = handleAlias(file, options) ?? await handlePath(file, options)
      }

      if (!_.isString(file.contents) && !ArrayBuffer.isView(file.contents)) {
        file.contents = JSON.stringify(file.contents)
      }

      return file
    }
  }

  Commands.addAll({ prevSubject: 'element' }, {
    async selectFile (subject: JQuery<any>, files: Cypress.FileReference | Cypress.FileReference[], options: Partial<InternalSelectFileOptions>): Promise<JQuery> {
      options = _.defaults({}, options, {
        action: 'select',
        log: true,
        $el: subject,
      })

      if (options.log) {
        options._log = Cypress.log({
          $el: options.$el,
          timeout: options.timeout,
          consoleProps () {
            return {
              'Target': $dom.getElements(options.$el),
              Elements: options.$el?.length,
            }
          },
        })

        options._log.snapshot('before', { next: 'after' })
      }

      if (!options.action || !ACTIONS[options.action]) {
        $errUtils.throwErrByPath('selectFile.invalid_action', {
          onFail: options._log,
          args: { action: options.action },
        })
      }

      if (subject.length > 1) {
        $errUtils.throwErrByPath('selectFile.multiple_elements', {
          onFail: options._log,
          args: { num: subject.length },
        })
      }

      let eventTarget = subject

      // drag-drop always targets the subject directly, but select
      // may switch <label> -> <input> element
      if (options.action === 'select') {
        if (eventTarget.is('label')) {
          eventTarget = $dom.getInputFromLabel(eventTarget)
        }

        if (eventTarget.length < 1 || !$dom.isInputType(eventTarget, 'file')) {
          const node = $dom.stringify(options.$el)

          $errUtils.throwErrByPath('selectFile.not_file_input', {
            onFail: options._log,
            args: { node },
          })
        }
      }

      if (!options.force) {
        cy.ensureNotDisabled(eventTarget, options._log)
      }

      // Make sure files is an array even if the user only passed in one
      const filesArray = await Promise.all(([] as Cypress.FileReference[]).concat(files).map(parseFile(options)))

      // We verify actionability on the subject, rather than the eventTarget,
      // in order to allow for a hidden <input> with a visible <label>
      // Similarly, this is why we implement something similar, but not identical to,
      // cy.trigger() to dispatch our events.
      await $actionability.verify(cy, subject, config, options, {
        onScroll ($el, type) {
          Cypress.action('cy:scrolled', $el, type)
        },

        onReady ($elToClick, coords) {
          // We dispatch the events on the eventTarget element, but target the red dot
          // based on $elToClick (the coords $actionability.verify gave us),
          // which is the original subject.

          if (options._log) {
            // display the red dot at these coords
            options._log.set({
              coords: coords.fromAutWindow,
            })
          }

          const dataTransfer = createDataTransfer(filesArray, eventTarget)

          ACTIONS[options.action as string](eventTarget.get(0), dataTransfer, coords, state)

          return $elToClick
        },
      })

      const verifyAssertions = () => {
        return cy.verifyUpcomingAssertions(options.$el, options, {
          onRetry: verifyAssertions,
        })
      }

      return verifyAssertions()
    },
  })
}
