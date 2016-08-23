$Cypress.register "Files", (Cypress, _, $, Promise) ->

  readFile = (file, options) =>
    new Promise (resolve, reject) ->
      Cypress.trigger "read:file", file, options, (resp) ->
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
          args: { cmd: "readFile", file: file ? '' }
        })

      do verifyAssertions = =>
        readFile(file, _.pick(options, "encoding"))
        .catch (err) =>
          if err.code is 'ENOENT'
            return null
          else
            $Cypress.Utils.throwErrByPath("files.unexpected_error", {
              onFail: options._log,
              args: { cmd: "readFile", file: file ? '', error: err.message }
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
