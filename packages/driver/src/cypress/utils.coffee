$ = require("jquery")
_ = require("lodash")
moment = require("moment")
Promise = require("bluebird")

$jquery = require("../dom/jquery")
$Location = require("./location")
$errorMessages = require("./error_messages")

tagOpen     = /\[([a-z\s='"-]+)\]/g
tagClosed   = /\[\/([a-z]+)\]/g
quotesRe    = /('|")/g
twoOrMoreNewLinesRe = /\n{2,}/

defaultOptions = {
  delay: 10
  force: false
  timeout: null
  interval: null
  multiple: false
  waitForAnimations: true
  animationDistanceThreshold: 5
}

module.exports = {
  warning: (msg) ->
    console.warn("Cypress Warning: " + msg)

  log: (msgs...) ->
    console.log(msgs...)

  logInfo: (msgs...) ->
    console.info(msgs...)

  unwrapFirst: (val) ->
    ## this method returns the first item in an array
    ## and if its still a jquery object, then we return
    ## the first() jquery element
    item = [].concat(val)[0]

    if $jquery.isJquery(item)
      ## Need check to support jQuery legacy versions
      ## https://github.com/cypress-io/cypress/issues/2927
      if item.first
        return item.first()

    return item

  switchCase: (value, casesObj, defaultKey = "default") ->
    if _.has(casesObj, value)
      return _.result(casesObj, value)

    if _.has(casesObj, defaultKey)
      return _.result(casesObj, defaultKey)

    keys = _.keys(casesObj)
    throw new Error("The switch/case value: '#{value}' did not match any cases: #{keys.join(', ')}.")

  appendErrMsg: (err, message) ->
    ## preserve stack
    ## this is the critical part
    ## because the browser has a cached
    ## dynamic stack getter that will
    ## not be evaluated later
    stack = err.stack

    ## preserve message
    ## and toString
    msg = err.message
    str = err.toString()

    ## append message
    msg += "\n\n" + message

    ## set message
    err.message = msg

    ## reset stack by replacing the original first line
    ## with the new one
    err.stack = stack.replace(str, err.toString())

    return err

  cloneErr: (obj) ->
    err2 = new Error(obj.message)
    err2.name = obj.name
    err2.stack = obj.stack

    for own prop, val of obj
      if not err2[prop]
        err2[prop] = val

    return err2

  throwErr: (err, options = {}) ->
    if _.isString(err)
      err = @cypressErr(err)

    onFail = options.onFail
    ## assume onFail is a command if
    ## onFail is present and isnt a function
    if onFail and not _.isFunction(onFail)
      command = onFail

      ## redefine onFail and automatically
      ## hook this into our command
      onFail = (err) ->
        command.error(err)

    err.onFail = onFail if onFail

    throw err

  throwErrByPath: (errPath, options = {}) ->
    err = try
      @errMessageByPath errPath, options.args
    catch e
      err = @internalErr e

    @throwErr(err, options)

  internalErr: (err) ->
    err = new Error(err)
    err.name = "InternalError"
    err

  cypressErr: (err) ->
    err = new Error(err)
    err.name = "CypressError"
    err

  errMessageByPath: (errPath, args) ->
    if not errMessage = @getObjValueByPath($errorMessages, errPath)
      throw new Error "Error message path '#{errPath}' does not exist"

    getMsg = ->
      if _.isFunction(errMessage)
        errMessage(args)
      else
        _.reduce args, (message, argValue, argKey) ->
          message.replace(new RegExp("\{\{#{argKey}\}\}", "g"), argValue)
        , errMessage

    ## normalize two or more new lines
    ## into only exactly two new lines
    _
    .chain(getMsg())
    .split(twoOrMoreNewLinesRe)
    .compact()
    .join('\n\n')
    .value()

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

  getObjValueByPath: (obj, keyPath) ->
    if not _.isObject obj
      throw new Error "The first parameter to utils.getObjValueByPath() must be an object"
    if not _.isString keyPath
      throw new Error "The second parameter to utils.getObjValueByPath() must be a string"
    keys = keyPath.split '.'
    val = obj
    for key in keys
      val = val[key]
      break unless val
    val

  isCommandFromThenable: (cmd) ->
    args = cmd.get("args")

    cmd.get("name") is "then" and
      args.length is 3 and
        _.every(args, _.isFunction)

  addTwentyYears: ->
    moment().add(20, "years").unix()

  locReload: (forceReload, win) ->
    win.location.reload(forceReload)

  locHref: (url, win) ->
    win.location.href = url

  locReplace: (win, url) ->
    win.location.replace(url)

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

  runSerially: (fns) ->
    values = []

    run = (index) ->
      Promise
      .try ->
        fns[index]()
      .then (value) ->
        values.push(value)
        index++
        if fns[index]
          run(index)
        else
          values

    run(0)
}
