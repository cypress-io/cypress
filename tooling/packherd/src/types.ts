import type {
  BuildOptions,
  BuildResult,
  Metafile,
  OutputFile,
} from 'esbuild'

// -----------------
// Bundle Creation
// -----------------
/**
 * Extension of [esbuild BuildOptions](https://esbuild.github.io/api/#simple-options).
 *
 * @category Bundle
 */
export type CreateBundleOpts = BuildOptions & {
  entryFilePath: string
}

/** @category Bundle */
export type CreateBundleOutputFile = {
  contents: OutputFile['contents']
}

/** @category Bundle */
export type CreateBundleSourcemap = {
  contents: OutputFile['contents']
}

/**
 * Result of creating a bundle.
 *
 * @property warnings: emitted by esbuild
 * @property outputFiles: generally the emitted bundle
 * @property sourceMap: included when packherd was configured to generate it
 * @property metafile: [esbuild Metafile](https://esbuild.github.io/api/#metafile)
 *
 * @category Bundle
 */
export type CreateBundleResult = {
  warnings: BuildResult['warnings']
  outputFiles: CreateBundleOutputFile[]
  sourceMap?: CreateBundleSourcemap
  metafile?: Metafile
}

/**
 * Type of Function that needs to be provided in order to override the default `createBundle`.
 *
 * @category Bundle
 */
export type CreateBundle = (
  args: CreateBundleOpts
) => Promise<CreateBundleResult>
