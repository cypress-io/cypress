import chai from 'chai'
import * as chaiInspect from './inspect'

const { inspect, setFormatValueHook } = chaiInspect.create(chai)

// prevent tunneling into Window objects (can throw cross-origin errors)
setFormatValueHook((ctx, val) => {
  // https://github.com/cypress-io/cypress/issues/5270
  // When name attribute exists in <iframe>,
  // Firefox returns [object Window] but Chrome returns [object Object]
  // So, we try throwing an error and check the error message.
  try {
    val && val.document
    val && val.inspect
  } catch (e: any) {
    if (e.stack.indexOf('cross-origin') !== -1 || // chrome
    e.message.indexOf('cross-origin') !== -1) { // firefox
      return `[window]`
    }
  }

  return
})

export { inspect }

export const objDisplay = (obj) => {
  const str = inspect(obj)
  const type = Object.prototype.toString.call(obj)

  if (chai.config.truncateThreshold && (str.length >= chai.config.truncateThreshold)) {
    if (type === '[object Function]') {
      if (!obj.name || (obj.name === '')) {
        return '[Function]'
      }

      return `[Function: ${obj.name}]`
    }

    if (type === '[object Array]') {
      return `[ Array(${obj.length}) ]`
    }

    if (type === '[object Object]') {
      const keys = Object.keys(obj)
      const kstr = keys.length > 2 ? `${keys.splice(0, 2).join(', ')}, ...` : keys.join(', ')

      return `{ Object (${kstr}) }`
    }

    return str
  }

  return str
}
