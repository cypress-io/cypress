_ = require("lodash")
Promise = require("bluebird")

$Log = require("../../cypress/log")
utils = require("../../cypress/utils")

readFile = (file, options) =>
  new Promise (resolve, reject) ->
    Cypress.trigger "read:file", file, options, (resp) ->
      if err = resp.__error
        reject(err)
      else
        resolve(resp)

writeFile = (file, contents, options) =>
  new Promise (resolve, reject) ->
    Cypress.trigger "write:file", file, contents, options, (resp = {}) ->
      if err = resp.__error
        reject(err)
      else
        resolve(resp)

module.exports = (Cypress, Commands) ->
  Commands.addAll({
    readFile: (file, encoding, options = {}) ->
      if _.isObject(encoding)
        options = encoding
        encoding = null

      _.defaults options,
        encoding: encoding ? "utf8"
        log: true

      consoleProps = {}

      if options.log
        options._log = $Log.command({
          message: file
          consoleProps: -> consoleProps
        })

      if not file or not _.isString(file)
        utils.throwErrByPath("files.invalid_argument", {
          onFail: options._log,
          args: { cmd: "readFile", file }
        })

      do verifyAssertions = =>
        readFile(file, _.pick(options, "encoding"))
        .catch (err) =>
          if err.code is 'ENOENT'
            return {
              contents: null
              filePath: err.filePath
            }
          else
            utils.throwErrByPath("files.unexpected_error", {
              onFail: options._log,
              args: { cmd: "readFile", action: "read", file, filePath: err.filePath, error: err.message }
            })
        .then ({ contents, filePath }) =>
          consoleProps["File Path"] = filePath
          consoleProps["Contents"] = contents

          @verifyUpcomingAssertions(contents, options, {
            ensureExistenceFor: "subject"
            onFail: (err) ->
              return unless err.type is "existence"

              if contents?
                ## file exists but it shouldn't
                err.displayMessage = utils.errMessageByPath("files.existent", {
                  file, filePath
                })
              else
                ## file doesn't exist but it should
                err.displayMessage = utils.errMessageByPath("files.nonexistent", {
                  file, filePath
                })
            onRetry: verifyAssertions
          })

    writeFile: (fileName, contents, encoding, options = {}) ->
      if _.isObject(encoding)
        options = encoding
        encoding = null

      _.defaults options,
        encoding: encoding ? "utf8"
        log: true

      consoleProps = {}

      if options.log
        options._log = $Log.command({
          message: fileName
          consoleProps: -> consoleProps
        })

      if not fileName or not _.isString(fileName)
        utils.throwErrByPath("files.invalid_argument", {
          onFail: options._log,
          args: { cmd: "writeFile", file: fileName }
        })

      if not (_.isString(contents) or _.isObject(contents))
        utils.throwErrByPath("files.invalid_contents", {
          onFail: options._log,
          args: { contents: contents }
        })

      if _.isObject(contents)
        contents = JSON.stringify(contents, null, 2)

      writeFile(fileName, contents, _.pick(options, "encoding"))
      .then ({ contents, filePath }) ->
        consoleProps["File Path"] = filePath
        consoleProps["Contents"] = contents

        return contents
      .catch Promise.TimeoutError, (err) ->
        utils.throwErrByPath "files.timed_out", {
          onFail: options._log
          args: { cmd: "writeFile", file: fileName, timeout: options.timeout }
        }
      .catch (err) ->
        utils.throwErrByPath("files.unexpected_error", {
          onFail: options._log
          args: { cmd: "writeFile", action: "write", file: fileName, filePath: err.filePath, error: err.message }
        })
  })
