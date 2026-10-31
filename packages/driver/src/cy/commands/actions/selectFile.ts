import { basename } from 'path'
import _ from 'lodash'

import $dom from '../../../dom'
import $errUtils from '../../../cypress/error_utils'
import $actionability from '../../actionability'
import { SELECT_FILE_ACTIONS, createDataTransfer } from './select_file_dom'
import { runPrivilegedCommand } from '../../../util/privileged_channel'
import { isRemoteSubject } from '../../remote'
import { remoteSelectFile } from '../../remote/actions'

interface InternalSelectFileOptions extends Cypress.SelectFileOptions {
  _log: any
  $el: JQuery
  eventTarget: JQuery
}

interface FilePathObject {
  fileName?: string
  index: number
  isFilePath: boolean
  lastModified?: number
  mimeType?: string
  path: string
}

export default (Commands, Cypress, cy, state, config) => {
  const handleAlias = (file, options) => {
    const aliasObj = cy.getAlias(file.contents, 'selectFile', options._log)

    if (!aliasObj) {
      return
    }

    const contents = cy.getSubjectFromChain(aliasObj.subjectChain)

    if (contents == null) {
      $errUtils.throwErrByPath('selectFile.invalid_alias', {
        onFail: options._log,
        args: { alias: file.contents, subject: contents },
      })
    }

    if ($dom.isElement(contents)) {
      const subject = $dom.stringify(contents)

      $errUtils.throwErrByPath('selectFile.invalid_alias', {
        onFail: options._log,
        args: { alias: file.contents, subject },
      })
    }

    return {
      fileName: aliasObj.fileName,
      ...file,
      contents,
    }
  }

  const readFiles = async (filePaths, options) => {
    if (!filePaths.length) return []

    // This reads the file with privileged access in the same manner as
    // cy.readFile(). We call directly into the backend rather than calling
    // cy.readFile() directly because we don't want to retry loading a specific
    // file until timeout, but rather retry the selectFile command as a whole
    return runPrivilegedCommand({
      commandName: 'selectFile',
      cy,
      Cypress: (Cypress as unknown) as InternalCypress.Cypress,
      options: {
        files: filePaths,
      },
    })
    .then((results) => {
      return results.map((result) => {
        return {
          // We default to the filename on the path, but allow them to override
          fileName: basename(result.path),
          ...result,
          contents: Cypress.Buffer.from(result.contents),
        }
      })
    })
    .catch((err) => {
      if (err.isNonSpec) {
        $errUtils.throwErrByPath('miscellaneous.non_spec_invocation', {
          args: { cmd: 'selectFile' },
        })
      }

      if (err.code === 'ENOENT') {
        $errUtils.throwErrByPath('files.nonexistent', {
          args: { cmd: 'selectFile', file: err.originalFilePath, filePath: err.filePath },
        })
      }

      $errUtils.throwErrByPath('files.unexpected_error', {
        onFail: options._log,
        args: { cmd: 'selectFile', action: 'read', file: err.originalFilePath, filePath: err.filePath, error: err.message },
      })
    })
  }

  const getFilePathObject = (file, index) => {
    return {
      encoding: null,
      fileName: file.fileName,
      index,
      isFilePath: true,
      lastModified: file.lastModified,
      mimeType: file.mimeType,
      path: file.contents,
    }
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
    return (file: any, index: number, filesArray: any[]): Cypress.FileReferenceObject | FilePathObject => {
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
        // if not an alias, an object representing that the file is a path that
        // needs to be read from disk. contents are an empty string to they
        // it skips the next check
        file = handleAlias(file, options) ?? getFilePathObject(file, index)
      }

      if (!file.isFilePath && !_.isString(file.contents) && !ArrayBuffer.isView(file.contents)) {
        file.contents = JSON.stringify(file.contents)
      }

      return file
    }
  }

  async function collectFiles (files, options) {
    const filesCollection = ([] as (Cypress.FileReference | FilePathObject)[]).concat(files).map(parseFile(options))
    // if there are any file paths, read them from the server in one go
    const filePaths = filesCollection.filter((file) => (file as FilePathObject).isFilePath)
    const filePathResults = await readFiles(filePaths, options)

    // stitch them back into the collection
    filePathResults.forEach((filePathResult) => {
      filesCollection[filePathResult.index] = _.pick(filePathResult, 'contents', 'fileName', 'mimeType', 'lastModified')
    })

    return filesCollection as Cypress.FileReferenceObject[]
  }

  Commands.addAll({ prevSubject: 'element' }, {
    async selectFile (subject: JQuery<any>, files: Cypress.FileReference | Cypress.FileReference[], options: Partial<InternalSelectFileOptions>, ...extras: never[]): Promise<JQuery> {
      options = _.defaults({}, options, {
        action: 'select',
        log: true,
        $el: subject,
        eventTarget: subject,
      })

      options._log = Cypress.log({
        $el: options.$el,
        hidden: options.log === false,
        timeout: options.timeout,
        consoleProps () {
          return {
            'Target': $dom.getElements(options.$el),
            Elements: options.$el?.length,
          }
        },
      })

      options._log?.snapshot('before', { next: 'after' })

      if (!options.action || !SELECT_FILE_ACTIONS[options.action]) {
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

      const getEventTargetFromSubject = (subject) => {
        let eventTarget = subject

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
          Cypress.ensure.isNotDisabled(eventTarget, 'selectFile', options._log)
        }

        return eventTarget
      }

      // Make sure files is an array even if the user only passed in one
      const filesArray = await collectFiles(files, options)

      // the agent builds the files in the AUT, so their contents cross as base64
      if (isRemoteSubject(subject)) {
        const remoteFiles = filesArray.map(({ contents, fileName, mimeType, lastModified }) => {
          const bytes = ArrayBuffer.isView(contents) ? Cypress.Buffer.from(contents.buffer, contents.byteOffset, contents.byteLength) : Cypress.Buffer.from(contents)

          return { contents: bytes.toString('base64'), fileName, mimeType, lastModified }
        })

        return remoteSelectFile(Cypress, cy, subject, remoteFiles, options.action === 'drag-drop' ? 'drag-drop' : 'select', options)
      }

      const subjectChain = cy.subjectChain()

      // We verify actionability on the subject, rather than the eventTarget,
      // in order to allow for a hidden <input> with a visible <label>
      // Similarly, this is why we implement something similar, but not identical to,
      // cy.trigger() to dispatch our events.
      await $actionability.verify(cy, subject, config, options, {
        subjectFn () {
          subject = cy.getSubjectFromChain(subjectChain)
          options.eventTarget = getEventTargetFromSubject(subject)

          return subject
        },

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

          const dataTransfer = createDataTransfer(filesArray, options.eventTarget as JQuery<HTMLElement>)

          SELECT_FILE_ACTIONS[options.action as string](options.eventTarget?.get(0), dataTransfer, coords, state)

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
