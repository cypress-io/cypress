import _ from 'lodash'
import { EventEmitter } from 'events'
import Promise from 'bluebird'
import path from 'path'

const UNDEFINED_SERIALIZED = '__cypress_undefined__'

interface CompilerErrorLocation {
  filePath: string
  line: number
  column: number
}

interface ErrorLocationResult {
  compilerErrorLocation: CompilerErrorLocation | null
  originalMessage: string
  message: string
}

interface SerializedError {
  name?: string
  message?: string
  stack?: string
  code?: string
  annotated?: string
  type?: string
  details?: string | Record<string, unknown>
  isCypressErr?: boolean
  messageMarkdown?: string
  originalError?: SerializedError
  compilerErrorLocation?: CompilerErrorLocation
}

/**
 * Interface for wrapping child processes with EventEmitter functionality
 * Used by wrapIpc() to create a communication layer between parent and child processes
 * Provides send/receive capabilities while maintaining EventEmitter event handling
 */
interface ProcessIpcWrapper {
  send: (event: string, ...args: any[]) => void
  on: (event: string, listener: (...args: any[]) => void) => EventEmitter
  removeListener: (event: string, listener: (...args: any[]) => void) => EventEmitter
}

interface InvokeIds {
  eventId: string
  invocationId: string
}

/**
 * Interface for errors that can occur during file transformation/compilation
 * Covers TransformError (tsx) and esbuild errors with location information
 */
interface TransformError extends Error {
  name: string
  message: string
  errors?: Array<{
    location?: {
      file: string
      line: number
      column: number
    }
  }>
}

/**
 * Interface for any object that can be serialized as an error
 * Covers Node.js errors, Cypress errors, and custom error objects
 */
interface ErrorLike {
  name?: string
  message?: string
  stack?: string
  code?: string
  annotated?: string
  type?: string
  details?: string | Record<string, unknown>
  isCypressErr?: boolean
  messageMarkdown?: string
  originalError?: ErrorLike
  compilerErrorLocation?: CompilerErrorLocation
  [key: string]: any // Allow additional properties
}

/**
 * Interface for process-like objects that can communicate via IPC
 * Covers Node.js process, ChildProcess objects, and test mocks
 */
interface ProcessLike {
  on(event: 'message', listener: (message: { event: string, args: any[] }) => void): void
  killed?: boolean
  connected?: boolean
  send(message: { event: string, args: any[] }): boolean | void
}

const buildErrorLocationFromTransformError = (err: TransformError, projectRoot: string): ErrorLocationResult => {
  const cleanMessage = err.message
  // replace the first line with better text (remove potentially misleading word TypeScript for example)
  .replace(/^.*\n/g, 'Error compiling file\n')

  // Regex to pull out the error from the message body of a tsx TransformError. It displays the relative path to a file
  const transformErrorRegex = /\n(.*?):(\d+):(\d+):/g
  const failurePath = transformErrorRegex.exec(cleanMessage)

  return {
    compilerErrorLocation: failurePath ? { filePath: path.relative(projectRoot, failurePath[1]), line: Number(failurePath[2]), column: Number(failurePath[3]) } : null,
    originalMessage: err.message,
    message: cleanMessage,
  }
}

const serializeError = (err: ErrorLike): SerializedError => {
  const obj = _.pick(err,
    'name', 'message', 'stack', 'code', 'annotated', 'type',
    'details', 'isCypressErr', 'messageMarkdown',
    'originalError',
    // Location of the error when a TransformError or a esbuild error occurs (parse error from ts-node or esbuild)
    'compilerErrorLocation')

  if (obj.originalError) {
    obj.originalError = serializeError(obj.originalError)
  }

  return obj
}

interface UtilAPI {
  buildErrorLocationFromTransformError: (err: TransformError, projectRoot: string) => ErrorLocationResult
  serializeError: (err: ErrorLike) => SerializedError
  nonNodeRequires: () => string[]
  wrapIpc: (aProcess: ProcessLike) => ProcessIpcWrapper
  wrapChildPromise: (ipc: ProcessIpcWrapper, invoke: (eventId: string, args: any[]) => any, ids: InvokeIds, args?: any[]) => Promise<void>
}

const API: UtilAPI = {
  buildErrorLocationFromTransformError,

  serializeError,

  nonNodeRequires () {
    return Object.keys(require.cache).filter((c) => !c.includes('/node_modules/'))
  },

  wrapIpc (aProcess: ProcessLike) {
    const emitter = new EventEmitter()

    aProcess.on('message', (message: { event: string, args: any[] }) => {
      return emitter.emit(message.event, ...message.args)
    })

    // prevent max listeners warning on ipc
    // @see https://github.com/cypress-io/cypress/issues/1305#issuecomment-780895569
    emitter.setMaxListeners(Infinity)

    return {
      send (event: string, ...args: any[]) {
        if (aProcess.killed || !aProcess.connected) {
          return
        }

        return aProcess.send({
          event,
          args,
        })
      },

      on: emitter.on.bind(emitter),
      removeListener: emitter.removeListener.bind(emitter),
    }
  },

  wrapChildPromise (ipc: ProcessIpcWrapper, invoke: (eventId: string, args: any[]) => any, ids: InvokeIds, args: any[] = []) {
    return Promise.try(() => {
      return invoke(ids.eventId, args)
    })
    .then((value) => {
      // undefined is coerced into null when sent over ipc, but we need
      // to differentiate between them for 'task' event
      if (value === undefined) {
        value = UNDEFINED_SERIALIZED
      }

      return ipc.send(`promise:fulfilled:${ids.invocationId}`, null, value)
    }).catch((err) => {
      return ipc.send(`promise:fulfilled:${ids.invocationId}`, serializeError(err))
    })
  },
}

export default API
