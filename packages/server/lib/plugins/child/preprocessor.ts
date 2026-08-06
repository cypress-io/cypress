import _ from 'lodash'
import EE from 'events'
import * as util from '../util'
import type { PluginChildIpc, PluginInvokeIds, PreprocessorFileObject } from './types'

const fileObjects: Record<string, PreprocessorFileObject> = {}

export const wrap = (
  ipc: PluginChildIpc,
  invoke: (eventId: number, args?: any[]) => any,
  ids: PluginInvokeIds,
  args: any[],
): void => {
  const file = _.pick(args[0], 'filePath', 'outputPath', 'shouldWatch')
  let childFile = fileObjects[file.filePath]

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

const closeFile = (filePath: string) => {
  const file = fileObjects[filePath]

  if (!file) {
    return
  }

  delete fileObjects[filePath]
  file.emit('close')
}

// no filePath means close all
export const close = (filePath?: string): void => {
  if (filePath) {
    closeFile(filePath)

    return
  }

  Object.keys(fileObjects).forEach((path) => closeFile(path))
}

export const _clearFiles = (): void => {
  for (const file in fileObjects) {
    delete fileObjects[file]
  }
}

export const _getFiles = (): Record<string, PreprocessorFileObject> => {
  return fileObjects
}
