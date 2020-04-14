import { PrintResultType } from 'recast/lib/printer'
import url from 'url'

const inlineSourceMapRe = /^\/\/(?:#|@) sourceMappingURL=data:application\/json;base64,([^$]+)$/g

const getSourceMapDataUrl = (map: any) => {
  return `data:application/json;base64,${Buffer.from(JSON.stringify(map)).toString('base64')}`
}

export const tryDecodeInlineSourceMap = (js: string) => {
  const matches = inlineSourceMapRe.exec(js)

  if (matches) {
    try {
      return JSON.parse(Buffer.from(matches![1], 'base64').toString())
    } catch {
      return
    }
  }
}

export const getSourceRoot = (_url: string) => {
  try {
    const parsed = url.parse(_url, false)

    delete parsed.pathname
    delete parsed.search

    return parsed.format()
  } catch {
    return
  }
}

// given source + transformed JS, return final formatted code with inlined sourcemap
export const inlineSourceMapFormatter = (printed: PrintResultType): string => {
  return [
    printed.code,
    `//# sourceMappingURL=${getSourceMapDataUrl(printed.map)}`,
  ].join('\n')
}
