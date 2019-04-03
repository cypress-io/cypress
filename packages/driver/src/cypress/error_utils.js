const _ = require('lodash')
const { codeFrameColumns } = require('@babel/code-frame')

const $errorMessages = require('./error_messages')
const twoOrMoreNewLinesRe = /\n{2,}/

const mdReplacements = [
  ['`', '\\`'],
]

module.exports = {
  //# TODO: rename this method because
  //# it does more than append now
  appendErrMsg (err, messageOrObj) {
    //# preserve stack
    //# this is the critical part
    //# because the browser has a cached
    //# dynamic stack getter that will
    //# not be evaluated later
    const { stack } = err

    let message = messageOrObj

    //# if our message is an obj w/ multiple props...
    if (_.isObject(messageOrObj)) {
      //# then extract the actual 'message' (the string)
      //# and merge the other props into the existing err
      _.extend(err, _.omit(messageOrObj, 'message'));
      ({ message } = messageOrObj)
    }

    //# preserve message
    //# and toString
    let msg = err.message
    const str = err.toString()

    //# append message
    msg += `\n\n${message}`

    //# set message
    err.message = msg

    //# reset stack by replacing the original first line
    //# with the new one
    err.stack = stack.replace(str, err.toString())

    return err
  },

  cloneErr (obj) {
    const err2 = new Error(obj.message)

    err2.name = obj.name
    err2.stack = obj.stack

    for (let prop of Object.keys(obj || {})) {
      const val = obj[prop]

      if (!err2[prop]) {
        err2[prop] = val
      }
    }

    return err2
  },

  throwErr (err, options = {}) {
    if (_.isString(err)) {
      err = this.cypressErr(err)
    }

    let { onFail } = options

    //# assume onFail is a command if
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
  },

  throwErrByPath (errPath, options = {}) {
    let err
    const args = _.extend(options.args, { includeMdMessage: true })

    try {
      //# TODO: errByPath?
      const msg = this.errMsgByPath(errPath, args)

      err = this.cypressErr(msg.message)
      err.mdMessage = msg.mdMessage
    } catch (e) {
      err = this.internalErr(e)
    }

    return this.throwErr(err, options)
  },

  internalErr (err) {
    err = new Error(err)
    err.name = 'InternalError'

    return err
  },

  cypressErr (err) {
    err = new Error(err)
    err.name = 'CypressError'

    return err
  },

  normalizeMsgNewLines (message) {
    //# normalize two or more new lines
    //# into only exactly two new lines
    return _
    .chain(message)
    .split(twoOrMoreNewLinesRe)
    .compact()
    .join('\n\n')
    .value()
  },

  formatErrMsg (errMessage, options) {
    const getMsg = function (args) {
      if (_.isFunction(errMessage)) {
        return errMessage(args)
      }

      if (_.isObject(errMessage)) {
        errMessage = errMessage.message

        if (!errMessage) {
          throw new Error(`Error message path: '${errMessage}' does not have a 'message' property`)
        }
      }

      return _.reduce(args, (message, argValue, argKey) => {
        return message.replace(new RegExp(`\{\{${argKey}\}\}`, 'g'), argValue)
      }
        , errMessage)
    }

    //# Return obj with message and message with escaped markdown
    if (options != null ? options.includeMdMessage : undefined) {
      const args = _.clone(options)

      delete args.includeMd

      const { escapeErrMarkdown } = this
      const escapedArgs = {}

      Object.keys(args).forEach((key) => {
        return escapedArgs[key] = escapeErrMarkdown(args[key])
      })

      return {
        message: this.normalizeMsgNewLines(getMsg(args)),
        mdMessage: this.normalizeMsgNewLines(getMsg(escapedArgs)),
      }
    }

    return this.normalizeMsgNewLines(getMsg(options))
  },

  errObjByPath (errPath, options) {
    let errObjOrStr

    if (!(errObjOrStr = this.getObjValueByPath($errorMessages, errPath))) {
      throw new Error(`Error message path: '${errPath}' does not exist`)
    }

    let errObj = errObjOrStr

    if (_.isString(errObjOrStr)) {
      //# normalize into an object if
      //# given a string
      errObj = {
        message: errObjOrStr,
      }
    }

    errObj.message = this.formatErrMsg(errObj.message, options)

    return errObj
  },

  errMsgByPath (errPath, options) {
    let errMessage

    if (!(errMessage = this.getObjValueByPath($errorMessages, errPath))) {
      throw new Error(`Error message path: '${errPath}' does not exist`)
    }

    return this.formatErrMsg(errMessage, options)
  },

  //# TODO: This isn't in use for the reporter,
  //# but we may want this for stdout in run mode
  getCodeFrame (source, path, lineNumber, columnNumber) {
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
  },

  escapeErrMarkdown (text) {
    if (!_.isString(text)) {
      return text
    }

    //# escape markdown syntax supported by reporter
    mdReplacements.forEach(function (replacement) {
      const re = new RegExp(replacement[0], 'g')

      return text = text.replace(re, replacement[1])
    })

    return text
  },

  getObjValueByPath (obj, keyPath) {
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
  },
}
