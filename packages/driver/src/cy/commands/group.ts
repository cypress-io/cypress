import _ from 'lodash'
import $errUtils from '../../cypress/error_utils'
import logGroup from '../logGroup'

export default function (Commands, Cypress, cy) {
  Commands.addAll({
    group (opts: string | any, fn: (log) => any) {
      if (!opts && !(_.isObject(opts) || _.isString(opts))) {
        throw new Error('missing first arg')
        // return $errUtils.throwErrByPath('group.missingLabel')
      }

      let options

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

      const log = logGroup(Cypress, options)
          // name: options.label,
      //     message: options.message || '',
      //     $el: options.$el,
      //     // event: true, // don't include log in log count
      //     // type: 'parent',
      //     // message,
      //     type: 'system',
      //     groupStart: true,
      //     emitOnly: options.emitOnly !== undefined ? options.emitOnly : false,
      //     snapshot: options.snapshotStart || false,
      //   })
      // })
      
      return fn(log)
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
