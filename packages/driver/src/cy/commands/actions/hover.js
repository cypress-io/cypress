const $utils = require('../../../cypress/utils')

module.exports = (Commands, Cypress, cy, state, config) => {
  return Commands.addAll({ prevSubject: 'element' }, {
    hover (args) {
      return $utils.throwErrByPath('hover.not_implemented')
    },
  })
}
