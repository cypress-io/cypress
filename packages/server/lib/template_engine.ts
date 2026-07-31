import { compile, defaultConfig } from 'squirrelly'
import { fs } from './util/fs'

type CompiledTemplate = ReturnType<typeof compile>

type RenderCallback = (err: Error | null, rendered?: string) => void

export const cache: Record<string, CompiledTemplate> = {}

export function render (
  filePath: string,
  options: object,
  cb: RenderCallback,
): void {
  const cachedFn = cache[filePath]

  // if we already have a cachedFn function
  if (cachedFn) {
    // just return it and move on
    cb(null, cachedFn(options, defaultConfig))

    return
  }

  // else go read it off the filesystem
  fs
  .readFileAsync(filePath, 'utf8')
  .then((str) => {
    // and cache the Sqrl compiled template fn
    const compiledFn = cache[filePath] = compile(String(str), { useWith: true })

    return compiledFn(options, defaultConfig)
  })
  .asCallback(cb)
}
