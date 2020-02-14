$ = require("jquery")
_ = require("lodash")
methods = require("methods")
moment = require("moment")

$jquery = require("../dom/jquery")
$Location = require("./location")

tagOpen     = /\[([a-z\s='"-]+)\]/g
tagClosed   = /\[\/([a-z]+)\]/g
quotesRe    = /('|")/g

defaultOptions = {
  delay: 10
  force: false
  timeout: null
  interval: null
  multiple: false
  waitForAnimations: true
  animationDistanceThreshold: 5
}

USER_FRIENDLY_TYPE_DETECTORS = _.map([
  [_.isUndefined, "undefined"]
  [_.isNull, "null"]
  [_.isBoolean, "boolean"]
  [_.isNumber, "number"]
  [_.isString, "string"]
  [_.isRegExp, "regexp"]
  [_.isSymbol, "symbol"]
  [_.isElement, "element"]
  [_.isError, "error"]
  [_.isSet, "set"]
  [_.isWeakSet, "set"]
  [_.isMap, "map"]
  [_.isWeakMap, "map"]
  [_.isFunction, "function"]
  [_.isArrayLikeObject, "array"]
  [_.isBuffer, "buffer"]
  [_.isDate, "date"]
  [_.isObject, "object"]
  [_.stubTrue, "unknown"]
], ([ fn, type]) ->
  return [fn, _.constant(type)]
)

module.exports = {
  warning: (msg) ->
    console.warn("Cypress Warning: " + msg)

  log: (msgs...) ->
    console.log(msgs...)

  unwrapFirst: (val) ->
    ## this method returns the first item in an array
    ## and if its still a jquery object, then we return
    ## the first() jquery element
    item = [].concat(val)[0]

    if $jquery.isJquery(item)
      return item.first()

    return item

  switchCase: (value, casesObj, defaultKey = "default") ->
    if _.has(casesObj, value)
      return _.result(casesObj, value)

    if _.has(casesObj, defaultKey)
      return _.result(casesObj, defaultKey)

    keys = _.keys(casesObj)
    throw new Error("The switch/case value: '#{value}' did not match any cases: #{keys.join(', ')}.")

  reduceProps: (obj, props = []) ->
    return null if not obj

    _.reduce props, (memo, prop) ->
      if _.has(obj, prop) or (obj[prop] isnt undefined)
        memo[prop] = obj[prop]
      memo
    , {}

  normalizeObjWithLength: (obj) ->
    ## lodash shits the bed if our object has a 'length'
    ## property so we have to normalize that
    if _.has(obj, "length")
      obj.Length = obj.length
      delete obj.length

    obj

  ## return a new object if the obj
  ## contains the properties of filter
  ## and the values are different
  filterOutOptions: (obj, filter = {}) ->
    _.defaults filter, defaultOptions

    @normalizeObjWithLength(filter)

    whereFilterHasSameKeyButDifferentValue = (value, key) ->
      upperKey = _.capitalize(key)

      (_.has(filter, key) or _.has(filter, upperKey)) and
        filter[key] isnt value

    obj = _.pickBy(obj, whereFilterHasSameKeyButDifferentValue)

    if _.isEmpty(obj) then undefined else obj

  stringifyActualObj: (obj) ->
    obj = @normalizeObjWithLength(obj)

    str = _.reduce obj, (memo, value, key) =>
      memo.push "#{key}".toLowerCase() + ": " + @stringifyActual(value)
      memo
    , []

    "{" + str.join(", ") + "}"

  stringifyActual: (value) ->
    $dom = require("../dom")

    switch
      when $dom.isDom(value)
        $dom.stringify(value, "short")

      when _.isFunction(value)
        "function(){}"

      when _.isArray(value)
        len = value.length
        if len > 3
          "Array[#{len}]"
        else
          "[" + _.map(value, _.bind(@stringifyActual, @)).join(", ") + "]"

      when _.isRegExp(value)
        value.toString()

      when _.isObject(value)
        len = _.keys(value).length
        if len > 2
          "Object{#{len}}"
        else
          @stringifyActualObj(value)

      when _.isSymbol(value)
        "Symbol"

      when _.isUndefined(value)
        undefined

      else
        "" + value

  ## give us some user-friendly "types"
  stringifyFriendlyTypeof: _.cond(USER_FRIENDLY_TYPE_DETECTORS)

  stringify: (values) ->
    ## if we already have an array
    ## then nest it again so that
    ## its formatted properly
    values = [].concat(values)

    _
    .chain(values)
    .map(_.bind(@stringifyActual, @))
    .without(undefined)
    .join(", ")
    .value()

  stringifyArg: (arg) ->
    switch
      when _.isString(arg) or _.isNumber(arg) or _.isBoolean(arg)
        JSON.stringify(arg)
      when _.isNull(arg)
        "null"
      when _.isUndefined(arg)
        "undefined"
      else
        @stringifyActual(arg)

  plural: (obj, plural, singular) ->
    obj = if _.isNumber(obj) then obj else obj.length
    if obj > 1 then plural else singular

  convertHtmlTags: (html) ->
    html
      .replace(tagOpen, "<$1>")
      .replace(tagClosed, "</$1>")

  isInstanceOf: (instance, constructor) ->
    try
      instance instanceof constructor
    catch e
      false

  escapeQuotes: (text) ->
    ## convert to str and escape any single
    ## or double quotes
    ("" + text).replace(quotesRe, "\\$1")

  normalizeNumber: (num) ->
    parsed = Number(num)

    ## return num if this isNaN else return parsed
    if _.isNaN(parsed) then num else parsed

  isValidHttpMethod: (str) ->
    _.isString(str) and _.includes(methods, str.toLowerCase())

  addTwentyYears: ->
    moment().add(20, "years").unix()

  locReload: (forceReload, win) ->
    win.location.reload(forceReload)

  locHref: (url, win) ->
    win.location.href = url

  # locReplace: (win, url) ->
  #   win.location.replace(url)

  locToString: (win) ->
    win.location.toString()

  locExisting: ->
    $Location.create(window.location.href)

  iframeSrc: ($autIframe, url) ->
    $autIframe.prop("src", url)

  getDistanceBetween: (point1, point2) ->
    deltaX = point1.x - point2.x
    deltaY = point1.y - point2.y

    Math.sqrt(deltaX * deltaX + deltaY * deltaY)

  memoize: (func, cacheInstance = new Map()) ->
    memoized = (args...) ->
      key = args[0]
      cache = memoized.cache

      return cache.get(key) if cache.has(key)

      result = func.apply(this, args)
      memoized.cache = cache.set(key, result) || cache

      return result

    memoized.cache = cacheInstance

    return memoized
}
