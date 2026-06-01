import _ from 'lodash'
import EE from 'events'
import * as util from '../util'
import type { PluginChildIpc, PluginInvokeIds, PreprocessorFileObject } from './types'

let fileObjects: Record<string, PreprocessorFileObject> = {}

let wrappedClose = false

export const wrap = (
  ipc: PluginChildIpc,
  invoke: (eventId: number, args?: any[]) => any,
  ids: PluginInvokeIds,
  args: any[],
): void => {
  const file = _.pick(args[0], 'filePath', 'outputPath', 'shouldWatch')
  let childFile = fileObjects[file.filePath]

  // https://github.com/cypress-io/cypress/issues/1305
  // TODO: Move this to RunPlugins so we don't need to guard this way
  if (!wrappedClose) {
    wrappedClose = true
    ipc.on('preprocessor:close', (filePath?: string) => {
      // no filePath means close all
      if (!filePath) {
        Object.values(fileObjects).forEach((_child) => {
          _child.emit('close')
        })

        fileObjects = {}
      } else {
        const _child = fileObjects[filePath]

        if (!_child) {
          return
        }

        delete fileObjects[filePath]
        _child.emit('close')
      }
    })
  }

  // the emitter methods don't come through from the parent process
  // so we have to re-apply them here
  if (!childFile) {
    childFile = fileObjects[file.filePath] = _.extend(new EE(), file) as PreprocessorFileObject
    childFile.on('rerun', () => {
      ipc.send('preprocessor:rerun', file.filePath)
    })
  }

  util.wrapChildPromise(ipc, invoke, ids, [childFile])
}

export const _clearFiles = (): void => {
  for (const file in fileObjects) {
    delete fileObjects[file]
  }
}

export const _getFiles = (): Record<string, PreprocessorFileObject> => {
  return fileObjects
}
