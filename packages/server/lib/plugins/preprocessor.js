/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");
const EE = require("events");
const path = require("path");
const debug = require("debug")("cypress:server:preprocessor");
const Promise = require("bluebird");
const appData = require("../util/app_data");
const cwd = require("../cwd");
const plugins = require("../plugins");
const resolve = require("./resolve");

const errorMessage = function(err = {}) {
  let left, left1;
  return ((left = (left1 = err.stack != null ? err.stack : err.annotated) != null ? left1 : err.message) != null ? left : err.toString())
  //# strip out stack noise from parser like
  //# at Parser.pp$5.raise (/path/to/node_modules/babylon/lib/index.js:4215:13)
  .replace(/\n\s*at.*/g, "")
  .replace(/From previous event:\n?/g, "");
};

const clientSideError = function(err) {
  console.log(err.message);

  err = errorMessage(err);

  return `\
(function () {
  Cypress.action("spec:script:error", {
    type: "BUNDLE_ERROR",
    error: ${JSON.stringify(err)}
  })
}())\
`;
};

const baseEmitter = new EE();
let fileObjects = {};
let fileProcessors = {};

const createBrowserifyPreprocessor = function(options) {
  debug("creating browserify preprocessor with options %o", options);
  const browserify = require("@cypress/browserify-preprocessor");
  return browserify(options);
};

const setDefaultPreprocessor = function(config) {
  debug("set default preprocessor");

  const tsPath = resolve.typescript(config);

  const options = {
    typescript: tsPath
  };
  return plugins.register("file:preprocessor", API.createBrowserifyPreprocessor(options));
};

plugins.registerHandler(function(ipc) {
  ipc.on("preprocessor:rerun", function(filePath) {
    debug("ipc preprocessor:rerun event");
    return baseEmitter.emit("file:updated", filePath);
  });

  return baseEmitter.on("close", function(filePath) {
    debug("base emitter plugin close event");
    return ipc.send("preprocessor:close", filePath);
  });
});

// for simpler stubbing from unit tests
var API = {
  errorMessage,

  clientSideError,

  setDefaultPreprocessor,

  createBrowserifyPreprocessor,

  emitter: baseEmitter,

  getFile(filePath, config) {
    let fileObject, fileProcessor;
    debug(`getting file ${filePath}`);
    filePath = path.resolve(config.projectRoot, filePath);

    debug(`getFile ${filePath}`);

    if (!(fileObject = fileObjects[filePath])) {
      //# we should be watching the file if we are NOT
      //# in a text terminal aka cypress run
      //# TODO: rename this to config.isRunMode
      //# vs config.isInterativeMode
      const shouldWatch = !config.isTextTerminal || Boolean(process.env.CYPRESS_INTERNAL_FORCE_FILEWATCH);

      const baseFilePath = filePath
      .replace(config.projectRoot, "")
      .replace(config.integrationFolder, "");

      fileObject = (fileObjects[filePath] = _.extend(new EE(), {
        filePath,
        shouldWatch,
        outputPath: appData.getBundledFilePath(config.projectRoot, baseFilePath)
      }));

      fileObject.on("rerun", function() {
        debug("file object rerun event");
        return baseEmitter.emit("file:updated", filePath);
      });

      baseEmitter.once("close", function() {
        debug("base emitter native close event");
        return fileObject.emit("close");
      });
    }

    if (!plugins.has("file:preprocessor")) {
      setDefaultPreprocessor(config);
    }

    if (config.isTextTerminal && (fileProcessor = fileProcessors[filePath])) {
      debug("headless and already processed");
      return fileProcessor;
    }

    const preprocessor = (fileProcessors[filePath] = Promise.try(() => plugins.execute("file:preprocessor", fileObject)));

    return preprocessor;
  },

  removeFile(filePath, config) {
    let fileObject;
    filePath = path.resolve(config.projectRoot, filePath);

    if (!fileProcessors[filePath]) { return; }

    debug(`removeFile ${filePath}`);

    baseEmitter.emit("close", filePath);

    if (fileObject = fileObjects[filePath]) {
      fileObject.emit("close");
    }

    delete fileObjects[filePath];
    return delete fileProcessors[filePath];
  },

  close() {
    debug("close preprocessor");

    fileObjects = {};
    fileProcessors = {};
    baseEmitter.emit("close");
    return baseEmitter.removeAllListeners();
  }
};

module.exports = API;
