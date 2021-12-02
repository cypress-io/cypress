// @ts-nocheck
import _ from 'lodash'

import $errUtils from '../../cypress/error_utils'

export default (Commands, Cypress, cy) => {
  Commands.addAll({
    async readFile (file, encoding, options = {}) {
      // We clear the default timeout because we are handling
      // the timeout ourselves.
      cy.clearTimeout()

      let userOptions = options

      if (_.isObject(encoding)) {
        userOptions = encoding
        encoding = undefined
      }

      options = _.defaults({}, userOptions, {
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

      const verifyAssertions = async () => {
        let result

        try {
          result = await Cypress.backend('read:file', file, _.pick(options, ['encoding', 'timeout']))
        } catch (err) {
          if (err.name === 'TimeoutError') {
            return $errUtils.throwErrByPath('files.timed_out', {
              onFail: options._log,
              args: { cmd: 'readFile', file, timeout: options.timeout },
            })
          }

          // Non-ENOENT errors are not retried
          if (err.code !== 'ENOENT') {
            return $errUtils.throwErrByPath('files.unexpected_error', {
              onFail: options._log,
              args: { cmd: 'readFile', action: 'read', file, filePath: err.filePath, error: err.message },
            })
          }

          result = {
            contents: null,
            filePath: err.filePath,
          }
        }

        let { contents, filePath } = result

        // https://github.com/cypress-io/cypress/issues/1558
        // We invoke Buffer.from() in order to transform this from an ArrayBuffer -
        // which socket.io uses to transfer the file over the websocket - into a
        // `Buffer`, which webpack polyfills in the browser.
        if (options.encoding === null) {
          contents = Buffer.from(contents)
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
              args: { file, filePath },
            })

            err.message = message
            err.docsUrl = docsUrl
          },
          onRetry: verifyAssertions,
        })
      }

      return verifyAssertions()
    },

    async writeFile (fileName, contents, encoding, options = {}) {
      // We clear the default timeout because we are handling
      // the timeout ourselves.
      cy.clearTimeout()

      let userOptions = options

      if (_.isObject(encoding)) {
        userOptions = encoding
        encoding = undefined
      }

      options = _.defaults({}, userOptions, {
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

      let result

      try {
        result = await Cypress.backend('write:file', fileName, contents, _.pick(options, ['encoding', 'flag', 'timeout']))
      } catch (err) {
        if (err.name === 'TimeoutError') {
          return $errUtils.throwErrByPath('files.timed_out', {
            onFail: options._log,
            args: { cmd: 'writeFile', file: fileName, timeout: options.timeout },
          })
        }

        return $errUtils.throwErrByPath('files.unexpected_error', {
          onFail: options._log,
          args: { cmd: 'writeFile', action: 'write', file: fileName, filePath: err.filePath, error: err.message },
        })
      }

      consoleProps['File Path'] = result?.filePath
      consoleProps['Contents'] = result?.contents

      return null
    },
  })
}
