const { SourceMapConsumer } = require('source-map')

const baseSourceMapRegex = '\\s*[@#]\\s*sourceMappingURL\\s*=\\s*([^\\s]*)(?![\\S\\s]*sourceMappingURL)'
const regexCommentStyle1 = new RegExp(`/\\*${baseSourceMapRegex}\\s*\\*/`) // matches /* ... */ comments
const regexCommentStyle2 = new RegExp(`//${baseSourceMapRegex}($|\n|\r\n?)`) // matches // .... comments
const regexDataUrl = /data:[^;\n]+(?:;charset=[^;\n]+)?;base64,([a-zA-Z0-9+/]+={0,2})/ // matches data urls

let sourceMapConsumers = {}

const initialize = (file, sourceMapBase64) => {
  SourceMapConsumer.initialize({
    'lib/mappings.wasm': require('source-map/lib/mappings.wasm'),
  })

  const sourceMap = base64toJson(sourceMapBase64)

  return (new SourceMapConsumer(sourceMap)).then((consumer) => {
    sourceMapConsumers[file.relativeUrl] = {
      consumer,
      file,
    }
  })
}

const extractSourceMap = (file, fileContents) => {
  const sourceMapMatch = fileContents.match(regexCommentStyle1) || fileContents.match(regexCommentStyle2)

  if (!sourceMapMatch) {
    return
  }

  const url = sourceMapMatch[1]
  const dataUrlMatch = url.match(regexDataUrl)

  if (!dataUrlMatch) {
    return
  }

  const sourceMapBase64 = dataUrlMatch[1]

  return initialize(file, sourceMapBase64)
}

const getSourceContents = (filePath) => {
  if (!sourceMapConsumers[filePath]) return null

  const { consumer, file } = sourceMapConsumers[filePath]

  return consumer.sourceContentFor(file.relative)
}

const getSourcePosition = (filePath, position) => {
  if (!sourceMapConsumers[filePath]) return null

  const { consumer } = sourceMapConsumers[filePath]

  return consumer.originalPositionFor(position)
}

const base64toJson = (base64) => {
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
