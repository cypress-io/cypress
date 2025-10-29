import _ from 'lodash'
import { SourceMapConsumer } from 'source-map'

import type { BasicSourceMapConsumer } from 'source-map'
// @ts-ignore
import mappingsWasm from 'source-map/lib/mappings.wasm'

import $utils from './utils'
import { toPosix } from './util/to_posix'
import path from 'path'

const sourceMapExtractionRegex = /\/\/\s*[@#]\s*sourceMappingURL\s*=\s*(data:[^\s]*)/g
const regexDataUrl = /data:[^;\n]+(?:;charset=[^;\n]+)?;base64,(.*)/ // matches data urls

let sourceMapConsumers: Record<string, BasicSourceMapConsumer> = {}
let sourceMapProjectRoot: string = ''

const initializeSourceMapConsumer = async (script, sourceMap): Promise<BasicSourceMapConsumer | null> => {
  if (!sourceMap) return null

  // @ts-ignore
  SourceMapConsumer.initialize({
    'lib/mappings.wasm': mappingsWasm,
  })

  const consumer = await new SourceMapConsumer(sourceMap)

  sourceMapConsumers[toPosix(script.fullyQualifiedUrl)] = consumer

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
  const posixFilePath = toPosix(filePath)

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
  const posixFilePath = toPosix(filePath)
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
  try {
    const mapString = $utils.decodeBase64Unicode(base64)

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
  sourceMapProjectRoot = ''
}

const areSourceMapsAvailable = () => {
  return Object.keys(sourceMapConsumers).length > 0
}

/**
 * Establishes the project root from the source map's perspective.
 *
 * @param relativePath - The relative path of an anchor file where we know the absolute path.
 * @param absolutePath - The absolute path of the anchor file.
 * @param projectRoot - The project root. Used as a back up if we cannot determine the project root from the source map.
 * @returns The project root from the source map's perspective
 */
const setSourceMapProjectRoot = (relativePath: string, absolutePath: string, projectRoot: string) => {
  const keys = Object.keys(sourceMapConsumers)

  if (keys.length === 0) {
    sourceMapProjectRoot = projectRoot

    return
  }

  const posixRelativePath = toPosix(relativePath)
  const key = keys.find((key) => key.endsWith(posixRelativePath))

  if (!key) {
    sourceMapProjectRoot = projectRoot

    return
  }

  const consumer = sourceMapConsumers[key]

  for (const [index, source] of consumer.sources.entries()) {
    const strippedSource = $utils.stripCustomProtocol(source)

    if (strippedSource !== undefined && absolutePath?.endsWith(strippedSource)) {
      // @ts-expect-error
      const relativeSource = consumer._sources.at(index)
      const strippedRelativeSource = $utils.stripCustomProtocol(relativeSource)

      if (strippedRelativeSource !== undefined) {
        // get the directory where relativeSource applied to the directory gives you the absolute path
        const baseDirectory = getBaseDirectory(absolutePath, strippedRelativeSource)

        sourceMapProjectRoot = baseDirectory ?? projectRoot

        return
      }
    }
  }

  sourceMapProjectRoot = projectRoot

  return
}

const getSourceMapProjectRoot = () => {
  return sourceMapProjectRoot
}

/**
 * Gets the base directory that satisfies the relationship between the absolute and relative paths.
 *
 * For example:
 *
 * absolutePath: /project/src/components/Button.tsx
 * relativePath: src/components/Button.tsx
 *
 * The base directory is /project
 *
 * @param absolutePath - The absolute path.
 * @param relativePath - The relative path.
 * @returns The base directory that satisfies the relationship between the absolute and relative paths.
 */
const getBaseDirectory = (absolutePath: string, relativePath: string) => {
  const absNormalized = path.normalize(absolutePath)
  const relNormalized = path.normalize(relativePath)

  let dir = path.dirname(absNormalized)
  let parent = path.dirname(dir)

  while (parent !== dir) {
    if (path.join(dir, relNormalized) === absNormalized) {
      return dir
    }

    dir = parent
    parent = path.dirname(dir)
  }

  // Check the root directory
  if (path.join(dir, relNormalized) === absNormalized) {
    return dir
  }

  return null
}

export default {
  getSourcePosition,
  getSourceContents,
  extractSourceMap,
  initializeSourceMapConsumer,
  destroySourceMapConsumers,
  areSourceMapsAvailable,
  setSourceMapProjectRoot,
  getSourceMapProjectRoot,
  getBaseDirectory,
}
