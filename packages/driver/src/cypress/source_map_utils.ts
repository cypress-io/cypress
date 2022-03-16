import _ from 'lodash'
import { SourceMapConsumer } from 'source-map'
import Promise from 'bluebird'

// @ts-ignore
import mappingsWasm from 'source-map/lib/mappings.wasm'

import $utils from './utils'

const sourceMapExtractionRegex = /\/\/\s*[@#]\s*sourceMappingURL\s*=\s*(data:[^\s]*)/g
const regexDataUrl = /data:[^;\n]+(?:;charset=[^;\n]+)?;base64,([a-zA-Z0-9+/]+={0,2})/ // matches data urls

let sourceMapConsumers = {}

const initializeSourceMapConsumer = (file, sourceMap) => {
  if (!sourceMap) return Promise.resolve(null)

  // @ts-ignore
  SourceMapConsumer.initialize({
    'lib/mappings.wasm': mappingsWasm,
  })

  return Promise.resolve(new SourceMapConsumer(sourceMap)).then((consumer) => {
    sourceMapConsumers[file.fullyQualifiedUrl] = consumer

    return consumer
  })
}

const extractSourceMap = (file, fileContents) => {
  let sourceMapMatch = fileContents.match(sourceMapExtractionRegex)

  if (!sourceMapMatch) return null

  const url = _.last(sourceMapMatch) as any
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
  const sourceMapConsumer = sourceMapConsumers[filePath]

  if (!sourceMapConsumer) return null

  const sourcePosition = sourceMapConsumer.originalPositionFor(position)
  const { source, line, column } = sourcePosition

  if (!source || line == null || column == null) return

  // if the file is outside of the projectRoot
  // originalPositionFor will not provide the correct relative path
  // https://github.com/cypress-io/cypress/issues/16255
  const sourceIndex = sourceMapConsumer._absoluteSources.indexOf(source)
  const file = sourceMapConsumer._sources.at(sourceIndex)

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

export default {
  getSourcePosition,
  getSourceContents,
  extractSourceMap,
  initializeSourceMapConsumer,
}
