import { PrintResultType } from 'recast/lib/printer'
import path from 'path'
import url from 'url'

const inlineSourceMapRe = /\n\/\/ ?(?:#|@) sourceMappingURL=data:application\/json;(?:charset=utf-8;)base64,([^$]+)\s*$/m

const getDataUrl = (map: any) => {
  return `data:application/json;charset=utf-8;base64,${Buffer.from(JSON.stringify(map)).toString('base64')}`
}

export const tryDecodeInline = (js: string) => {
  const matches = inlineSourceMapRe.exec(js)

  if (matches) {
    try {
      const base64 = matches[1]

      // theoretically we could capture the charset properly and use it in the toString call here
      // but it is unlikely that non-utf-8 charsets will be encountered in the wild, and handling all
      // possible charsets is complex
      return JSON.parse(Buffer.from(base64, 'base64').toString())
    } catch {
      return
    }
  }
}

export const getPaths = (urlStr: string) => {
  try {
    const parsed = url.parse(urlStr, false)

    // if the sourceFileName is the same as the real filename, Chromium appends a weird "? [sm]" suffix to the filename
    // avoid this by appending some text to the filename
    // @see https://cs.chromium.org/chromium/src/third_party/devtools-frontend/src/front_end/sdk/SourceMap.js?l=445-447&rcl=a0c450d5b58f71b67134306b2e1c29a75326d3db
    const sourceFileName = `${path.basename(parsed.path || '')} (original)`

    parsed.pathname = path.dirname(parsed.pathname || '')
    delete parsed.search

    return { sourceRoot: parsed.format(), sourceFileName, sourceMapName: `${sourceFileName}.map` }
  } catch {
    return { sourceRoot: undefined, sourceFileName: 'source.js', sourceMapName: 'source.js.map' }
  }
}

// given source + transformed JS, return final formatted code with inlined sourcemap
export const inlineFormatter = (printed: PrintResultType): string => {
  const map = printed.map

  return [
    printed.code,
    `//# sourceMappingURL=${getDataUrl(map)}`,
  ].join('\n')
}
