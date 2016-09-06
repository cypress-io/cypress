$Cypress.register "Files", (Cypress, _, $, Promise) ->

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

  Cypress.addParentCommand
    readFile: (file, encoding, options = {}) ->
      if _.isObject(encoding)
        options = encoding
        encoding = null

      _.defaults options,
        encoding: encoding ? "utf8"
        log: true

      if options.log
        options._log = Cypress.Log.command({
          message: file
        })

      if not file or not _.isString(file)
        $Cypress.Utils.throwErrByPath("files.invalid_argument", {
          onFail: options._log,
          args: { cmd: "readFile", file }
        })

      do verifyAssertions = =>
        readFile(file, _.pick(options, "encoding"))
        .catch (err) =>
          if err.code is 'ENOENT'
            return null
          else
            $Cypress.Utils.throwErrByPath("files.unexpected_error", {
              onFail: options._log,
              ## TODO: same thing here let's provide the absolute
              ## path to the file instead of the relative
              args: { cmd: "readFile", file, error: err.message }
            })
        .then (contents) =>
          @verifyUpcomingAssertions(contents, options, {
            ensureExistenceFor: "subject"
            onFail: (err) ->
              return unless err.type is "existence"

              if contents?
                ## file exists but it shouldn't
                err.displayMessage = $Cypress.Utils.errMessageByPath("files.existent", { file })
              else
                ## file doesn't exist but it should
                err.displayMessage = $Cypress.Utils.errMessageByPath("files.nonexistent", { file })
            onRetry: verifyAssertions
          })

    writeFile: (fileName, contents, encoding, options = {}) ->
      if _.isObject(encoding)
        options = encoding
        encoding = null

      _.defaults options,
        encoding: encoding ? "utf8"
        log: true

      if options.log
        options._log = Cypress.Log.command({
          message: fileName
          consoleProps: ->
            {
              ## TODO:
              ## this should probably be the absolute path to
              ## the file that was written instead of the relative
              ## which we'll need to get back from the server
              ## as the response over websockets
              "File Name": fileName
              "Contents": contents
            }
        })

      if not fileName or not _.isString(fileName)
        $Cypress.Utils.throwErrByPath("files.invalid_argument", {
          onFail: options._log,
          args: { cmd: "writeFile", file: fileName }
        })

      if not (_.isString(contents) or _.isObject(contents))
        $Cypress.Utils.throwErrByPath("files.invalid_contents", {
          onFail: options._log,
          args: { contents: contents }
        })

      if _.isObject(contents)
        contents = JSON.stringify(contents, null, 2)

      writeFile(fileName, contents, _.pick(options, "encoding"))
      ## TODO: this can just be .return(contents)
      .then ->
        contents
      .catch Promise.TimeoutError, (err) ->
        $Cypress.Utils.throwErrByPath "files.timed_out", {
          onFail: options._log
          args: { cmd: "writeFile", file: fileName, timeout: options.timeout }
        }
      .catch (err) ->
        $Cypress.Utils.throwErrByPath("files.unexpected_error", {
          onFail: options._log
          args: { cmd: "writeFile", file: fileName, error: err.message }
        })
