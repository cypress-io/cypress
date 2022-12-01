'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.urlFormatter = exports.getPaths = exports.tryDecodeInlineUrl = exports.stripMappingUrl = exports.getMappingUrl = void 0

const tslib_1 = require('tslib')
const path_1 = tslib_1.__importDefault(require('path'))
const url_1 = tslib_1.__importDefault(require('url'))
const sourceMapRe = /\n\/\/[ \t]*(?:#|@) sourceMappingURL=([^\s]+)\s*$/
const dataUrlRe = /^data:application\/json;(?:charset=utf-8;)base64,([^\s]+)\s*$/
const getMappingUrl = (js) => {
  const matches = sourceMapRe.exec(js)

  if (matches) {
    return matches[1]
  }

  return undefined
}

exports.getMappingUrl = getMappingUrl

const stripMappingUrl = (js) => {
  return js.replace(sourceMapRe, '')
}

exports.stripMappingUrl = stripMappingUrl

const tryDecodeInlineUrl = (url) => {
  const matches = dataUrlRe.exec(url)

  if (matches) {
    try {
      const base64 = matches[1]

      // theoretically we could capture the charset properly and use it in the toString call here
      // but it is unlikely that non-utf-8 charsets will be encountered in the wild, and handling all
      // possible charsets is complex
      return JSON.parse(Buffer.from(base64, 'base64').toString())
    } catch (_a) {
      return
    }
  }
}

exports.tryDecodeInlineUrl = tryDecodeInlineUrl

const getPaths = (urlStr) => {
  try {
    const parsed = url_1.default.parse(urlStr, false)
    // if the sourceFileName is the same as the real filename, Chromium appends a weird "? [sm]" suffix to the filename
    // avoid this by appending some text to the filename
    // @see https://cs.chromium.org/chromium/src/third_party/devtools-frontend/src/front_end/sdk/SourceMap.js?l=445-447&rcl=a0c450d5b58f71b67134306b2e1c29a75326d3db
    const sourceFileName = `${path_1.default.basename(parsed.path || '')} (original)`

    parsed.pathname = path_1.default.dirname(parsed.pathname || '')
    /* @ts-ignore */
    delete parsed.search

    return { sourceRoot: parsed.format(), sourceFileName, sourceMapName: `${sourceFileName}.map` }
  } catch (_a) {
    return { sourceRoot: undefined, sourceFileName: 'source.js', sourceMapName: 'source.js.map' }
  }
}

exports.getPaths = getPaths

const urlFormatter = (url, js) => {
  return [
    (0, exports.stripMappingUrl)(js),
        `//# sourceMappingURL=${url}`,
  ].join('\n')
}

exports.urlFormatter = urlFormatter
