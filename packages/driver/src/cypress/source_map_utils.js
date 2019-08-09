const { SourceMapConsumer } = require('source-map')

let sourceMapConsumers = {}

const initialize = (file, sourceMapBase64) => {
  SourceMapConsumer.initialize({
    'lib/mappings.wasm': require('source-map/lib/mappings.wasm'),
  })

  const sourceMap = base64toJson(sourceMapBase64)

  return (new SourceMapConsumer(sourceMap)).then((consumer) => {
    sourceMapConsumers[file.fullyQualified] = {
      consumer,
      file,
    }
  })
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
  initialize,
  getSourceContents,
  getSourcePosition,
}
