const _ = require('lodash')
const $dom = require('../dom')
const $errUtils = require('../cypress/error_utils')
const $errorMessages = require('../cypress/error_messages')

const crossOriginScriptRe = /^script error/i

const create = function (state, config, log) {
  const commandErr = function (err) {
    const current = state('current')

    return log({
      end: true,
      snapshot: true,
      error: err,
      consoleProps () {
        let prev
        const obj = {}

        // if type isnt parent then we know its dual or child
        // and we can add Applied To if there is a prev command
        // and it is a parent
        if ((current.get('type') !== 'parent') && (prev = current.get('prev'))) {
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

  const createUncaughtException = function (type, args) {
    // eslint-disable-next-line no-unused-vars
    let [msg, source, lineno, colno, err] = args

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
    if (err == null) {
      err = createErrFromMsg()
    }

    const uncaughtErrLookup = (() => {
      switch (type) {
        case 'app': return 'uncaught.fromApp'
        case 'spec': return 'uncaught.fromSpec'
        default: null
      }
    })()

    const uncaughtErrObj = $errUtils.errObjByPath($errorMessages, uncaughtErrLookup)

    err.name = `Uncaught ${err.name}`

    const uncaughtErrProps = $errUtils.modifyErrMsg(err, uncaughtErrObj.message, (msg1, msg2) => `${msg1}\n\n${msg2}`)

    _.defaults(uncaughtErrProps, uncaughtErrObj)

    const uncaughtErr = $errUtils.mergeErrProps(err, uncaughtErrProps)

    uncaughtErr.onFail = function () {
      let l

      l = current && current.getLastLog()

      if (l) {
        return l.error(uncaughtErr)
      }
    }

    // normalize error message for firefox
    $errUtils.normalizeErrorStack(uncaughtErr)

    return uncaughtErr
  }

  const commandRunningFailed = function (err) {
    // allow for our own custom onFail function
    if (err.onFail) {
      err.onFail(err)

      // clean up this onFail callback
      // after its been called
      return delete err.onFail
    }

    return commandErr(err)
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
