import path from 'path'
import url from 'url'

const sourceMapRe = /\n\/\/[ \t]*(?:#|@) sourceMappingURL=([^\s]+)\s*$/
const dataUrlRe = /^data:application\/json;(?:charset=utf-8;)base64,([^\s]+)\s*$/

export const getMappingUrl = (js: string) => {
  const matches = sourceMapRe.exec(js)

  if (matches) {
    return matches[1]
  }

  return undefined
}

export const stripMappingUrl = (js: string) => {
  return js.replace(sourceMapRe, '')
}

export const tryDecodeInlineUrl = (url: string) => {
  const matches = dataUrlRe.exec(url)

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

export const urlFormatter = (url: string, js: string): string => {
  return [
    stripMappingUrl(js),
    `//# sourceMappingURL=${url}`,
  ].join('\n')
}
