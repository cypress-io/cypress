import { basename } from 'path'
import _ from 'lodash'

import $dom from '../../../dom'
import $errUtils from '../../../cypress/error_utils'
import $actionability from '../../actionability'
import { addEventCoords, dispatch } from './trigger'

const createDataTransfer = (files: Cypress.FileReferenceObject[]): DataTransfer => {
  const dataTransfer = new DataTransfer()

  files.forEach(({ contents, fileName, lastModified, mimeType }) => {
    const file = new File([contents], fileName || '', { lastModified, type: mimeType })

    dataTransfer.items.add(file)
  })

  return dataTransfer
}

interface InternalAttachFileOptions extends Cypress.AttachFileOptions {
  _log: any
  $el: JQuery
}

const ACTIONS = {
  input: (element, dataTransfer, coords, state) => {
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
  'drag-n-drop': (element, dataTransfer, coords, state) => {
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
      ACTIONS['input'](element, dataTransfer, coords, state)
    }
  },
}

export default (Commands, Cypress, cy, state, config) => {
  const handleAlias = (file, options) => {
    const aliasObj = cy.getAlias(file.contents, 'attachFile', options._log)

    if (!aliasObj) {
      return
    }

    if (aliasObj.subject == null) {
      $errUtils.throwErrByPath('attachFile.invalid_alias', {
        onFail: options._log,
        args: { alias: file.contents, subject: aliasObj.subject },
      })
    }

    if ($dom.isElement(aliasObj.subject)) {
      const subject = $dom.stringify(aliasObj.subject)

      $errUtils.throwErrByPath('attachFile.invalid_alias', {
        onFail: options._log,
        args: { alias: file.contents, subject },
      })
    }

    return {
      ...file,
      contents: aliasObj.subject,
    }
  }

  // Uses backend read:file rather than cy.readFile because we don't want to retry
  // loading a specific file until timeout, but rather retry the attachFile command as a whole
  const handlePath = async (file, options) => {
    return Cypress.backend('read:file', file.contents, { encoding: null })
    .then(({ contents }) => {
      return {
      // We default to the filename on the path, but allow them to override
        fileName: basename(file.contents),
        ...file,
        contents: Buffer.from(contents),
      }
    })
    .catch((err) => {
      if (err.code === 'ENOENT') {
        $errUtils.throwErrByPath('files.nonexistent', {
          args: { cmd: 'attachFile', file: file.contents, filePath: err.filePath },
        })
      }

      $errUtils.throwErrByPath('files.unexpected_error', {
        onFail: options._log,
        args: { cmd: 'attachFile', action: 'read', file, filePath: err.filePath, error: err.message },
      })
    })
  }

  /*
   * Turns a user-provided file - a string shorthand, Buffer, or object
   * into an object of form {
   *   contents,
   *   fileName,
   *   lastModified,
   *   mimeType?,
   * }.
   *
   * Or throws an error. Users do many strange things, and this is where
   * we warn them and suggest how to fix it.
   */
  const parseFile = (options) => {
    return async (file: any, index: number, filesArray: any[]): Promise<Cypress.FileReferenceObject> => {
      if (typeof file === 'string' || Buffer.isBuffer(file)) {
        file = { contents: file }
      }

      if (!file || file.contents == null) {
        // Different error messages if the user passed in one file vs. an array of files
        if (filesArray.length > 1) {
          $errUtils.throwErrByPath('attachFile.invalid_array_file_reference', {
            onFail: options._log,
            args: { file: JSON.stringify(file), index },
          })
        } else {
          $errUtils.throwErrByPath('attachFile.invalid_single_file_reference', {
            onFail: options._log,
            args: { file: JSON.stringify(file) },
          })
        }
      }

      if (typeof file.contents === 'string') {
        file = handleAlias(file, options) ?? await handlePath(file, options)
      }

      if (!_.isString(file.contents) && !Buffer.isBuffer(file.contents)) {
        file.contents = JSON.stringify(file.contents)
      }

      return _.defaults({}, file, {
        fileName: '',
        lastModified: Date.now(),
      })
    }
  }

  Commands.addAll({ prevSubject: 'element' }, {
    async attachFile (subject: JQuery<any>, files: Cypress.FileReference | Cypress.FileReference[], options: Partial<InternalAttachFileOptions>): Promise<JQuery> {
      options = _.defaults({}, options, {
        action: 'input',
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

      if (!ACTIONS[options.action]) {
        $errUtils.throwErrByPath('attachFile.invalid_action', {
          onFail: options._log,
          args: { action: options.action },
        })
      }

      if (subject.length > 1) {
        $errUtils.throwErrByPath('attachFile.multiple_elements', {
          onFail: options._log,
          args: { num: subject.length },
        })
      }

      let eventTarget = subject

      // drag-n-drop always targets the subject directly, but input
      // may switch <label> -> <input> element
      if (options.action === 'input') {
        if (eventTarget.is('label')) {
          eventTarget = $dom.getInputFromLabel(eventTarget)
        }

        if (eventTarget.length < 1 || !$dom.isInputType(eventTarget, 'file')) {
          const node = $dom.stringify(options.$el)

          $errUtils.throwErrByPath('attachFile.not_file_input', {
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

          const dataTransfer = createDataTransfer(filesArray)

          ACTIONS[options.action](eventTarget.get(0), dataTransfer, coords, state)

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
