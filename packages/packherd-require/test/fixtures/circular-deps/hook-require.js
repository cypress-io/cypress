const debug = require('debug')
const path = require('path')
const definitions = require('./definitions')
const { packherdRequire } = require('../../../')
const entryFile = require.resolve('./lib/entry')

const logDebug = debug('packherd:debug')

function getModuleKey({ moduleUri, baseDir }) {
  const moduleRelativePath = path.isAbsolute(moduleUri)
    ? path.relative(baseDir, moduleUri)
    : moduleUri

  logDebug({ baseDir, moduleUri, moduleRelativePath })
  return {
    moduleKey: moduleUri,
    moduleRelativePath,
  }
}

const projectBaseDir = path.dirname(entryFile)
packherdRequire(projectBaseDir, {
  diagnosticsEnabled: true,
  moduleDefinitions: definitions,
  getModuleKey,
})
