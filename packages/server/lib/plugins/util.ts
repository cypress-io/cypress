import _ from 'lodash'
import EE from 'events'
import Promise from 'bluebird'
import path from 'path'
import Debug from 'debug'
import type Bluebird from 'bluebird'
import type { CompilerErrorLocation, ProcessIpcWrapper, TransformError } from '@packages/types'
import type { SerializedError } from '@packages/errors'
import type { PluginInvokeIds } from './child/types'

const debug = Debug('cypress:server:plugins:util')

const UNDEFINED_SERIALIZED = '__cypress_undefined__'

interface BuildErrorLocationResult {
  compilerErrorLocation: CompilerErrorLocation | null
  originalMessage: string
  message: string
}

export const buildErrorLocationFromTransformError = (
  err: TransformError,
  projectRoot: string,
): BuildErrorLocationResult => {
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

export const serializeError = (err: Error & Partial<SerializedError>): SerializedError => {
  const obj = _.pick(err,
    'name', 'message', 'stack', 'code', 'annotated', 'type',
    'details', 'isCypressErr', 'messageMarkdown',
    'originalError',
    // Location of the error when a TransformError or a esbuild error occurs (parse error from ts-node or esbuild)
    'compilerErrorLocation') as SerializedError

  if (obj.originalError) {
    obj.originalError = serializeError(obj.originalError as Error & Partial<SerializedError>)
  }

  return obj
}

export const nonNodeRequires = (): string[] => {
  return Object.keys(require.cache).filter((c) => !c.includes('/node_modules/'))
}

export interface WrappedIpcProcess {
  killed?: boolean
  connected?: boolean
  send: (message: { event: string, args: any[] }) => void
  on: (event: 'message', listener: (message: { event: string, args: any[] }) => void) => void
}

export const wrapIpc = (aProcess: WrappedIpcProcess): ProcessIpcWrapper => {
  const emitter = new EE()

  aProcess.on('message', (message) => {
    return emitter.emit(message.event, ...message.args)
  })

  // prevent max listeners warning on ipc
  // @see https://github.com/cypress-io/cypress/issues/1305#issuecomment-780895569
  emitter.setMaxListeners(Infinity)

  return {
    send (event, ...args) {
      if (aProcess.killed || !aProcess.connected) {
        debug('not sending ipc event %s; process killed: %o, connected: %o', event, aProcess.killed, aProcess.connected)

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
}

export const wrapChildPromise = (
  ipc: ProcessIpcWrapper,
  invoke: (eventId: number, args?: any[]) => any,
  ids: PluginInvokeIds,
  args: any[] = [],
): Bluebird<void> => {
  const invokedAt = Date.now()

  return Promise.try(() => {
    return invoke(ids.eventId, args)
  })
  .then((value) => {
    debug('invocation %s (event id %d) fulfilled after %dms', ids.invocationId, ids.eventId, Date.now() - invokedAt)

    // undefined is coerced into null when sent over ipc, but we need
    // to differentiate between them for 'task' event
    if (value === undefined) {
      value = UNDEFINED_SERIALIZED
    }

    return ipc.send(`promise:fulfilled:${ids.invocationId}`, null, value)
  }).catch((err) => {
    debug('invocation %s (event id %d) rejected after %dms: %o', ids.invocationId, ids.eventId, Date.now() - invokedAt, err)

    return ipc.send(`promise:fulfilled:${ids.invocationId}`, serializeError(err))
  })
}
