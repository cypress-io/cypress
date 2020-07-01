const _ = require('lodash')

const $dom = require('../dom')
const $errUtils = require('../cypress/error_utils')

const crossOriginScriptRe = /^script error/i

const create = (state, config, log) => {
  const commandErr = (err) => {
    const current = state('current')

    return log({
      end: true,
      snapshot: true,
      error: err,
      consoleProps () {
        if (!current) return

        const obj = {}
        const prev = current.get('prev')

        // if type isnt parent then we know its dual or child
        // and we can add Applied To if there is a prev command
        // and it is a parent
        if (current.get('type') !== 'parent' && prev) {
          const ret = $dom.isElement(prev.get('subject')) ?
            $dom.getElements(prev.get('subject'))
            :
            prev.get('subject')

          obj['Applied To'] = ret

          return obj
        }
      },
    })
  }

  const createUncaughtException = (type, args) => {
    let [message, source, lineno, colno, err] = args // eslint-disable-line no-unused-vars
    let docsUrl

    // reset the message on a cross origin script error
    // since no details are accessible
    if (crossOriginScriptRe.test(message)) {
      const crossOriginErr = $errUtils.errByPath('uncaught.cross_origin_script')

      message = crossOriginErr.message
      docsUrl = crossOriginErr.docsUrl
    }

    // if we have the 5th argument it means we're in a modern browser with an
    // error object already provided. otherwise, we create one
    // it's possible the error was thrown as a string (throw 'some error')
    // so create it in the case it's not already an object
    err = _.isObject(err) ? err : $errUtils.errByPath('uncaught.error', {
      source,
      lineno,
      // if the error was thrown as a string (throw 'some error'), `err` is
      // the message ('some error') and message is some browser-created
      // variant (e.g. 'Uncaught some error')
      message: _.isString(err) ? err : message,
    })

    err.docsUrl = docsUrl

    const uncaughtErr = $errUtils.createUncaughtException(type, err)
    const current = state('current')

    uncaughtErr.onFail = () => {
      current?.getLastLog()?.error(uncaughtErr)
    }

    return uncaughtErr
  }

  const commandRunningFailed = (err) => {
    // allow for our own custom onFail function
    if (err.onFail) {
      err.onFail(err)

      // clean up this onFail callback
      // after its been called
      delete err.onFail
    } else {
      commandErr(err)
    }
  }

  return {
    // submit a generic command error
    commandErr,

    commandRunningFailed,

    createUncaughtException,
  }
}

module.exports = {
  create,
}
