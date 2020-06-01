const _ = require('lodash')
const { SourceMapConsumer } = require('source-map')
const Promise = require('bluebird')

const $utils = require('./utils')

const sourceMapExtractionRegex = /\/\/\s*[@#]\s*sourceMappingURL\s*=\s*(data:[^\s]*)/g
const regexDataUrl = /data:[^;\n]+(?:;charset=[^;\n]+)?;base64,([a-zA-Z0-9+/]+={0,2})/ // matches data urls

let sourceMapConsumers = {}

const initializeSourceMapConsumer = (file, sourceMap) => {
  if (!sourceMap) return Promise.resolve(null)

  SourceMapConsumer.initialize({
    'lib/mappings.wasm': require('source-map/lib/mappings.wasm'),
  })

  return Promise.resolve(new SourceMapConsumer(sourceMap)).then((consumer) => {
    sourceMapConsumers[file.fullyQualifiedUrl] = consumer

    return consumer
  })
}

const extractSourceMap = (file, fileContents) => {
  let sourceMapMatch = fileContents.match(sourceMapExtractionRegex)

  if (!sourceMapMatch) return null

  const url = _.last(sourceMapMatch)
  const dataUrlMatch = url.match(regexDataUrl)

  if (!dataUrlMatch) return null

  const sourceMapBase64 = dataUrlMatch[1]
  const sourceMap = base64toJs(sourceMapBase64)

  return sourceMap
}

const getSourceContents = (filePath, sourceFile) => {
  if (!sourceMapConsumers[filePath]) return null

  try {
    return sourceMapConsumers[filePath].sourceContentFor(sourceFile)
  } catch (err) {
    // ignore the sourceFile not being in the source map. there's nothing we
    // can do about it and we don't want to thrown an exception
    if (err && err.message.indexOf('not in the SourceMap') > -1) return

    throw err
  }
}

const getSourcePosition = (filePath, position) => {
  if (!sourceMapConsumers[filePath]) return null

  const sourcePosition = sourceMapConsumers[filePath].originalPositionFor(position)
  const { source: file, line, column } = sourcePosition

  if (!file || line == null || column == null) return

  return {
    file,
    line,
    column,
  }
}

const base64toJs = (base64) => {
  const mapString = $utils.decodeBase64Unicode(base64)

  try {
    return JSON.parse(mapString)
  } catch (err) {
    return null
  }
}

module.exports = {
  extractSourceMap,
  getSourceContents,
  getSourcePosition,
  initializeSourceMapConsumer,
}
