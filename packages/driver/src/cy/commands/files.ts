import _ from 'lodash'
import { basename } from 'path'

import $errUtils from '../../cypress/error_utils'

interface InternalReadFileOptions extends Partial<Cypress.Loggable & Cypress.Timeoutable> {
  _log?: any
  encoding: Cypress.Encodings
}

interface InternalWriteFileOptions extends Partial<Cypress.WriteFileOptions & Cypress.Timeoutable> {
  _log?: any
}

export default (Commands, Cypress, cy, state) => {
  Commands.addAll({
    readFile (file, encoding, options: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
      let userOptions = options

      if (_.isObject(encoding)) {
        userOptions = encoding
        encoding = undefined
      }

      const _options: InternalReadFileOptions = _.defaults({}, userOptions, {
        // https://github.com/cypress-io/cypress/issues/1558
        // If no encoding is specified, then Cypress has historically defaulted
        // to `utf8`, because of it's focus on text files. This is in contrast to
        // NodeJs, which defaults to binary. We allow users to pass in `null`
        // to restore the default node behavior.
        encoding: encoding === undefined ? 'utf8' : encoding,
        log: true,
        timeout: Cypress.config('defaultCommandTimeout'),
      })

      const consoleProps = {}

      if (_options.log) {
        _options._log = Cypress.log({
          message: file,
          timeout: _options.timeout,
          consoleProps () {
            return consoleProps
          },
        })
      }

      if (!file || !_.isString(file)) {
        $errUtils.throwErrByPath('files.invalid_argument', {
          onFail: _options._log,
          args: { cmd: 'readFile', file },
        })
      }

      // We clear the default timeout so we can handle
      // the timeout ourselves
      cy.clearTimeout()

      const verifyAssertions = () => {
        return Cypress.backend('read:file', file, _.pick(_options, 'encoding')).timeout(_options.timeout)
        .catch((err) => {
          if (err.name === 'TimeoutError') {
            return $errUtils.throwErrByPath('files.timed_out', {
              onFail: _options._log,
              args: { cmd: 'readFile', file, timeout: _options.timeout },
            })
          }

          // Non-ENOENT errors are not retried
          if (err.code !== 'ENOENT') {
            return $errUtils.throwErrByPath('files.unexpected_error', {
              onFail: _options._log,
              args: { cmd: 'readFile', action: 'read', file, filePath: err.filePath, error: err.message },
            })
          }

          return {
            contents: null,
            filePath: err.filePath,
          }
        }).then(({ filePath, contents }) => {
          // https://github.com/cypress-io/cypress/issues/1558
          // We invoke Buffer.from() in order to transform this from an ArrayBuffer -
          // which socket.io uses to transfer the file over the websocket - into a
          // `Buffer`, which webpack polyfills in the browser.
          if (_options.encoding === null) {
            contents = Buffer.from(contents)
          }

          // Add the filename as a symbol, in case we need it later (such as when storing an alias)
          state('current').set('fileName', basename(filePath))

          consoleProps['File Path'] = filePath
          consoleProps['Contents'] = contents

          return cy.verifyUpcomingAssertions(contents, _options, {
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

    writeFile (fileName, contents, encoding, options: Partial<Cypress.WriteFileOptions & Cypress.Timeoutable> = {}) {
      let userOptions = options

      if (_.isObject(encoding)) {
        userOptions = encoding
        encoding = undefined
      }

      const _options: InternalWriteFileOptions = _.defaults({}, userOptions, {
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

      if (_options.log) {
        _options._log = Cypress.log({
          message: fileName,
          timeout: _options.timeout,
          consoleProps () {
            return consoleProps
          },
        })
      }

      if (!fileName || !_.isString(fileName)) {
        $errUtils.throwErrByPath('files.invalid_argument', {
          onFail: _options._log,
          args: { cmd: 'writeFile', file: fileName },
        })
      }

      if (!(_.isString(contents) || _.isObject(contents))) {
        $errUtils.throwErrByPath('files.invalid_contents', {
          onFail: _options._log,
          args: { contents },
        })
      }

      if (_.isObject(contents) && !Buffer.isBuffer(contents)) {
        contents = JSON.stringify(contents, null, 2)
      }

      // We clear the default timeout so we can handle
      // the timeout ourselves
      cy.clearTimeout()

      return Cypress.backend('write:file', fileName, contents, _.pick(_options, 'encoding', 'flag')).timeout(_options.timeout)
      .then(({ filePath, contents }) => {
        consoleProps['File Path'] = filePath
        consoleProps['Contents'] = contents

        return null
      })
      .catch((err) => {
        if (err.name === 'TimeoutError') {
          return $errUtils.throwErrByPath('files.timed_out', {
            onFail: _options._log,
            args: { cmd: 'writeFile', file: fileName, timeout: _options.timeout },
          })
        }

        return $errUtils.throwErrByPath('files.unexpected_error', {
          onFail: _options._log,
          args: { cmd: 'writeFile', action: 'write', file: fileName, filePath: err.filePath, error: err.message },
        })
      })
    },
  })
}
