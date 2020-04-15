const _ = require('lodash')

const $dom = require('../../dom')

module.exports = function (Commands, Cypress, cy, state) {
  Commands.addAll({ type: 'utility', prevSubject: true }, {
    as (subject, str) {
      const ctx = this

      cy.validateAlias(str)

      // this is the previous command
      // which we are setting the alias as
      const prev = state('current').get('prev')

      prev.set('alias', str)

      const noLogFromPreviousCommandisAlreadyAliased = () => {
        return _.every(prev.get('logs'), (log) => {
          return log.get('alias') !== str
        })
      }

      // we also need to set the alias on the last command log
      // that matches our chainerId
      const log = _.last(cy.queue.logs({
        instrument: 'command',
        event: false,
        chainerId: state('chainerId'),
      }))

      if (log) {
        // make sure this alias hasn't already been applied
        // to the previous command's logs by looping through
        // all of its logs and making sure none of them are
        // set to this alias
        if (noLogFromPreviousCommandisAlreadyAliased()) {
          log.set({
            alias: str,
            aliasType: $dom.isElement(subject) ? 'dom' : 'primitive',
          })
        }
      }

      cy.addAlias(ctx, { subject, command: prev, alias: str })

      return subject
    },
  })
}
