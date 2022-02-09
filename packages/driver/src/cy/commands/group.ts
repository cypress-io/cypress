import _ from 'lodash'
import $errUtils from '../../cypress/error_utils'

type GroupOptions = {
  label: string
  message?: string
  snapshotStart?: boolean
  snapshotEnd?: boolean
  emitOnly?: boolean
}

export default function (Commands, Cypress, cy) {
  Commands.addAll({
    group (opts: string | GroupOptions, fn: () => any) {
      if (!opts && !(_.isObject(opts) || _.isString(opts))) {
        throw new Error('missing first arg')
        // return $errUtils.throwErrByPath('group.missingLabel')
      }

      console.log('group', opts || opts.label, typeof opts)

      let options: GroupOptions

      if (_.isObject(opts)) {
        if (!opts.label) {
          throw new Error('must provided label key if providing options to group')
        }

        options = opts
      } else {
        options = {
          label: opts,
        }
      }

      if (!_.isFunction(fn)) {
        return $errUtils.throwErrByPath('within.invalid_argument', { onFail: fn })
      }

      return cy.then(() => {
        return Cypress.log({
          name: options.label,
          message: options.message || '',
          $el: options.$el,
          // event: true, // don't include log in log count
          // type: 'parent',
          // message,
          // type: 'system',
          type: options.type || 'system',
          groupStart: true,
          emitOnly: options.emitOnly !== undefined ? options.emitOnly : false,
          snapshot: options.snapshotStart || false,
        })
      })
      .then(fn)
      .then(() => {
        Cypress.log({
          groupEnd: true,
          // end: true,
          snapshot: options.snapshotEnd || false,
          emitOnly: true,
        })
      })
    },

    // endGroup () {
    //   Cypress.log({
    //     groupEnd: true,
    //     emitOnly: true,
    //     snapshot: false,
    //   })
    // },
  })
}
