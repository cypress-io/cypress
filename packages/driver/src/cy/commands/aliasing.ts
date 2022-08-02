import _ from 'lodash'
import $dom from '../../dom'

export default function (Commands, Cypress, cy, state) {
  Commands.addAll({ type: 'utility', prevSubject: true }, {
    as (subject, str) {
      const ctx = this

      cy.validateAlias(str)

      // this is the previous command
      // which we are setting the alias as
      const prev = state('current').get('prev')

      prev.set('alias', str)

      const noLogFromPreviousCommandIsAlreadyAliased = () => {
        return _.every(prev.get('logs'), (log) => {
          return log.get('alias') !== str
        })
      }

      // TODO: change the log type from `any` to `Log`.
      // we also need to set the alias on the last command log
      // that matches our chainerId
      const log: any = _.last(cy.queue.logs({
        instrument: 'command',
        event: false,
        chainerId: state('chainerId'),
      }))

      if (log) {
        // make sure this alias hasn't already been applied
        // to the previous command's logs by looping through
        // all of its logs and making sure none of them are
        // set to this alias
        if (noLogFromPreviousCommandIsAlreadyAliased()) {
          log.set({
            alias: str,
            aliasType: $dom.isElement(subject) ? 'dom' : 'primitive',
          })
        }
      }

      const fileName = prev.get('fileName')

      cy.addAlias(ctx, { subject, command: prev, alias: str, fileName })

      return subject
    },
  })
}
