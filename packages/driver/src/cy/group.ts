import $errUtils from '../cypress/error_utils'

type GroupOptions = {
  label?: string
  message?: string
  // $el?
  snapshotStart?: boolean
  snapshotEnd?: boolean
  log?: boolean
}

export const create = (cy) => {
  return {
    // group: (userOptions: GroupOptions, fn: (logger: any) => any) => {
    //   console.log('group', userOptions.label, typeof userOptions)

    //   if (_.isFunction(userOptions)) {
    //     fn = userOptions
    //     userOptions = {}
    //   }

    //   if (!_.isFunction(fn)) {
    //     return $errUtils.throwErrByPath('within.invalid_argument', { onFail: fn })
    //   }

    //   console.log('NAME is', state('current'))
    //   const current = state('current')
    //   const options = _.defaults({}, userOptions, {
    //     name: current.get('name'),
    //     type: current.get('type'),
    //     log: true,
    //     timeout: Cypress.config('defaultCommandTimeout'),
    //   })

    //   return cy.then(() => {
    //     Cypress.log({
    //       // message: options.message,
    //       // $el: options.$el,
    //       //   // event: true, // don't include log in log count
    //       //   // type: 'parent',
    //       //   // message,
    //       //   // type: 'system',
    //       //   // type: options.type || 'system',
    //       ...options,
    //       groupStart: true,
    //       emitOnly: options.log !== undefined ? !options.log : false,
    //       //   // snapshot: options.snapshotStart || false,
    //     })
    //   })
    //   .then(fn)
    //   .then((subject) => {
    //     Cypress.log({
    //       name: `${options}-end`,
    //       groupEnd: true,
    //       // end: true,
    //       // snapshot: options.snapshotEnd || false,
    //       emitOnly: true,
    //     })

    //     return subject
    //   })
    // },

    group: (userOptions: GroupOptions, fn: (logger: any) => any) => {
      // console.log('group', userOptions.label, typeof userOptions)

      if (_.isFunction(userOptions)) {
        fn = userOptions
        userOptions = {}
      }

      if (!_.isFunction(fn)) {
        return $errUtils.throwErrByPath('within.invalid_argument', { onFail: fn })
      }

      // console.log('NAME is', cy.state('current'))
      const current = cy.state('current')
      const options = _.defaults({}, userOptions, {
        name: current.get('name'),
        type: current.get('type'),
        log: true,
        timeout: Cypress.config('defaultCommandTimeout'),
      })

      // const cmdIndex = cy.state('index')

      // cy.queue.insert(restoreCmdIndex, $Command.create({
      //   // args: [subject],
      //   name: current.name,
      //   fn: () => {
      //     Cypress.log({
      //       // message: options.message,
      //       // $el: options.$el,
      //       //   // event: true, // don't include log in log count
      //       //   // type: 'parent',
      //       //   // message,
      //       //   // type: 'system',
      //       //   // type: options.type || 'system',
      //       ...options,
      //       groupStart: true,
      //       emitOnly: options.log !== undefined ? !options.log : false,
      //       //   // snapshot: options.snapshotStart || false,
      //     })
      //   },
      // }))

      // cy.queue.insert(cmdIndex + 1, $Command.create({
      //   name: current.get('name'),
      //   fn: (subject) => {
      //     const retu
      //   },
      // }))

      // cy.queue.insert(cmdIndex + 1, $Command.create({
      //   // args: [subject],
      //   name: 'group-restore',
      //   fn: (subject) => {
      //     console.log('group end', subject)
      //     Cypress.log({
      //       name: `${options}-end`,
      //       groupEnd: true,
      //       // end: true,
      //       // snapshot: options.snapshotEnd || false,
      //       emitOnly: true,
      //     })

      //     return subject
      //   },
      // }))

      // return cy.then(() => {

      // })

      // const getRet = () => {
      //   let ret = fn.apply args)

      //   if (ret && invokedCyCommand && !ret.then) {
      //     $errUtils.throwErrByPath('then.callback_mixes_sync_and_async', {
      //       onFail: options._log,
      //       args: { value: $utils.stringify(ret) },
      //     })
      //   }

      //   return ret
      // }

      return cy.then(() => {
        const logger = Cypress.log({
          // message: options.message,
          // $el: options.$el,
          //   // event: true, // don't include log in log count
          //   // type: 'parent',
          //   // message,
          //   // type: 'system',
          //   // type: options.type || 'system',
          ...options,
          groupStart: true,
          emitOnly: options.log !== undefined ? !options.log : false,
          //   // snapshot: options.snapshotStart || false,
        })

        let ret = fn(logger)

        if (ret && !ret.then) {
          return Promise.resolve(ret)
        }

        return ret
      })
      // })
      // .then((lggfn)
      .then((subject) => {
        Cypress.log({
          name: `${options.name}-end`,
          groupEnd: true,
          // end: true,
          // snapshot: options.snapshotEnd || false,
          emitOnly: true,
        })

        return subject
      })
    },
  }
}

export interface ILocation extends ReturnType<typeof create> {}
