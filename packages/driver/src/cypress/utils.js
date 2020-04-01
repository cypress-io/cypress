// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require('lodash')
const methods = require('methods')
const moment = require('moment')

const $jquery = require('../dom/jquery')
const $Location = require('./location')

const tagOpen = /\[([a-z\s='"-]+)\]/g
const tagClosed = /\[\/([a-z]+)\]/g
const quotesRe = /('|")/g

const defaultOptions = {
  delay: 10,
  force: false,
  timeout: null,
  interval: null,
  multiple: false,
  waitForAnimations: true,
  animationDistanceThreshold: 5,
}

const USER_FRIENDLY_TYPE_DETECTORS = _.map([
  [_.isUndefined, 'undefined'],
  [_.isNull, 'null'],
  [_.isBoolean, 'boolean'],
  [_.isNumber, 'number'],
  [_.isString, 'string'],
  [_.isRegExp, 'regexp'],
  [_.isSymbol, 'symbol'],
  [_.isElement, 'element'],
  [_.isError, 'error'],
  [_.isSet, 'set'],
  [_.isWeakSet, 'set'],
  [_.isMap, 'map'],
  [_.isWeakMap, 'map'],
  [_.isFunction, 'function'],
  [_.isArrayLikeObject, 'array'],
  [_.isBuffer, 'buffer'],
  [_.isDate, 'date'],
  [_.isObject, 'object'],
  [_.stubTrue, 'unknown'],
], ([fn, type]) => [fn, _.constant(type)])

module.exports = {
  warning (msg) {
    // eslint-disable-next-line
    return console.warn(`Cypress Warning: ${msg}`)
  },

  log (...msgs) {
    // eslint-disable-next-line
    return console.log(...msgs)
  },

  unwrapFirst (val) {
    // this method returns the first item in an array
    // and if its still a jquery object, then we return
    // the first() jquery element
    const item = [].concat(val)[0]

    if ($jquery.isJquery(item)) {
      return item.first()
    }

    return item
  },

  switchCase (value, casesObj, defaultKey = 'default') {
    if (_.has(casesObj, value)) {
      return _.result(casesObj, value)
    }

    if (_.has(casesObj, defaultKey)) {
      return _.result(casesObj, defaultKey)
    }

    const keys = _.keys(casesObj)

    throw new Error(`The switch/case value: '${value}' did not match any cases: ${keys.join(', ')}.`)
  },

  reduceProps (obj, props = []) {
    if (!obj) {
      return null
    }

    return _.reduce(props, (memo, prop) => {
      if (_.has(obj, prop) || (obj[prop] !== undefined)) {
        memo[prop] = obj[prop]
      }

      return memo
    }
    , {})
  },

  normalizeObjWithLength (obj) {
    // lodash shits the bed if our object has a 'length'
    // property so we have to normalize that
    if (_.has(obj, 'length')) {
      obj.Length = obj.length
      delete obj.length
    }

    return obj
  },

  // return a new object if the obj
  // contains the properties of filter
  // and the values are different
  filterOutOptions (obj, filter = {}) {
    _.defaults(filter, defaultOptions)

    this.normalizeObjWithLength(filter)

    const whereFilterHasSameKeyButDifferentValue = function (value, key) {
      const upperKey = _.capitalize(key)

      return (_.has(filter, key) || _.has(filter, upperKey)) &&
        (filter[key] !== value)
    }

    obj = _.pickBy(obj, whereFilterHasSameKeyButDifferentValue)

    if (_.isEmpty(obj)) {
      return undefined
    }

    return obj
  },

  stringifyActualObj (obj) {
    obj = this.normalizeObjWithLength(obj)

    const str = _.reduce(obj, (memo, value, key) => {
      memo.push(`${`${key}`.toLowerCase()}: ${this.stringifyActual(value)}`)

      return memo
    }
    , [])

    return `{${str.join(', ')}}`
  },

  stringifyActual (value) {
    const $dom = require('../dom')

    if ($dom.isDom(value)) {
      return $dom.stringify(value, 'short')
    }

    if (_.isFunction(value)) {
      return 'function(){}'
    }

    if (_.isArray(value)) {
      const len = value.length

      if (len > 3) {
        return `Array[${len}]`
      }

      return `[${_.map(value, _.bind(this.stringifyActual, this)).join(', ')}]`
    }

    if (_.isRegExp(value)) {
      return value.toString()
    }

    if (_.isObject(value)) {
      const len = _.keys(value).length

      if (len > 2) {
        return `Object{${len}}`
      }

      return this.stringifyActualObj(value)
    }

    if (_.isSymbol(value)) {
      return 'Symbol'
    }

    if (_.isUndefined(value)) {
      return undefined
    }

    return `${value}`
  },

  // give us some user-friendly "types"
  stringifyFriendlyTypeof: _.cond(USER_FRIENDLY_TYPE_DETECTORS),

  stringify (values) {
    // if we already have an array
    // then nest it again so that
    // its formatted properly
    values = [].concat(values)

    return _
    .chain(values)
    .map(_.bind(this.stringifyActual, this))
    .without(undefined)
    .join(', ')
    .value()
  },

  stringifyArg (arg) {
    if (!(!_.isString(arg) && !_.isNumber(arg) && !_.isBoolean(arg))) {
      return JSON.stringify(arg)
    }

    if (_.isNull(arg)) {
      return 'null'
    }

    if (_.isUndefined(arg)) {
      return 'undefined'
    }

    return this.stringifyActual(arg)
  },

  plural (obj, plural, singular) {
    obj = _.isNumber(obj) ? obj : obj.length
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

  escapeQuotes (text) {
    // convert to str and escape any single
    // or double quotes
    return (`${text}`).replace(quotesRe, '\\$1')
  },

  normalizeNumber (num) {
    const parsed = Number(num)

    // return num if this isNaN else return parsed
    if (_.isNaN(parsed)) {
      return num
    }

    return parsed
  },

  isValidHttpMethod (str) {
    return _.isString(str) && _.includes(methods, str.toLowerCase())
  },

  addTwentyYears () {
    return moment().add(20, 'years').unix()
  },

  locReload (forceReload, win) {
    return win.location.reload(forceReload)
  },

  locHref (url, win) {
    win.location.href = url
  },

  // locReplace: (win, url) ->
  //   win.location.replace(url)

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

  memoize (func, cacheInstance = new Map()) {
    const memoized = function (...args) {
      const key = args[0]
      const {
        cache,
      } = memoized

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
}
