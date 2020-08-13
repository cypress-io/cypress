require('../cwd')

const _ = require('lodash')
const EE = require('events')
const path = require('path')
const debug = require('debug')('cypress:server:preprocessor')
const Promise = require('bluebird')
const appData = require('../util/app_data')
const plugins = require('../plugins')
const resolve = require('./resolve')

const errorMessage = function (err = {}) {
  return (err.stack || err.annotated || err.message || err.toString())
  .replace(/\n\s*at.*/g, '')
  .replace(/From previous event:\n?/g, '')
}

const clientSideError = function (err) {
  // eslint-disable-next-line no-console
  console.log(err.message)

  err = errorMessage(err)

  return `\
(function () {
  Cypress.action("spec:script:error", {
    type: "BUNDLE_ERROR",
    error: ${JSON.stringify(err)}
  })
}())\
`
}

const baseEmitter = new EE()
let fileObjects = {}
let fileProcessors = {}

const createPreprocessor = function (options) {
  debug('creating webpack preprocessor with options %o', options)

  const webpackPreprocessor = require('@cypress/webpack-batteries-included-preprocessor')

  return webpackPreprocessor(options)
}

const setDefaultPreprocessor = function (config) {
  debug('set default preprocessor')

  const tsPath = resolve.typescript(config)

  const options = {
    typescript: tsPath,
  }

  return plugins.register('file:preprocessor', API.createPreprocessor(options))
}

plugins.registerHandler((ipc) => {
  ipc.on('preprocessor:rerun', (filePath) => {
    debug('ipc preprocessor:rerun event')

    return baseEmitter.emit('file:updated', filePath)
  })

  return baseEmitter.on('close', (filePath) => {
    debug('base emitter plugin close event')

    return ipc.send('preprocessor:close', filePath)
  })
})

// for simpler stubbing from unit tests
const API = {
  errorMessage,

  clientSideError,

  setDefaultPreprocessor,

  createPreprocessor,

  emitter: baseEmitter,

  getFile (filePath, config) {
    let fileObject; let fileProcessor

    debug(`getting file ${filePath}`)
    filePath = path.resolve(config.projectRoot, filePath)

    debug(`getFile ${filePath}`)

    if (!(fileObject = fileObjects[filePath])) {
      // we should be watching the file if we are NOT
      // in a text terminal aka cypress run
      // TODO: rename this to config.isRunMode
      // vs config.isInterativeMode
      const shouldWatch = !config.isTextTerminal || Boolean(process.env.CYPRESS_INTERNAL_FORCE_FILEWATCH)

      const baseFilePath = filePath
      .replace(config.projectRoot, '')
      .replace(config.integrationFolder, '')

      fileObject = (fileObjects[filePath] = _.extend(new EE(), {
        filePath,
        shouldWatch,
        outputPath: appData.getBundledFilePath(config.projectRoot, baseFilePath),
      }))

      fileObject.on('rerun', () => {
        debug('file object rerun event')

        return baseEmitter.emit('file:updated', filePath)
      })

      baseEmitter.once('close', () => {
        debug('base emitter native close event')

        return fileObject.emit('close')
      })
    }

    if (!plugins.has('file:preprocessor')) {
      setDefaultPreprocessor(config)
    }

    if (config.isTextTerminal && (fileProcessor = fileProcessors[filePath])) {
      debug('headless and already processed')

      return fileProcessor
    }

    const preprocessor = (fileProcessors[filePath] = Promise.try(() => {
      return plugins.execute('file:preprocessor', fileObject)
    }))

    return preprocessor
  },

  removeFile (filePath, config) {
    let fileObject

    filePath = path.resolve(config.projectRoot, filePath)

    if (!fileProcessors[filePath]) {
      return
    }

    debug(`removeFile ${filePath}`)

    baseEmitter.emit('close', filePath)

    fileObject = fileObjects[filePath]

    if (fileObject) {
      fileObject.emit('close')
    }

    delete fileObjects[filePath]

    return delete fileProcessors[filePath]
  },

  close () {
    debug('close preprocessor')

    fileObjects = {}
    fileProcessors = {}
    baseEmitter.emit('close')

    return baseEmitter.removeAllListeners()
  },
}

module.exports = API
