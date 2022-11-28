const _ = require('lodash')
const EE = require('events')
const util = require('../util')

let fileObjects = {}

let wrappedClose = false

const wrap = (ipc, invoke, ids, args) => {
  const file = _.pick(args[0], 'filePath', 'outputPath', 'shouldWatch')
  let childFile = fileObjects[file.filePath]

  // https://github.com/cypress-io/cypress/issues/1305
  // TODO: Move this to RunPlugins so we don't need to guard this way
  if (!wrappedClose) {
    wrappedClose = true
    ipc.on('preprocessor:close', (filePath) => {
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
    childFile = fileObjects[file.filePath] = _.extend(new EE(), file)
    childFile.on('rerun', () => {
      ipc.send('preprocessor:rerun', file.filePath)
    })
  }

  util.wrapChildPromise(ipc, invoke, ids, [childFile])
}

module.exports = {
  wrap,

  // for testing purposes
  _clearFiles: () => {
    for (let file in fileObjects) {
      delete fileObjects[file]
    }
  },

  _getFiles: () => {
    return fileObjects
  },
}
