import _ from 'lodash'
import EE from 'events'
import Bluebird from 'bluebird'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import type { CompilerErrorLocation, ProcessIpcWrapper, TransformError } from '@packages/types'
import { stackUtils } from '@packages/errors'
import type { SerializedError } from '@packages/errors'
import type { PluginInvokeIds } from './child/types'

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

const MODULE_NOT_FOUND_SPECIFIER = /Cannot find module '([^']+)'/

const stackFramePath = (framePath: string) => {
  return framePath.startsWith('file://') ? fileURLToPath(framePath) : framePath
}

const columnForModuleReference = (lineContent: string, specifier: string) => {
  const requireIndex = lineContent.indexOf('require(')
  const importIndex = lineContent.indexOf('import(')

  if (requireIndex >= 0) {
    return requireIndex + 1
  }

  if (importIndex >= 0) {
    return importIndex + 1
  }

  const specifierIndex = lineContent.indexOf(specifier)

  return specifierIndex >= 0 ? specifierIndex + 1 : 1
}

/**
 * Node 24 + tsx no longer always includes the config file frame in err.stack (only node/tsx
 * internals remain). When stack parsing fails, fall back to requireStack and locate the
 * failing import/require call in the config file.
 */
export const buildErrorLocationFromConfigFileError = async (
  err: Error & { requireStack?: string[] },
  configFilePath: string,
  projectRoot: string,
): Promise<CompilerErrorLocation | null> => {
  const resolvedConfigPath = path.resolve(configFilePath)

  if (err.stack) {
    const stackLines = stackUtils.getStackLines(err.stack)

    for (let stackLineIndex = stackLines.length - 1; stackLineIndex >= 0; stackLineIndex--) {
      const parsed = stackUtils.parseStackLine(stackLines[stackLineIndex])

      if (!parsed) {
        continue
      }

      const framePath = stackFramePath(parsed.absolute)

      if (framePath === resolvedConfigPath) {
        return {
          filePath: path.relative(projectRoot, framePath),
          line: parsed.line,
          column: parsed.column,
        }
      }
    }
  }

  const requireStack = err.requireStack

  if (!requireStack?.includes(resolvedConfigPath)) {
    return null
  }

  const moduleMatch = MODULE_NOT_FOUND_SPECIFIER.exec(err.message)

  if (!moduleMatch?.[1]) {
    return null
  }

  const specifier = moduleMatch[1]
  const lines = (await fs.readFile(resolvedConfigPath, 'utf8')).split('\n')

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const lineContent = lines[lineIndex]

    if (!lineContent.includes(specifier)) {
      continue
    }

    return {
      filePath: path.relative(projectRoot, resolvedConfigPath),
      line: lineIndex + 1,
      column: columnForModuleReference(lineContent, specifier),
    }
  }

  return null
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
  return Bluebird.try(() => {
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
}
