const _ = require('lodash')
const EE = require('events')
const util = require('../util')

const configs = {}

const wrap = (ipc, invoke, ids, args) => {
  const config = _.pick(args[0], 'filePath', 'outputPath', 'shouldWatch')
  let enhancedConfig = configs[config.filePath]
  if (!enhancedConfig) {
    enhancedConfig = configs[config.filePath] = _.extend(new EE(), config)
    enhancedConfig.on('rerun', () => {
      ipc.send('preprocessor:rerun', config.filePath)
    })
    ipc.on('preprocessor:close', (filePath) => {
      // no filePath means close all
      if (!filePath || filePath === config.filePath) {
        delete configs[filePath]
        enhancedConfig.emit('close')
      }
    })
  }
  util.wrapChildPromise(ipc, invoke, ids, [enhancedConfig])
}

module.exports = {
  wrap,
}
