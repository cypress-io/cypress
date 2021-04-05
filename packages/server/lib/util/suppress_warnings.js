const _ = require('lodash')
const Debug = require('debug')

const debug = Debug('cypress:server:lib:util:suppress_warnings')

let suppressed = false

/**
 * Don't emit the NODE_TLS_REJECT_UNAUTHORIZED warning while
 * we work on proper SSL verification.
 * https://github.com/cypress-io/cypress/issues/5248
 */
const suppress = () => {
  if (suppressed || process.env.CYPRESS_INTERNAL_ENV === 'production') {
    // in development, still log warnings since they are helpful
    return
  }

  suppressed = true

  process.emitWarning = (warning, type, code, ...args) => {
    if (_.isString(warning) && _.includes(warning, 'NODE_TLS_REJECT_UNAUTHORIZED')) {
      // https://github.com/nodejs/node/blob/85e6089c4db4da23dd88358fe0a12edefcd411f2/lib/internal/options.js#L17

      return
    }

    // silence Buffer allocation warning since there are no
    // security problems due to the way Cypress works
    if (code === 'DEP0005') {
      // https://github.com/nodejs/node/blob/master/lib/buffer.js#L176-L192

      return
    }

    debug('suppressed emitWarning from node: %o', { process, warning, type, code, args })
  }
}

module.exports = {
  suppress,
}
