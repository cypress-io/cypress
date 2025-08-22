import _ from 'lodash'
import { EventEmitter } from 'events'
import Promise from 'bluebird'
import path from 'path'
import type { CompilerErrorLocation, ProcessIpcWrapper, TransformError } from '@packages/types'
import type { SerializedError, ErrorLike } from '@packages/errors'

const UNDEFINED_SERIALIZED = '__cypress_undefined__'

interface ErrorLocationResult {
  compilerErrorLocation: CompilerErrorLocation | null
  originalMessage: string
  message: string
}

interface InvokeIds {
  eventId: string
  invocationId: string
}

/**
 * Interface for process-like objects that can communicate via IPC
 * Covers Node.js process, ChildProcess objects, and test mocks
 */
interface ProcessLike {
  on(event: 'message', listener: (message: { event: string, args: unknown[] }) => void): void
  killed?: boolean
  connected?: boolean
  send(message: { event: string, args: unknown[] }): boolean | void
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
  wrapChildPromise: (ipc: ProcessIpcWrapper, invoke: (eventId: string, args: unknown[]) => unknown, ids: InvokeIds, args?: unknown[]) => Promise<void>
}

const API: UtilAPI = {
  buildErrorLocationFromTransformError,

  serializeError,

  nonNodeRequires () {
    return Object.keys(require.cache).filter((c) => !c.includes('/node_modules/'))
  },

  wrapIpc (aProcess: ProcessLike) {
    const emitter = new EventEmitter()

    aProcess.on('message', (message: { event: string, args: unknown[] }) => {
      return emitter.emit(message.event, ...message.args)
    })

    // prevent max listeners warning on ipc
    // @see https://github.com/cypress-io/cypress/issues/1305#issuecomment-780895569
    emitter.setMaxListeners(Infinity)

    return {
      send (event: string, ...args: unknown[]) {
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

  wrapChildPromise (ipc: ProcessIpcWrapper, invoke: (eventId: string, args: unknown[]) => unknown, ids: InvokeIds, args: unknown[] = []) {
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
    }).catch((err: unknown) => {
      // Ensure we have a valid error object for serializeError
      const error = err instanceof Error ? err : new Error(String(err))

      return ipc.send(`promise:fulfilled:${ids.invocationId}`, serializeError(error as ErrorLike))
    })
  },
}

export default API
