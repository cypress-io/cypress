import convertSourceMap from 'convert-source-map'

import debug from 'debug'
const logError = debug('snapgen:error')

const INLINE_BASE64_SOURCEMAP_HEADER =
  '//# sourceMappingURL=data:application/json;base64,'

export function inlineSourceMapComment (sourceMap: string): string | undefined {
  try {
    const base64 = convertSourceMap.fromJSON(sourceMap).toBase64()

    return `\n${INLINE_BASE64_SOURCEMAP_HEADER}${base64}`
  } catch (err) {
    logError('Failed to parse sourcemaps')
    logError(err)
  }

  return
}
