const _ = require('lodash')

const originalEmitWarning = process.emitWarning

let suppressed = false

/**
 * Don't emit the NODE_TLS_REJECT_UNAUTHORIZED warning while
 * we work on proper SSL verification.
 * https://github.com/cypress-io/cypress/issues/5248
 */
const suppress = () => {
  if (suppressed) {
    return
  }

  suppressed = true

  process.emitWarning = (warning, type, code, ...args) => {
    if (_.isString(warning) && _.includes(warning, 'NODE_TLS_REJECT_UNAUTHORIZED')) {
      // https://github.com/nodejs/node/blob/82f89ec8c1554964f5029fab1cf0f4fad1fa55a8/lib/_tls_wrap.js#L1378-L1384

      return
    }

    // silence Buffer allocation warning since there are no
    // security problems due to the way Cypress works
    if (code === 'DEP0005') {
      // https://github.com/nodejs/node/blob/master/lib/buffer.js#L176-L192

      return
    }

    return originalEmitWarning.call(process, warning, type, code, ...args)
  }
}

module.exports = {
  suppress,
}
