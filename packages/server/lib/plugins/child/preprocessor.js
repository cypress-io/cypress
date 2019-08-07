const _ = require('lodash')
const EE = require('events')
const util = require('../util')

const fileObjects = {}

const wrap = (ipc, invoke, ids, args) => {
  const file = _.pick(args[0], 'filePath', 'outputPath', 'shouldWatch')
  let childFile = fileObjects[file.filePath]

  // the emitter methods don't come through from the parent process
  // so we have to re-apply them here
  if (!childFile) {
    childFile = fileObjects[file.filePath] = _.extend(new EE(), file)
    childFile.on('rerun', () => {
      ipc.send('preprocessor:rerun', file.filePath)
    })

    ipc.on('preprocessor:close', (filePath) => {
      // no filePath means close all
      if (!filePath || filePath === file.filePath) {
        delete fileObjects[file.filePath]
        childFile.emit('close')
      }
    })
  }

  util.wrapChildPromise(ipc, invoke, ids, [childFile])
}

module.exports = {
  wrap,

  // for testing purposes
  _clearFiles: () => {
    for (let file in fileObjects) delete fileObjects[file]
  },
  _getFiles: () => {
    return fileObjects
  },
}
