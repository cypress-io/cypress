import _ from 'lodash'
import { basename } from 'path'

import $errUtils from '../../cypress/error_utils'
import type { Log } from '../../cypress/log'
import { runPrivilegedCommand } from '../../util/privileged_channel'

interface InternalWriteFileOptions extends Partial<Cypress.WriteFileOptions & Cypress.Timeoutable> {
  _log?: Log
  timeout: number
}

interface ReadFileOptions extends Partial<Cypress.Loggable & Cypress.Timeoutable> {
  encoding?: Cypress.Encodings
}
type WriteFileOptions = Partial<Cypress.WriteFileOptions & Cypress.Timeoutable>

export default (Commands, Cypress, cy, state) => {
  Commands.addQuery('readFile', function readFile (file: string, encoding: Cypress.Encodings | ReadFileOptions | undefined, userOptions?: ReadFileOptions, ...extras: never[]) {
    if (_.isObject(encoding)) {
      userOptions = encoding
      encoding = userOptions.encoding
    }

    userOptions = userOptions || {}

    encoding = encoding === undefined ? 'utf8' : encoding

    const timeout = userOptions.timeout ?? Cypress.config('defaultCommandTimeout') as number

    this.set('timeout', timeout)
    this.set('ensureExistenceFor', 'subject')

    const log = userOptions.log !== false && Cypress.log({ message: file, timeout })

    if (!file || !_.isString(file)) {
      $errUtils.throwErrByPath('files.invalid_argument', {
        args: { cmd: 'readFile', file },
      })
    }

    let fileResult: any = null
    let filePromise: Promise<void> | null = null
    let mostRecentError = $errUtils.cypressErrByPath('files.read_timed_out', {
      args: { file },
    })

    const createFilePromise = () => {
      // If we already have a pending request to the backend, we'll wait
      // for that one to resolve instead of creating a new one.
      if (filePromise) {
        return
      }

      fileResult = null
      filePromise = runPrivilegedCommand({
        commandName: 'readFile',
        cy,
        Cypress: (Cypress as unknown) as InternalCypress.Cypress,
        options: {
          file,
          encoding,
        },
      })
      .timeout(timeout)
      .then((result) => {
        // https://github.com/cypress-io/cypress/issues/1558
        // https://github.com/cypress-io/cypress/issues/20683
        // We invoke Buffer.from() in order to transform this from an ArrayBuffer -
        // which socket.io uses to transfer the file over the websocket - into a `Buffer`.
        if (encoding === null && result.contents !== null) {
          result.contents = Buffer.from(result.contents)
        }

        // Add the filename as a symbol, in case we need it later (such as when storing an alias)
        try {
          state('current').set('fileName', basename(result.filePath))
        } catch (e) {
          // as of Webpack 5, the "path-browserify" polyfill requires the "path"
          // argument in "basename" to be a string. Otherwise, the function throws.
          // when this happens, we want to set the filename to "undefined" as fallback behavior.
          state('current').set('fileName', 'undefined')
        }

        fileResult = result
      })
      .catch((err) => {
        if (err.name === 'TimeoutError') {
          $errUtils.throwErrByPath('files.timed_out', {
            args: { cmd: 'readFile', file, timeout },
            retry: false,
          })
        }

        if (err.isNonSpec) {
          $errUtils.throwErrByPath('miscellaneous.non_spec_invocation', {
            args: { cmd: 'readFile' },
          })
        }

        // Non-ENOENT errors are not retried
        if (err.code !== 'ENOENT') {
          $errUtils.throwErrByPath('files.unexpected_error', {
            args: { cmd: 'readFile', action: 'read', file, filePath: err.filePath, error: err.message },
            errProps: { retry: false },
          })
        }

        // We have a ENOENT error - the file doesn't exist. Whether this is an error or not is determined
        // by verifyUpcomingAssertions, when the command_queue receives the null file contents.
        fileResult = { contents: null, filePath: err.filePath }
      })
      .catch((err) => mostRecentError = err)
      // Pass or fail, we always clear the filePromise, so future retries know there's no
      // live request to the server.
      .finally(() => filePromise = null)
    }

    // When an assertion attached to this command fails, then we want to throw away the existing result
    // and create a new promise to read a new one.
    this.set('onFail', (err, timedOut) => {
      if (err.type === 'existence') {
        // file exists but it shouldn't - or - file doesn't exist but it should
        const errPath = fileResult.contents ? 'files.existent' : 'files.nonexistent'
        const { message, docsUrl } = $errUtils.cypressErrByPath(errPath, {
          args: { cmd: 'readFile', file, filePath: fileResult.filePath },
        })

        err.message = message
        err.docsUrl = docsUrl
      }

      createFilePromise()
    })

    return () => {
      // Once we've read a file, that remains the result, unless it's cleared
      // because of a failed assertion in `onFail` above.
      if (fileResult) {
        const props = {
          'Contents': fileResult?.contents,
          'File Path': fileResult?.filePath,
        }

        log && state('current') === this && log.set('consoleProps', () => props)

        return fileResult.contents
      }

      createFilePromise()

      // If we don't have a result, then the promise is pending.
      // Throw an error and wait for the promise to eventually resolve on a future retry.
      throw mostRecentError
    }
  })

  Commands.addAll({
    writeFile (fileName: string, contents: string, encoding: Cypress.Encodings | WriteFileOptions | undefined, userOptions: WriteFileOptions, ...extras: never[]) {
      if (_.isObject(encoding)) {
        userOptions = encoding
        encoding = undefined
      }

      userOptions = userOptions || {}

      const options: InternalWriteFileOptions = _.defaults({}, userOptions, {
        // https://github.com/cypress-io/cypress/issues/1558
        // If no encoding is specified, then Cypress has historically defaulted
        // to `utf8`, because of it's focus on text files. This is in contrast to
        // NodeJs, which defaults to binary. We allow users to pass in `null`
        // to restore the default node behavior.
        encoding: encoding === undefined ? 'utf8' : encoding,
        flag: userOptions.flag ? userOptions.flag : 'w',
        log: true,
        timeout: Cypress.config('defaultCommandTimeout'),
      })

      const consoleProps = {}

      if (options.log) {
        options._log = Cypress.log({
          message: fileName,
          timeout: options.timeout,
          consoleProps () {
            return consoleProps
          },
        })
      }

      if (!fileName || !_.isString(fileName)) {
        $errUtils.throwErrByPath('files.invalid_argument', {
          onFail: options._log,
          args: { cmd: 'writeFile', file: fileName },
        })
      }

      if (!(_.isString(contents) || _.isObject(contents))) {
        $errUtils.throwErrByPath('files.invalid_contents', {
          onFail: options._log,
          args: { contents },
        })
      }

      if (_.isObject(contents) && !Buffer.isBuffer(contents)) {
        contents = JSON.stringify(contents, null, 2)
      }

      // We clear the default timeout so we can handle
      // the timeout ourselves
      cy.clearTimeout()

      return runPrivilegedCommand({
        commandName: 'writeFile',
        cy,
        Cypress: (Cypress as unknown) as InternalCypress.Cypress,
        options: {
          fileName,
          contents,
          encoding: options.encoding,
          flag: options.flag,
        },
      })
      .timeout(options.timeout)
      .then(({ filePath, contents }) => {
        consoleProps['File Path'] = filePath
        consoleProps['Contents'] = contents

        return null
      })
      .catch((err) => {
        if (err.name === 'TimeoutError') {
          return $errUtils.throwErrByPath('files.timed_out', {
            onFail: options._log,
            args: { cmd: 'writeFile', file: fileName, timeout: options.timeout },
          })
        }

        if (err.isNonSpec) {
          return $errUtils.throwErrByPath('miscellaneous.non_spec_invocation', {
            args: { cmd: 'writeFile' },
          })
        }

        return $errUtils.throwErrByPath('files.unexpected_error', {
          onFail: options._log,
          args: { cmd: 'writeFile', action: 'write', file: fileName, filePath: err.filePath, error: err.message },
        })
      })
    },
  })
}
