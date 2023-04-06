import {
  SourceMapConsumer,
  SourceMapGenerator,
  RawSourceMap,
  MappingItem,
  Mapping,
  Position,
} from 'source-map-js'

import path from 'path'

import debug from 'debug'
import { EMBEDDED } from '../constants'
const logError = debug('cypress:snapgen:error')
const logTrace = debug('cypress:snapgen:trace')

function relativePath (baseDirPath: string, fullPath: string): string {
  // TODO(thlorenz): Why is forward slash missing here?
  return path.relative(baseDirPath, `/${fullPath}`)
}

/**
 * Processing the SourceMap in order to offset lines according to where the esbuild bundle
 * content ends up inside the snapshot script.
 * Additionally we modify the source paths to be relative to the project base dir
 */
export function processSourceMap (
  sourceMap: Buffer | undefined,
  baseDirPath: string,
  lineOffset: number,
): string | undefined {
  if (sourceMap == null) return

  // We need to do this in a round about way since the consumer.eachMapping function provides us
  // a clone of each mapping, thus not allowing us to modify the original in place.
  // Instead we generate a new Array of mappings first and then build an entirely new sourcemap
  // given the sources, sourcesContent and updated mappings.
  const mappings: Mapping[] = []

  const sourceRoot = ''

  try {
    // Extract current SourceMap and convert to a consumer
    const json = sourceMap?.toString('utf8')
    const sm: RawSourceMap = JSON.parse(json)

    sm.file = EMBEDDED
    const consumer = new SourceMapConsumer(sm)

    // Extract and offset mappings from current sourcemap
    consumer.eachMapping((item: MappingItem) => {
      const orig: Position = {
        line: item.originalLine,
        column: item.originalColumn,
      }
      const gen: Position = {
        line: item.generatedLine + lineOffset,
        column: item.generatedColumn,
      }
      const mapping: Mapping = {
        generated: gen,
        original: orig,
        source: relativePath(baseDirPath, item.source),
        name: item.name,
      }

      mappings.push(mapping)
    })

    // Generate a new sourcemap with updated mappings
    const generator = new SourceMapGenerator({
      file: EMBEDDED,
      sourceRoot,
    })

    for (const mapping of mappings) {
      generator.addMapping(mapping)
    }

    for (let i = 0; i < sm.sources.length; i++) {
      const relSource = relativePath(baseDirPath, sm.sources[i])

      generator.setSourceContent(relSource, sm.sourcesContent![i])
    }

    const s = generator.toString()

    if (logTrace.enabled) {
      logTrace(JSON.parse(s))
    }

    return s
  } catch (e) {
    logError('Encountered invalid sourcemap: %s', sourceMap?.toString('utf8'))
  }

  return
}
