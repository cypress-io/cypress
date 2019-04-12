const _ = require('lodash')
const { codeFrameColumns } = require('@babel/code-frame')

const $errorMessages = require('./error_messages')

const ERROR_PROPS = 'message mdMessage type name stack fileName lineNumber columnNumber host uncaught actual expected showDiff isPending docsUrl'.split(' ')

const CypressErrorRe = /(AssertionError|CypressError)/
const twoOrMoreNewLinesRe = /\n{2,}/
const mdReplacements = [
  ['`', '\\`'],
]

const modifyErrMsg = (err, messageOrObj, cb) => {
  // preserve stack
  // this is the critical part
  // because the browser has a cached
  // dynamic stack getter that will
  // not be evaluated later
  const { stack } = err

  let message = messageOrObj

  // if our message is an obj w/ multiple props...
  if (_.isObject(messageOrObj)) {
    // then extract the actual 'message' (the string)
    // and merge the other props into the existing err
    _.defaults(err, _.omit(messageOrObj, 'message'));
    ({ message } = messageOrObj)
  }

  // if our original err is an object
  if (_.isObject(err)) {
    // modify message
    err.message = cb(err.message, message)

    if (stack) {
      // reset stack by replacing the original
      // first line with the new one
      err.stack = stack.replace(err.message, err.toString())
    }
  }

  // if our original err is a string
  if (_.isString(err)) {
    err = cb(err, message)
  }

  return err
}

const appendErrMsg = (err, messageOrObj) => {
  return modifyErrMsg(err, messageOrObj, (msg1, msg2) => {
    return `${msg1}\n\n${msg2}`
  })
}

const makeErrFromObj = (obj) => {
  const err2 = new Error(obj.message)

  err2.name = obj.name
  err2.stack = obj.stack

  _.each(obj, (val, prop) => {
    if (!err2[prop]) {
      err2[prop] = val
    }
  })

  return err2
}

const throwErr = (err, options = {}) => {
  if (_.isString(err)) {
    err = cypressErr(err)
  }

  let { onFail } = options

  // assume onFail is a command if
  //# onFail is present and isnt a function
  if (onFail && !_.isFunction(onFail)) {
    const command = onFail

    //# redefine onFail and automatically
    //# hook this into our command
    onFail = (err) => {
      return command.error(err)
    }
  }

  if (onFail) {
    err.onFail = onFail
  }

  throw err
}

const throwErrByPath = (errPath, options = {}) => {
  const { args } = options
  let err

  try {
    const obj = errObjByPath($errorMessages, errPath, args)

    err = cypressErr(obj.message)
    _.defaults(err, obj)
  } catch (e) {
    err = internalErr(e)
  }

  return throwErr(err, options)
}

const internalErr = (err) => {
  err = new Error(err)
  err.name = 'InternalError'

  return err
}

const cypressErr = (err) => {
  err = new Error(err)
  err.name = 'CypressError'

  return err
}

const normalizeMsgNewLines = (message) => {
  //# normalize more than 2 new lines
  //# into only exactly 2 new lines
  return _
  .chain(message)
  .split(twoOrMoreNewLinesRe)
  .compact()
  .join('\n\n')
  .value()
}

const formatErrMsg = (errMessage, args) => {
  const getMsg = function (args = {}) {
    return _.reduce(args, (message, argValue, argKey) => {
      return message.replace(new RegExp(`\{\{${argKey}\}\}`, 'g'), argValue)
    }, errMessage)
  }

  return normalizeMsgNewLines(getMsg(args))
}

const errObjByPath = (errLookupObj, errPath, args) => {
  let errObjStrOrFn = getObjValueByPath(errLookupObj, errPath)

  if (!errObjStrOrFn) {
    throw new Error(`Error message path: '${errPath}' does not exist`)
  }

  let errObj = errObjStrOrFn

  if (_.isFunction(errObjStrOrFn)) {
    errObj = errObjStrOrFn(args)
  }

  if (_.isString(errObj)) {
    // normalize into object if given string
    errObj = {
      message: errObj,
    }
  }

  // Return obj with message and message with escaped markdown
  const escapedArgs = _.mapValues(args, escapeErrMarkdown)

  errObj.mdMessage = formatErrMsg(errObj.message, escapedArgs)
  errObj.message = formatErrMsg(errObj.message, args)

  return errObj
}

const errMsgByPath = (errPath, args) => {
  return getErrMsgWithObjByPath($errorMessages, errPath, args)
}

const getErrMsgWithObjByPath = (errLookupObj, errPath, args) => {
  const errObj = errObjByPath(errLookupObj, errPath, args)

  return errObj.message
}

const getErrMessage = (err) => {
  if (err && err.displayMessage) {
    return err.displayMessage
  }

  if (err && err.message) {
    return err.message
  }

  return err
}

const getErrStack = (err) => {
  // if cypress or assertion error
  // don't return the stack
  if (CypressErrorRe.test(err.name)) {
    return err.toString()
  }

  return err.stack
}

//# TODO: This isn't in use for the reporter,
//# but we may want this for stdout in run mode
const getCodeFrame = (source, path, lineNumber, columnNumber) => {
  const location = { start: { line: lineNumber, column: columnNumber } }
  const options = {
    highlightCode: true,
    forceColor: true,
  }

  return {
    frame: codeFrameColumns(source, location, options),
    path,
    lineNumber,
    columnNumber,
  }
}

const escapeErrMarkdown = (text) => {
  if (!_.isString(text)) {
    return text
  }

  // escape markdown syntax supported by reporter
  return _.reduce(mdReplacements, (str, replacement) => {
    const re = new RegExp(replacement[0], 'g')

    return str.replace(re, replacement[1])
  }, text)
}

const getObjValueByPath = (obj, keyPath) => {
  if (!_.isObject(obj)) {
    throw new Error('The first parameter to utils.getObjValueByPath() must be an object')
  }

  if (!_.isString(keyPath)) {
    throw new Error('The second parameter to utils.getObjValueByPath() must be a string')
  }

  const keys = keyPath.split('.')
  let val = obj

  for (let key of keys) {
    val = val[key]
    if (!val) {
      break
    }
  }

  return val
}

module.exports = {
  ERROR_PROPS,
  modifyErrMsg,
  appendErrMsg,
  makeErrFromObj,
  throwErr,
  throwErrByPath,
  internalErr,
  cypressErr,
  normalizeMsgNewLines,
  errObjByPath,
  getErrMsgWithObjByPath,
  getErrMessage,
  errMsgByPath,
  getErrStack,
  getCodeFrame,
  escapeErrMarkdown,
  getObjValueByPath,
}
