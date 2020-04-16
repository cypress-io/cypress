import { PrintResultType } from 'recast/lib/printer'
import path from 'path'
import url from 'url'

const inlineSourceMapRe = /^\/\/ ?(?:#|@) sourceMappingURL=data:application\/json;base64,([^$]+)$/g

const getDataUrl = (map: any) => {
  return `data:application/json;charset=utf-8;base64,${Buffer.from(JSON.stringify(map)).toString('base64')}`
}

export const tryDecodeInline = (js: string) => {
  const matches = inlineSourceMapRe.exec(js)

  if (matches) {
    try {
      return JSON.parse(Buffer.from(matches![1], 'base64').toString())
    } catch {
      return
    }
  }
}

export const getPaths = (_url: string) => {
  try {
    const parsed = url.parse(_url, false)

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
