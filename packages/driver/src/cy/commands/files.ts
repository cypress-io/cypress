import _ from 'lodash'
import { basename } from 'path'

import $errUtils from '../../cypress/error_utils'
import type { Log } from '../../cypress/log'
import { runPrivilegedCommand } from '../../util/privileged_channel'

interface InternalReadFileOptions extends Partial<Cypress.Loggable & Cypress.Timeoutable> {
  _log?: Log
  encoding: Cypress.Encodings
  timeout: number
}

interface InternalWriteFileOptions extends Partial<Cypress.WriteFileOptions & Cypress.Timeoutable> {
  _log?: Log
  timeout: number
}

type ReadFileOptions = Partial<Cypress.Loggable & Cypress.Timeoutable>
type WriteFileOptions = Partial<Cypress.WriteFileOptions & Cypress.Timeoutable>

export default (Commands, Cypress, cy, state) => {
  Commands.addAll({
    readFile (file: string, encoding: Cypress.Encodings | ReadFileOptions | undefined, userOptions?: ReadFileOptions, ...extras: never[]) {
      if (_.isObject(encoding)) {
        userOptions = encoding
        encoding = undefined
      }

      userOptions = userOptions || {}

      const options: InternalReadFileOptions = _.defaults({}, userOptions, {
        // https://github.com/cypress-io/cypress/issues/1558
        // If no encoding is specified, then Cypress has historically defaulted
        // to `utf8`, because of it's focus on text files. This is in contrast to
        // NodeJs, which defaults to binary. We allow users to pass in `null`
        // to restore the default node behavior.
        encoding: encoding === undefined ? 'utf8' : encoding,
        log: true,
        timeout: Cypress.config('defaultCommandTimeout') as number,
      })

      const consoleProps = {}

      if (options.log) {
        options._log = Cypress.log({
          message: file,
          timeout: options.timeout,
          consoleProps () {
            return consoleProps
          },
        })
      }

      if (!file || !_.isString(file)) {
        $errUtils.throwErrByPath('files.invalid_argument', {
          onFail: options._log,
          args: { cmd: 'readFile', file },
        })
      }

      // We clear the default timeout so we can handle
      // the timeout ourselves
      cy.clearTimeout()

      const verifyAssertions = () => {
        return runPrivilegedCommand({
          commandName: 'readFile',
          cy,
          Cypress: (Cypress as unknown) as InternalCypress.Cypress,
          options: {
            file,
            encoding: options.encoding,
          },
        })
        .timeout(options.timeout)
        .catch((err) => {
          if (err.name === 'TimeoutError') {
            $errUtils.throwErrByPath('files.timed_out', {
              onFail: options._log,
              args: { cmd: 'readFile', file, timeout: options.timeout },
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
              onFail: options._log,
              args: { cmd: 'readFile', action: 'read', file, filePath: err.filePath, error: err.message },
            })
          }

          return {
            contents: null,
            filePath: err.filePath,
          }
        }).then(({ filePath, contents }) => {
          // https://github.com/cypress-io/cypress/issues/1558
          // https://github.com/cypress-io/cypress/issues/20683
          // We invoke Buffer.from() in order to transform this from an ArrayBuffer -
          // which socket.io uses to transfer the file over the websocket - into a `Buffer`.
          if (options.encoding === null && contents !== null) {
            contents = Buffer.from(contents)
          }

          // Add the filename as a symbol, in case we need it later (such as when storing an alias)
          try {
            state('current').set('fileName', basename(filePath))
          } catch (e) {
            // as of Webpack 5, the "path-browserify" polyfill requires the "path"
            // argument in "basename" to be a string. Otherwise, the function throws.
            // when this happens, we want to set the filename to "undefined" as fallback behavior.
            state('current').set('fileName', 'undefined')
          }

          consoleProps['File Path'] = filePath
          consoleProps['Contents'] = contents

          return cy.verifyUpcomingAssertions(contents, options, {
            ensureExistenceFor: 'subject',
            onFail (err) {
              if (err.type !== 'existence') {
                return
              }

              // file exists but it shouldn't - or - file doesn't exist but it should
              const errPath = contents ? 'files.existent' : 'files.nonexistent'
              const { message, docsUrl } = $errUtils.cypressErrByPath(errPath, {
                args: { cmd: 'readFile', file, filePath },
              })

              err.message = message
              err.docsUrl = docsUrl
            },
            onRetry: verifyAssertions,
          })
        })
      }

      return verifyAssertions()
    },

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
