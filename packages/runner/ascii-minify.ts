import TerserPlugin from 'terser-webpack-plugin'
import type { TransformOptions } from 'esbuild'
import { escapeNonAscii } from '../../scripts/binary/escape-non-ascii'

type SourceMapInput = NonNullable<Awaited<ReturnType<typeof TerserPlugin.esbuildMinify>>['map']>
type EncodedSourceMap = Extract<SourceMapInput, { mappings: string }>

const isEncodedSourceMap = (map: SourceMapInput): map is EncodedSourceMap => {
  return typeof map === 'object' && 'mappings' in map && typeof map.mappings === 'string'
}

// The after-pack step that rewrites browser bundles as ASCII would reprint a bundle that isn't ASCII
// yet, and every column in its source map would then point at the wrong code
export const asciiEsbuildMinify: TerserPlugin.MinimizerImplementation<TransformOptions> = Object.assign(
  async (...args: Parameters<typeof TerserPlugin.esbuildMinify>) => {
    const result = await TerserPlugin.esbuildMinify(...args)

    if (result.map === undefined) {
      return { ...result, code: escapeNonAscii(result.code).code }
    }

    if (!isEncodedSourceMap(result.map)) {
      throw new Error('esbuild returned a source map that is not an encoded source map object')
    }

    return { ...result, ...escapeNonAscii(result.code, result.map) }
  },
  {
    getMinimizerVersion: TerserPlugin.esbuildMinify.getMinimizerVersion,
    supportsWorkerThreads: TerserPlugin.esbuildMinify.supportsWorkerThreads,
  },
)
