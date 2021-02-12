const $dom = require('../dom')
const $errUtils = require('../cypress/error_utils')

const create = (state, log) => {
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

  const createUncaughtException = (type, originalErr) => {
    const err = $errUtils.createUncaughtException(type, originalErr)
    const current = state('current')

    err.onFail = () => {
      current?.getLastLog()?.error(err)
    }

    return err
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
