import _ from 'lodash'
import Promise from 'bluebird'

import $dom from '../../../dom'
import $errUtils from '../../../cypress/error_utils'
import $actionability from '../../actionability'
import { dispatch } from './trigger'

// TODO: Does not currently need to use promises, but will once we allow users to
// load fixtures and read files. Writing it async from the start to avoid
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
const parseFile = (file: any, index: number, filesArray: any[]): Promise<FileReferenceObject> => {
  if (typeof file === 'string') {
    throw new Error('Support for string shorthands is still TODO')
  }

  if (Buffer.isBuffer(file)) {
    file = { contents: file }
  }

  if (!file || file.contents == null) {
    // Different error messages if the user passed in one file vs. an array of files
    if (filesArray.length > 1) {
      $errUtils.throwErrByPath('attachFile.invalid_single_file_reference', {
        onFail: options._log,
        args: { file },
      })
    } else {
      $errUtils.throwErrByPath('attachFile.invalid_array_file_reference', {
        onFail: options._log,
        args: { file, index },
      })
    }
  }

  if (!_.isString(file.contents) && !Buffer.isBuffer(file.contents)) {
    file.contents = JSON.stringify(file.contents)
  }

  return Promise.resolve(_.defaults({}, file, {
    fileName: '',
    lastModified: Date.now(),
  }))
}

const createDataTransfer = (files: FileReferenceObject[]): DataTransfer => {
  const dataTransfer = new DataTransfer()

  files.forEach(({ contents, fileName, lastModified, mimeType }) => {
    const file = new File([contents], fileName, { lastModified, type: mimeType })

    dataTransfer.items.add(file)
  })

  return dataTransfer
}

export default (Commands, Cypress, cy, state, config) => {
  Commands.addAll({ prevSubject: 'element' }, {
    // TODO: any -> Partial<Cypress.Loggable & Cypress.Timeoutable>
    attachFile (subject, files: FileReference | FileReference[], options: Partial<AttachFileOptions>): Chainable<Subject> {
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
              Elements: options.$el.length,
            }
          },
        })

        options._log.snapshot('before', { next: 'after' })
      }

      // Support for drag-n-drop to come at a later date
      if (options.action !== 'input') {
        $errUtils.throwErr('attachFile.invalid_action', { onFail: options._log })
      }

      if (subject.length > 1) {
        $errUtils.throwErrByPath('attachFile.multiple_elements', {
          onFail: options._log,
          args: { num: subject.length },
        })
      }

      let input = options.$el

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

      // Make sure files is an array even if the user only passed in one
      return Promise.all([].concat(files).map(parseFile)).then((filesArray) => {
        const trigger = () => {
          // We verify actionability on the subject, rather than the input,
          // in order to allow for a hidden <input> with a visible <label>
          // Similarly, this is why we implement something similar, but not identical to,
          // cy.trigger() to dispatch our events.
          return $actionability.verify(cy, subject, config, options, {
            onScroll ($el, type) {
              Cypress.action('cy:scrolled', $el, type)
            },

            onReady ($elToClick, coords) {
              // $elToClick is the label or input element - the original subject
              // while `element` is always the <input>
              const element = input.get(0)
              const dataTransfer = createDataTransfer(filesArray)

              const { fromElWindow, fromElViewport, fromAutWindow } = coords

              if (options._log) {
                // display the red dot at these coords
                options._log.set({
                  coords: fromAutWindow,
                })
              }

              // We dispatch the events on the input element, but target the red dot
              // based on $elToClick, which may be the input or a label pointing to it
              const eventOptions = {
                clientX: fromElViewport.x,
                clientY: fromElViewport.y,
                screenX: fromElViewport.x,
                screenY: fromElViewport.y,
                pageX: fromElWindow.x,
                pageY: fromElWindow.y,
              }

              element.files = dataTransfer.files
              dispatch(element, state('window'), 'input', eventOptions)
              dispatch(element, state('window'), 'change', eventOptions)

              return $elToClick
            },
          })
        }

        return Promise
        .try(trigger)
        .then(() => {
          const verifyAssertions = () => {
            return cy.verifyUpcomingAssertions(options.$el, options, {
              onRetry: verifyAssertions,
            })
          }

          return verifyAssertions()
        })
      })
    },
  })
}
