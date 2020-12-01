require('../cwd')

const _ = require('lodash')
const EE = require('events')
const path = require('path')
const debug = require('debug')('cypress:ct:devserver')
const Promise = require('bluebird')
const appData = require('../util/app_data')
const plugins = require('../plugins')

const baseEmitter = new EE()
let fileObjects = {}
let fileProcessors = {}

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
  emitter: baseEmitter,

  getFile (filePath, config) {
    debugger
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

      debug('should watch', shouldWatch)

      fileObject = (fileObjects[filePath] = _.extend(new EE(), {
        filePath,
        shouldWatch,
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
