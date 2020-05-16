const { SourceMapConsumer } = require('source-map')
const Promise = require('bluebird')

const baseSourceMapRegex = '\\s*[@#]\\s*sourceMappingURL\\s*=\\s*([^\\s]*)(?![\\S\\s]*sourceMappingURL)'
const regexCommentStyle1 = new RegExp(`/\\*${baseSourceMapRegex}\\s*\\*/`) // matches /* ... */ comments
const regexCommentStyle2 = new RegExp(`//${baseSourceMapRegex}($|\n|\r\n?)`) // matches // .... comments
const regexDataUrl = /data:[^;\n]+(?:;charset=[^;\n]+)?;base64,([a-zA-Z0-9+/]+={0,2})/ // matches data urls

let sourceMapConsumers = {}

const initialize = (file, sourceMapBase64) => {
  SourceMapConsumer.initialize({
    'lib/mappings.wasm': require('source-map/lib/mappings.wasm'),
  })

  const sourceMap = base64toJs(sourceMapBase64)

  return Promise.resolve(new SourceMapConsumer(sourceMap)).then((consumer) => {
    sourceMapConsumers[file.fullyQualifiedUrl] = consumer

    return consumer
  })
}

const extractSourceMap = (file, fileContents) => {
  const sourceMapMatch = fileContents.match(regexCommentStyle1) || fileContents.match(regexCommentStyle2)

  if (!sourceMapMatch) return Promise.resolve(null)

  const url = sourceMapMatch[1]
  const dataUrlMatch = url.match(regexDataUrl)

  if (!dataUrlMatch) return Promise.resolve(null)

  const sourceMapBase64 = dataUrlMatch[1]

  return initialize(file, sourceMapBase64)
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
  const mapString = atob(base64)

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
}
