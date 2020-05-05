const _ = require('lodash')
const $dom = require('../dom')
const $errUtils = require('../cypress/error_utils')
const $errorMessages = require('../cypress/error_messages')

const crossOriginScriptRe = /^script error/i

const create = (state, config, log) => {
  const commandErr = (err) => {
    const current = state('current')

    return log({
      end: true,
      snapshot: true,
      error: err,
      consoleProps () {
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
    // @ts-ignore
    let [msg, source, lineno, colno, err] = args // eslint-disable-line no-unused-vars

    const current = state('current')

    // reset the msg on a cross origin script error
    // since no details are accessible
    if (crossOriginScriptRe.test(msg)) {
      msg = $errUtils.errMsgByPath('uncaught.cross_origin_script')
    }

    const createErrFromMsg = () => {
      return new Error($errUtils.errMsgByPath('uncaught.error', {
        msg, source, lineno,
      }))
    }

    // if we have the 5th argument it means we're in a super
    // modern browser making this super simple to work with.
    err = err ?? createErrFromMsg()

    let uncaughtErrLookup = ''

    if (type === 'app') {
      uncaughtErrLookup = 'uncaught.fromApp'
    } else if (type === 'spec') {
      uncaughtErrLookup = 'uncaught.fromSpec'
    }

    const uncaughtErrObj = $errUtils.errObjByPath($errorMessages, uncaughtErrLookup)

    const uncaughtErrProps = $errUtils.modifyErrMsg(err, uncaughtErrObj.message, (msg1, msg2) => {
      return `${msg1}\n\n${msg2}`
    })

    _.defaults(uncaughtErrProps, uncaughtErrObj)

    const uncaughtErr = $errUtils.mergeErrProps(err, uncaughtErrProps)

    $errUtils.modifyErrName(err, `Uncaught ${err.name}`)

    uncaughtErr.onFail = () => {
      const l = current && current.getLastLog()

      if (l) {
        return l.error(uncaughtErr)
      }
    }

    // normalize error message for firefox
    $errUtils.normalizeErrorStack(uncaughtErr)

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
