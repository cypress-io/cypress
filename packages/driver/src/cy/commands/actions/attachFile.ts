import _ from 'lodash'

import $dom from '../../../dom'
import $errUtils from '../../../cypress/error_utils'
import $actionability from '../../actionability'
import { addEventCoords, dispatch } from './trigger'

// TODO: Does not currently need to be async, but will once we allow users to
// load fixtures and read files. Writing it that way from the start to avoid
// needing to change it later.
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
    if (typeof file === 'string') {
      throw new Error('Support for string shorthands is still TODO')
    }

    if (Buffer.isBuffer(file)) {
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

    if (!_.isString(file.contents) && !Buffer.isBuffer(file.contents)) {
      file.contents = JSON.stringify(file.contents)
    }

    return _.defaults({}, file, {
      fileName: '',
      lastModified: Date.now(),
    })
  }
}

const createFileList = (files: Cypress.FileReferenceObject[]): FileList => {
  const dataTransfer = new DataTransfer()

  files.forEach(({ contents, fileName, lastModified, mimeType }) => {
    const file = new File([contents], fileName || '', { lastModified, type: mimeType })

    dataTransfer.items.add(file)
  })

  return dataTransfer.files
}

interface InternalAttachFileOptions extends Cypress.AttachFileOptions {
  _log: any
  $el: JQuery
}

export default (Commands, Cypress, cy, state, config) => {
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

      // TODO: Support for drag-n-drop to come at a later date
      if (options.action !== 'input') {
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

      let input = subject

      if (input.is('label')) {
        input = $dom.getInputFromLabel(input)
      }

      if (input.length < 1 || !$dom.isInputType(input, 'file')) {
        const node = $dom.stringify(options.$el)

        $errUtils.throwErrByPath('attachFile.not_file_input', {
          onFail: options._log,
          args: { node },
        })
      }

      if (!options.force) {
        cy.ensureNotDisabled(input, options._log)
      }

      // Make sure files is an array even if the user only passed in one
      const filesArray = await Promise.all(([] as Cypress.FileReference[]).concat(files).map(parseFile(options)))

      // We verify actionability on the subject, rather than the input,
      // in order to allow for a hidden <input> with a visible <label>
      // Similarly, this is why we implement something similar, but not identical to,
      // cy.trigger() to dispatch our events.
      await $actionability.verify(cy, subject, config, options, {
        onScroll ($el, type) {
          Cypress.action('cy:scrolled', $el, type)
        },

        onReady ($elToClick, coords) {
          // $elToClick is either the <label> or <input> - the original subject
          // while `element` is always the <input>
          const element = input.get(0);

          (element as HTMLInputElement).files = createFileList(filesArray)

          if (options._log) {
            // display the red dot at these coords
            options._log.set({
              coords: coords.fromAutWindow,
            })
          }

          // We dispatch the events on the input element, but target the red dot
          // based on $elToClick (the coords $actionability.verify gave us),
          // which may be the input or a label pointing to it.
          const inputEventOptions = addEventCoords({
            bubbles: true,
            composed: true,
          }, coords)

          const changeEventOptions = addEventCoords({
            bubbles: true,
          }, coords)

          dispatch(element, state('window'), 'input', inputEventOptions)
          dispatch(element, state('window'), 'change', changeEventOptions)

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
