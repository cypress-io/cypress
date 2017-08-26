$ = require("jquery")
_ = require("lodash")
moment = require("moment")

$Location = require("./location")
errorMessages = require("./error_messages")

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

module.exports = {
  warning: (msg) ->
    console.warn("Cypress Warning: " + msg)

  log: (msgs...) ->
    console.log(msgs...)

  logInfo: (msgs...) ->
    console.info(msgs...)

  appendErrMsg: (err, message) ->
    ## preserve stack
    ## this is the critical part
    ## because the browser has a cached
    ## dynamic stack getter that will
    ## not be evaluated letare
    stack = err.stack

    ## preserve message
    msg = err.message

    ## slice out message
    stack = stack.split(msg)

    ## append message
    msg += "\n\n" + message

    ## set message
    err.message = msg

    ## reset stack
    err.stack = stack.join(msg)

    return err

  cloneErr: (err) ->
    err2 = new Error(err.message)
    err2.name = err.name

    for own prop, val of err
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
    if not errMessage = @getObjValueByPath errorMessages, errPath
      throw new Error "Error message path '#{errPath}' does not exist"

    if _.isFunction(errMessage)
      errMessage(args)
    else
      _.reduce args, (message, argValue, argKey) ->
        message.replace(new RegExp("\{\{#{argKey}\}\}", "g"), argValue)
      , errMessage

  ## TODO: replace this w/ lodash _.isSymbol
  ## which is a more extensive check for symbol
  _isSymbol: (value) ->
    typeof value is 'symbol'

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
    switch
      when @hasElement(value)
        @stringifyElement(value, "short")

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

      when @_isSymbol(value)
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

  hasDom: (obj) ->
    @hasElement(obj) or @hasWindow(obj) or @hasDocument(obj)

  hasWindow: (obj) ->
    try
      !!(obj and $.isWindow(obj[0])) or $.isWindow(obj)
    catch
      false

  hasElement: (obj) ->
    try
      !!(obj and obj[0] and _.isElement(obj[0])) or _.isElement(obj)
    catch
      false

  hasDocument: (obj) ->
    try
      !!((obj and obj.nodeType is 9) or (obj and obj[0] and obj[0].nodeType is 9))
    catch
      false

  isDescendent: ($el1, $el2) ->
    return false if not $el2

    !!(($el1.get(0) is $el2.get(0)) or $el1.has($el2).length)

  getDomElements: ($el) ->
    return if not $el?.length

    if $el.length is 1
      $el.get(0)
    else
      _.reduce $el, (memo, el) ->
        memo.push(el)
        memo
      , []

  ## short form css-inlines the element
  ## long form returns the outerHTML
  stringifyElement: (el, form = "long") ->
    ## if we are formatting the window object
    if @hasWindow(el)
      return "<window>"

    ## if we are formatting the document object
    if @hasDocument(el)
      return "<document>"

    ## convert this to jquery if its not already one
    $el = if @isJqueryInstance(el) then el else $(el)

    switch form
      when "long"
        text     = _.chain($el.text()).clean().truncate({length: 10 }).value()
        children = $el.children().length
        str      = $el.clone().empty().prop("outerHTML")
        switch
          when children then str.replace("></", ">...</")
          when text     then str.replace("></", ">#{text}</")
          else
            str
      when "short"
        str = $el.prop("tagName").toLowerCase()
        if id = $el.prop("id")
          str += "#" + id

        ## using attr here instead of class because
        ## svg's return an SVGAnimatedString object
        ## instead of a normal string when calling
        ## the property 'class'
        if klass = $el.attr("class")
          str += "." + klass.split(/\s+/).join(".")

        ## if we have more than one element,
        ## format it so that the user can see there's more
        if $el.length > 1
          "[ <#{str}>, #{$el.length - 1} more... ]"
        else
          "<#{str}>"

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

  ## clientX and clientY by their definition
  ## are calculated from viewport edge
  ## and should subtract the pageX or pageY offset
  ## see img: https://camo.githubusercontent.com/9963a83071b4b14c8dee6699335630f29d668d1f/68747470733a2f2f692d6d73646e2e7365632e732d6d7366742e636f6d2f64796e696d672f49433536313937302e706e67
  getClientX: (coords, win) ->
    coords.x - win.pageXOffset

  getClientY: (coords, win) ->
    coords.y - win.pageYOffset

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

  wrapInjQuery: (obj) ->
    if @isJqueryInstance(obj) then obj else $(obj)

  isJqueryInstance: (obj) ->
    ## does it have the jquery property and is the
    ## constructor a function?
    !!(obj and obj.jquery and _.isFunction(obj.constructor))

  addTwentyYears: ->
    moment().add(20, "years").unix()

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
}
