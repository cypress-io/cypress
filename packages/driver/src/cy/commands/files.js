/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");
const Promise = require("bluebird");

const $errUtils = require("../../cypress/error_utils");
const $errMessages = require("../../cypress/error_messages");

module.exports = (Commands, Cypress, cy, state, config) => Commands.addAll({
  readFile(file, encoding, options = {}) {
    let verifyAssertions;
    if (_.isObject(encoding)) {
      options = encoding;
      encoding = null;
    }

    _.defaults(options, {
      encoding: encoding != null ? encoding : "utf8",
      log: true
    }
    );

    const consoleProps = {};

    if (options.log) {
      options._log = Cypress.log({
        message: file,
        consoleProps() { return consoleProps; }
      });
    }

    if (!file || !_.isString(file)) {
      $errUtils.throwErrByPath("files.invalid_argument", {
        onFail: options._log,
        args: { cmd: "readFile", file }
      });
    }

    return (verifyAssertions = () => {
      return Cypress.backend("read:file", file, _.pick(options, "encoding"))
      .catch(err => {
        if (err.code === "ENOENT") {
          return {
            contents: null,
            filePath: err.filePath
          };
        } else {
          return $errUtils.throwErrByPath("files.unexpected_error", {
            onFail: options._log,
            args: { cmd: "readFile", action: "read", file, filePath: err.filePath, error: err.message }
          });
        }
    }).then(({ contents, filePath }) => {
        consoleProps["File Path"] = filePath;
        consoleProps["Contents"] = contents;

        return cy.verifyUpcomingAssertions(contents, options, {
          ensureExistenceFor: "subject",
          onFail(err) {
            if (err.type !== "existence") { return; }

            const { message, docsUrl } = (contents != null) ?
              //# file exists but it shouldn't
              $errUtils.errObjByPath($errMessages, "files.existent", {
                file, filePath
              })
            :
              //# file doesn't exist but it should
              $errUtils.errObjByPath($errMessages, "files.nonexistent", {
                file, filePath
              });

            err.message = message;
            return err.docsUrl = docsUrl;
          },

          onRetry: verifyAssertions
        });
      });
    })();
  },

  writeFile(fileName, contents, encoding, options = {}) {
    if (_.isObject(encoding)) {
      options = encoding;
      encoding = null;
    }

    _.defaults(options, {
      encoding: encoding != null ? encoding : "utf8",
      flag: options.flag != null ? options.flag : "w",
      log: true
    }
    );

    const consoleProps = {};

    if (options.log) {
      options._log = Cypress.log({
        message: fileName,
        consoleProps() { return consoleProps; }
      });
    }

    if (!fileName || !_.isString(fileName)) {
      $errUtils.throwErrByPath("files.invalid_argument", {
        onFail: options._log,
        args: { cmd: "writeFile", file: fileName }
      });
    }

    if (!(_.isString(contents) || _.isObject(contents))) {
      $errUtils.throwErrByPath("files.invalid_contents", {
        onFail: options._log,
        args: { contents }
      });
    }

    if (_.isObject(contents)) {
      contents = JSON.stringify(contents, null, 2);
    }

    return Cypress.backend("write:file", fileName, contents, _.pick(options, ["encoding", "flag"]))
    .then(function({ contents, filePath }) {
      consoleProps["File Path"] = filePath;
      consoleProps["Contents"] = contents;
      return null;}).catch(Promise.TimeoutError, err => $errUtils.throwErrByPath("files.timed_out", {
      onFail: options._log,
      args: { cmd: "writeFile", file: fileName, timeout: options.timeout }
    }))
    .catch(err => $errUtils.throwErrByPath("files.unexpected_error", {
      onFail: options._log,
      args: { cmd: "writeFile", action: "write", file: fileName, filePath: err.filePath, error: err.message }
    }));
  }
});
