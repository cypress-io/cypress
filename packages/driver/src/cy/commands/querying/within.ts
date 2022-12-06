import _ from 'lodash'

import { $Command } from '../../../cypress/command'
import $errUtils from '../../../cypress/error_utils'
import group from '../../logGroup'

export default (Commands, Cypress, cy, state) => {
  const withinFn = (subject, fn) => {
    // reference the next command after this
    // within.  when that command runs we'll
    // know to remove withinSubject
    const current = state('current')
    const next = current.get('next')

    // backup the current withinSubject
    // this prevents a bug where we null out
    // withinSubject when there are nested .withins()
    // we want the inner within to restore the outer
    // once its done
    const prevWithinSubject = state('withinSubjectChain')

    state('withinSubjectChain', cy.subjectChain())

    // https://github.com/cypress-io/cypress/pull/8699
    // An internal command is inserted to create a divider between
    // commands inside within() callback and commands chained to it.
    const restoreCmdIndex = cy.queue.index + 1

    cy.queue.insert(restoreCmdIndex, $Command.create({
      args: [subject],
      name: 'within-restore',
      fn: (subject) => subject,
    }))

    fn.call(cy.state('ctx'), subject)

    const cleanup = () => {
      cy.removeListener('command:start', setWithinSubject)
    }

    // we need a mechanism to know when we should remove
    // our withinSubject so we dont accidentally keep it
    // around after the within callback is done executing
    // so when each command starts, check to see if this
    // is the command which references our 'next' and
    // if so, remove the within subject
    const setWithinSubject = (obj) => {
      if (obj !== next) {
        return
      }

      // okay so what we're doing here is creating a property
      // which stores the 'next' command which will reset the
      // withinSubject.  If two 'within' commands reference the
      // exact same 'next' command, then this prevents accidentally
      // resetting withinSubject more than once.  If they point
      // to different 'next's then its okay
      if (next !== state('nextWithinSubject')) {
        state('withinSubjectChain', prevWithinSubject || null)
        state('nextWithinSubject', next)
      }

      // regardless nuke this listeners
      cleanup()
    }

    // if next is defined then we know we'll eventually
    // unbind these listeners
    if (next) {
      cy.on('command:start', setWithinSubject)
    } else {
      // remove our listener if we happen to reach the end
      // event which will finalize cleanup if there was no next obj
      cy.once('command:queue:before:end', () => {
        cleanup()
        state('withinSubjectChain', null)
      })
    }

    // TODO: Rework cy.within to use chainer-based subject chaining, rather than its custom withinSubject state.
    // For now, we leave this logic in place and just ensure that the new rules don't interfere with it.
    cy.breakSubjectLinksToCurrentChainer()

    return subject
  }

  Commands.addAll({ prevSubject: ['element', 'document'] }, {
    within (subject, options, fn) {
      let userOptions = options

      if (_.isUndefined(fn)) {
        fn = userOptions
        userOptions = {}
      }

      options = _.defaults({}, userOptions, { log: true })

      const groupOptions: Cypress.LogGroup.Config = {
        log: options.log,
        $el: subject,
        message: '',
        timeout: options.timeout,
      }

      return group(Cypress, groupOptions, (log) => {
        if (!_.isFunction(fn)) {
          $errUtils.throwErrByPath('within.invalid_argument', { onFail: log })
        }

        if (subject.length > 1) {
          $errUtils.throwErrByPath('within.multiple_elements', { args: { num: subject.length }, onFail: log })
        }

        return withinFn(subject, fn)
      })
    },
  })
}
