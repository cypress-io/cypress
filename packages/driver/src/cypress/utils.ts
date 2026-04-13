import { defaults } from '@packages/utils'
import methods from 'methods'
import dayjs from 'dayjs'
import $ from 'jquery'

import $dom from '../dom'
import $jquery from '../dom/jquery'
import { $Location } from './location'
import $errUtils from './error_utils'

const capitalizePreserveRest = (str: string) => str ? str[0].toUpperCase() + str.slice(1) : ''

const customProtocolRegex = /^[^:\/]+:\/{1,3}/
// Find 'namespace' values (like `_N_E` for Next apps) without adjusting relative paths (like `../`)
const webpackDevtoolNamespaceRegex = /webpack:\/{2}([^.]*)?\.\//

const tagOpen = /\[([a-z\s='"-]+)\]/g
const tagClosed = /\[\/([a-z]+)\]/g

const defaultOptions = {
  delay: 10,
  force: false,
  timeout: null,
  interval: null,
  multiple: false,
  waitForAnimations: true,
  animationDistanceThreshold: 5,
  scrollBehavior: 'top',
}

const USER_FRIENDLY_TYPE_DETECTORS: [(val: any) => boolean, () => string][] = [
  [(v) => v === undefined, () => 'undefined'],
  [(v) => v === null, () => 'null'],
  [(v) => typeof v === 'boolean', () => 'boolean'],
  [(v) => typeof v === 'number', () => 'number'],
  [(v) => typeof v === 'string', () => 'string'],
  [(v) => v instanceof RegExp, () => 'regexp'],
  [(v) => typeof v === 'symbol', () => 'symbol'],
  [(v) => v instanceof Element, () => 'element'],
  [(v) => v instanceof Error, () => 'error'],
  [(v) => v instanceof Set, () => 'set'],
  [(v) => v instanceof WeakSet, () => 'set'],
  [(v) => v instanceof Map, () => 'map'],
  [(v) => v instanceof WeakMap, () => 'map'],
  [(v) => typeof v === 'function', () => 'function'],
  [(v) => Array.isArray(v) || (v !== null && typeof v === 'object' && typeof v.length === 'number'), () => 'array'],
  [(v) => Buffer.isBuffer(v), () => 'buffer'],
  [(v) => v instanceof Date, () => 'date'],
  [(v) => v !== null && typeof v === 'object', () => 'object'],
  [() => true, () => 'unknown'],
]

export default {
  warning (msg) {
    // eslint-disable-next-line no-console
    return console.warn(`Cypress Warning: ${msg}`)
  },

  throwErrByPath (errPath: string, args: any) {
    return $errUtils.throwErrByPath(errPath, {
      args,
    })
  },

  log (...msgs) {
    // eslint-disable-next-line no-console
    return console.log(...msgs)
  },

  monkeypatchBefore (origFn, fn) {
    return function () {
      const newArgs = fn.apply(this, arguments)

      if (newArgs !== undefined) {
        return origFn.apply(this, newArgs)
      }

      return origFn.apply(this, arguments)
    }
  },

  monkeypatchBeforeAsync (origFn, fn) {
    return async function () {
      const newArgs = await fn.apply(this, arguments)

      if (newArgs !== undefined) {
        return origFn.apply(this, newArgs)
      }

      return origFn.apply(this, arguments)
    }
  },

  unwrapFirst (val) {
    // this method returns the first item in an array
    // and if its still a jquery object, then we return
    // the first() jquery element
    const item = [].concat(val)[0]

    if ($jquery.isJquery(item)) {
      return (item as JQuery<any>).first()
    }

    return item
  },

  switchCase (value, casesObj, defaultKey = 'default') {
    if (value in casesObj) {
      const v = casesObj[value]

      return typeof v === 'function' ? v() : v
    }

    if (defaultKey in casesObj) {
      const v = casesObj[defaultKey]

      return typeof v === 'function' ? v() : v
    }

    const keys = Object.keys(casesObj)

    throw new Error(`The switch/case value: '${value}' did not match any cases: ${keys.join(', ')}.`)
  },

  reduceProps (obj, props: readonly string[] = []) {
    if (!obj) {
      return null
    }

    return props.reduce((memo, prop) => {
      if (prop in obj || obj[prop] !== undefined) {
        const v = obj[prop]

        memo[prop] = typeof v === 'function' ? v.call(obj) : v
      }

      return memo
    }, {})
  },

  normalizeObjWithLength (obj) {
    // some utilities have issues if our object has a 'length'
    // property so we have to normalize that
    if ('length' in obj) {
      obj.Length = obj.length
      delete obj.length
    }

    return obj
  },

  // return a new object if the obj
  // contains the properties of filter
  // and the values are different
  filterOutOptions (obj, filter = {}) {
    defaults(filter, defaultOptions)

    this.normalizeObjWithLength(filter)

    const result: Record<string, any> = {}
    let hasKeys = false

    for (const [key, value] of Object.entries(obj)) {
      const upperKey = capitalizePreserveRest(key)

      if ((key in filter || upperKey in filter) && filter[key] !== value) {
        result[key] = value
        hasKeys = true
      }
    }

    if (!hasKeys) {
      return undefined
    }

    return result
  },

  stringifyActualObj (obj, visited?: WeakSet<any>) {
    // Ensure visited is always a WeakSet - create new one if not provided or invalid
    const visitedSet = (visited && visited instanceof WeakSet) ? visited : new WeakSet()

    obj = this.normalizeObjWithLength(obj)

    const str = Object.entries(obj).reduce((memo, [key, value]) => {
      memo.push(`${`${key}`.toLowerCase()}: ${this.stringifyActual(value, visitedSet)}`)

      return memo
    }, [] as string[])

    return `{${str.join(', ')}}`
  },

  stringifyActual (value, visited?: WeakSet<any>) {
    // Ensure visited is always a WeakSet - create new one if not provided or invalid
    const visitedSet = (visited && visited instanceof WeakSet) ? visited : new WeakSet()

    if ($dom.isDom(value)) {
      return $dom.stringify(value, 'short')
    }

    if (typeof value === 'function') {
      return 'function(){}'
    }

    if (Array.isArray(value)) {
      // Check for circular reference first to prevent infinite recursion
      if (visitedSet.has(value)) {
        return '[Circular]'
      }

      const len = value.length

      if (len > 3) {
        // Add to visited set to prevent infinite recursion in nested structures
        visitedSet.add(value)

        return `Array[${len}]`
      }

      // For arrays with length <= 3, recurse into elements
      // Add to visited set before recursing
      visitedSet.add(value)

      const result = `[${value.map((item) => this.stringifyActual(item, visitedSet)).join(', ')}]`

      // Note: We don't remove from visited set because WeakSet automatically handles cleanup
      // and we want to detect circular references even after the first level

      return result
    }

    if (value instanceof RegExp) {
      return value.toString()
    }

    if (value !== null && typeof value === 'object') {
      // Cannot use $dom.isJquery here because it causes infinite recursion.
      if (value instanceof $) {
        return `jQuery{${(value as JQueryStatic).length}}`
      }

      // Check for circular reference first to prevent infinite recursion
      if (visitedSet.has(value)) {
        return '[Circular]'
      }

      const len = Object.keys(value).length

      if (len > 2) {
        // Add to visited set to prevent infinite recursion in nested structures
        visitedSet.add(value)

        return `Object{${len}}`
      }

      // Add to visited set before recursing
      visitedSet.add(value)

      try {
        const result = this.stringifyActualObj(value, visitedSet)

        // Note: We don't remove from visited set because WeakSet automatically handles cleanup
        // and we want to detect circular references even after the first level

        return result
      } catch (err) {
        return String(value)
      }
    }

    if (typeof value === 'symbol') {
      return 'Symbol'
    }

    if (value === undefined) {
      return undefined
    }

    return `${value}`
  },

  // give us some user-friendly "types"
  stringifyFriendlyTypeof (val) {
    for (const [predicate, typeFn] of USER_FRIENDLY_TYPE_DETECTORS) {
      if (predicate(val)) {
        return typeFn()
      }
    }

    return 'unknown'
  },

  stringify (values) {
    // if we already have an array
    // then nest it again so that
    // its formatted properly
    values = [].concat(values)

    return values
    .map((v) => this.stringifyActual(v))
    .filter((v) => v !== undefined)
    .join(', ')
  },

  stringifyArg (arg) {
    if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') {
      return JSON.stringify(arg)
    }

    if (arg === null) {
      return 'null'
    }

    if (arg === undefined) {
      return 'undefined'
    }

    return this.stringifyActual(arg)
  },

  plural (obj, plural, singular) {
    obj = typeof obj === 'number' ? obj : obj.length
    if (obj > 1) {
      return plural
    }

    return singular
  },

  convertHtmlTags (html) {
    return html
    .replace(tagOpen, '<$1>')
    .replace(tagClosed, '</$1>')
  },

  isInstanceOf (instance, constructor) {
    try {
      return instance instanceof constructor
    } catch (e) {
      return false
    }
  },

  normalizeNumber (num) {
    const parsed = Number(num)

    // return num if this isNaN else return parsed
    if (Number.isNaN(parsed)) {
      return num
    }

    return parsed
  },

  isValidHttpMethod (str) {
    return typeof str === 'string' && methods.includes(str.toLowerCase())
  },

  addTwentyYears () {
    return dayjs().add(20, 'year').unix()
  },

  locReload (forceReload, win) {
    return win.location.reload(forceReload)
  },

  locHref (url, win) {
    win.location.href = url
  },

  locToString (win) {
    return win.location.toString()
  },

  locExisting () {
    return $Location.create(window.location.href)
  },

  iframeSrc ($autIframe, url) {
    return $autIframe.prop('src', url)
  },

  getDistanceBetween (point1, point2) {
    const deltaX = point1.x - point2.x
    const deltaY = point1.y - point2.y

    return Math.sqrt((deltaX * deltaX) + (deltaY * deltaY))
  },

  getTestFromRunnable (r: Mocha.Runnable) {
    return r.ctx?.currentTest || r
  },

  memoize (func, cacheInstance = new Map()) {
    const memoized = function (...args) {
      const key = args[0]
      const { cache } = memoized

      if (cache.has(key)) {
        return cache.get(key)
      }

      const result = func.apply(this, args)

      memoized.cache = cache.set(key, result) || cache

      return result
    }

    memoized.cache = cacheInstance

    return memoized
  },

  indent (str, indentAmount) {
    const indentStr = ' '.repeat(indentAmount)

    str = str.replace(/\n/g, `\n${indentStr}`)

    return `${indentStr}${str}`
  },

  // normalize more than {maxNewLines} new lines into
  // exactly {replacementNumLines} new lines
  normalizeNewLines (str, maxNewLines, replacementNumLines?) {
    const moreThanMaxNewLinesRe = new RegExp(`\\n{${maxNewLines},}`)
    const replacementWithNumLines = replacementNumLines ?? maxNewLines

    return str
    .split(moreThanMaxNewLinesRe)
    .filter(Boolean)
    .join('\n'.repeat(replacementWithNumLines))
  },

  /**
   * Correctly decodes Unicode string in encoded in base64
   * @see https://github.com/cypress-io/cypress/issues/5435
   * @see https://github.com/cypress-io/cypress/issues/7507
   * @see https://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings
   *
   * @example
    ```
    Buffer.from(JSON.stringify({state: '🙂'})).toString('base64')
    // 'eyJzdGF0ZSI6IvCfmYIifQ=='
    // "window.atob" does NOT work
    // atob('eyJzdGF0ZSI6IvCfmYIifQ==')
    // "{"state":"ð"}"
    // but this function works
    b64DecodeUnicode('eyJzdGF0ZSI6IvCfmYIifQ==')
    '{"state":"🙂"}'
    ```
  */
  decodeBase64Unicode (str) {
    return decodeURIComponent(atob(str).split('').map((char) => {
      return `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`
    }).join(''))
  },

  /**
   * Correctly encodes Unicode string to base64
   * @see https://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings
  */
  encodeBase64Unicode (str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
      return String.fromCharCode(Number(`0x${p1}`))
    }))
  },

  noArgsAreAFunction (args) {
    return !args.some((arg) => typeof arg === 'function')
  },

  isPromiseLike (ret) {
    // @ts-ignore
    return ret && (ret !== null && typeof ret === 'object') && 'then' in ret && typeof ret.then === 'function' && 'catch' in ret && typeof ret.catch === 'function'
  },

  stripCustomProtocol (filePath: string) {
    if (!filePath) {
      return
    }

    // if the file path (after all said and done)
    // still starts with "http://" or "https://" then
    // it is an URL and we have no idea how it maps
    // to a physical file location on disk. Let it be.
    const httpProtocolRegex = /^https?:\/\//

    if (httpProtocolRegex.test(filePath)) {
      return
    }

    // Check the path to see if custom namespaces have been applied and, if so, remove them
    // For example, in Next.js we end up with paths like `_N_E/pages/index.cy.js`, and we
    // need to strip off the `_N_E` so that "Open in IDE" links work correctly
    if (webpackDevtoolNamespaceRegex.test(filePath)) {
      return filePath.replace(webpackDevtoolNamespaceRegex, '')
    }

    return filePath.replace(customProtocolRegex, '')
  },
}
