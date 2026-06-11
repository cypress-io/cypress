import _ from 'lodash'
import { EventEmitter } from 'events'
import path from 'path'
import debug from 'debug'
import Promise from 'bluebird'
import * as appData from '../util/app_data'
import * as plugins from '../plugins'
import { telemetry } from '@packages/telemetry'
import type { PluginIpcHandler, PreprocessorError } from '@packages/types'
import type { Cfg } from '../project-base'

const debugFn = debug('cypress:server:preprocessor')

// Interface for file objects that extend EventEmitter with additional properties
interface FileObject extends EventEmitter {
  filePath: string
  shouldWatch: boolean
  outputPath: string
  on(event: 'rerun', listener: () => void): this
  on(event: 'close', listener: () => void): this
  emit(event: 'rerun'): boolean
  emit(event: 'close'): boolean
}

const errorMessage = function (err: PreprocessorError = {} as PreprocessorError): string {
  return err.stack || err.annotated || err.message || err.toString()
}

const clientSideError = function (err: PreprocessorError): string {
  // eslint-disable-next-line no-console
  console.log(err.message)

  const errorString = errorMessage(err)

  return `\
(function () {
  Cypress.action("spec:script:error", {
    type: "BUNDLE_ERROR",
    error: ${JSON.stringify(errorString)}
  })
}())\
`
}

const baseEmitter = new EventEmitter()
let fileObjects: Record<string, FileObject> = {}
let fileProcessors: Record<string, Promise<string>> = {}

plugins.registerHandler((ipc: PluginIpcHandler) => {
  ipc.on('preprocessor:rerun', (filePath: string) => {
    debugFn('ipc preprocessor:rerun event')

    baseEmitter.emit('file:updated', filePath)
  })

  baseEmitter.on('close', (filePath: string) => {
    debugFn('base emitter plugin close event')
    ipc.send('preprocessor:close', filePath)
  })
})

// for simpler stubbing from unit tests
interface PreprocessorAPI {
  errorMessage: (err?: PreprocessorError) => string
  clientSideError: (err: PreprocessorError) => string
  emitter: EventEmitter
  getFile: (filePath: string, config: Cfg) => Promise<string>
  removeFile: (filePath: string, config: Cfg) => void
  close: () => void
}

const API: PreprocessorAPI = {
  errorMessage,

  clientSideError,

  emitter: baseEmitter,

  getFile (filePath: string, config: Cfg) {
    let fileObject: FileObject

    debugFn(`getting file ${filePath}`)
    filePath = path.resolve(config.projectRoot, filePath)

    debugFn(`getFile ${filePath}`)

    if (!(fileObject = fileObjects[filePath])) {
      // we should be watching the file if we are NOT
      // in a text terminal aka cypress run
      // TODO: rename this to config.isRunMode
      // vs config.isInteractiveMode
      const shouldWatch = !config.isTextTerminal || Boolean(process.env.CYPRESS_INTERNAL_FORCE_FILEWATCH)

      const baseFilePath = filePath.replace(config.projectRoot, '')

      fileObject = (fileObjects[filePath] = _.extend(new EventEmitter(), {
        filePath,
        shouldWatch,
        outputPath: appData.getBundledFilePath(config.projectRoot, baseFilePath),
      }))

      fileObject.on('rerun', () => {
        debugFn('file object rerun event')

        return baseEmitter.emit('file:updated', filePath)
      })

      baseEmitter.once('close', () => {
        debugFn('base emitter native close event')

        return fileObject.emit('close')
      })
    }

    // Check if we already have a processor for this file in headless mode
    if (config.isTextTerminal && filePath in fileProcessors) {
      debugFn('headless and already processed')

      return fileProcessors[filePath]
    }

    const preprocessor = (fileProcessors[filePath] = Promise.try(() => {
      const span = telemetry.startSpan({ name: 'file:preprocessor' })

      return plugins.execute('file:preprocessor', fileObject).then((arg: string) => {
        span?.setAttribute('file', arg)
        span?.end()

        return arg
      })
    }))

    return preprocessor
  },

  removeFile (filePath: string, config: Cfg) {
    let fileObject: FileObject

    filePath = path.resolve(config.projectRoot, filePath)

    if (!(filePath in fileProcessors)) {
      return
    }

    debugFn(`removeFile ${filePath}`)

    baseEmitter.emit('close', filePath)

    fileObject = fileObjects[filePath]

    if (fileObject) {
      fileObject.emit('close')
    }

    delete fileObjects[filePath]

    delete fileProcessors[filePath]
  },

  close () {
    debugFn('close preprocessor')

    fileObjects = {}
    fileProcessors = {}
    baseEmitter.emit('close')

    baseEmitter.removeAllListeners()
  },
}

export default API
