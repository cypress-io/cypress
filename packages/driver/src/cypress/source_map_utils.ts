import _ from 'lodash'
import { SourceMapConsumer } from 'source-map'

import type { BasicSourceMapConsumer } from 'source-map'
// @ts-ignore
import mappingsWasm from 'source-map/lib/mappings.wasm'

import $utils from './utils'
import stackUtils from './stack_utils'

const sourceMapExtractionRegex = /\/\/\s*[@#]\s*sourceMappingURL\s*=\s*(data:[^\s]*)/g
const regexDataUrl = /data:[^;\n]+(?:;charset=[^;\n]+)?;base64,([a-zA-Z0-9+/]+={0,2})/ // matches data urls

let sourceMapConsumers: Record<string, BasicSourceMapConsumer> = {}

const initializeSourceMapConsumer = async (script, sourceMap): Promise<BasicSourceMapConsumer | null> => {
  if (!sourceMap) return null

  // @ts-ignore
  SourceMapConsumer.initialize({
    'lib/mappings.wasm': mappingsWasm,
  })

  const consumer = await new SourceMapConsumer(sourceMap)

  sourceMapConsumers[stackUtils.toPosix(script.fullyQualifiedUrl)] = consumer

  return consumer
}

const extractSourceMap = (fileContents) => {
  let dataUrlMatch

  try {
    let sourceMapMatch = fileContents.match(sourceMapExtractionRegex)

    if (!sourceMapMatch) return null

    const url = _.last(sourceMapMatch) as any

    dataUrlMatch = url.match(regexDataUrl)
  } catch (err) {
    // ignore unable to match regex. there's nothing we
    // can do about it and we don't want to thrown an exception
    if (err.message === 'Maximum call stack size exceeded') return null

    throw err
  }

  if (!dataUrlMatch) return null

  const sourceMapBase64 = dataUrlMatch[1]
  const sourceMap = base64toJs(sourceMapBase64)

  return sourceMap
}

const getSourceContents = (filePath, sourceFile) => {
  const posixFilePath = stackUtils.toPosix(filePath)

  if (!sourceMapConsumers[posixFilePath]) return null

  try {
    return sourceMapConsumers[posixFilePath].sourceContentFor(sourceFile)
  } catch (err) {
    // ignore the sourceFile not being in the source map. there's nothing we
    // can do about it and we don't want to thrown an exception
    if (err && err.message.indexOf('not in the SourceMap') > -1) return

    throw err
  }
}

const getSourcePosition = (filePath, position) => {
  const posixFilePath = stackUtils.toPosix(filePath)
  const sourceMapConsumer = sourceMapConsumers[posixFilePath]

  if (!sourceMapConsumer) return null

  const { source, line, column } = sourceMapConsumer.originalPositionFor(position)

  if (!source || line == null || column == null) return

  // if the file is outside of the projectRoot
  // originalPositionFor will not provide the correct relative path
  // https://github.com/cypress-io/cypress/issues/16255
  // @ts-expect-error
  const sourceIndex = sourceMapConsumer._absoluteSources.indexOf(source)
  // @ts-expect-error
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

const destroySourceMapConsumers = () => {
  Object.values(sourceMapConsumers).forEach((consumer) => {
    consumer.destroy()
  })

  sourceMapConsumers = {}
}

export default {
  getSourcePosition,
  getSourceContents,
  extractSourceMap,
  initializeSourceMapConsumer,
  destroySourceMapConsumers,
}
