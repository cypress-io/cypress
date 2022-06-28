import Promise from 'bluebird'
import type { ICypress } from '../cypress'
import type { StateFunc } from '../cypress/state'

// eslint-disable-next-line @cypress/dev/arrow-body-multiline-braces
export const create = (Cypress: ICypress, state: StateFunc) => ({
  isStable: (stable: boolean = true, event: string) => {
    if (state('isStable') === stable) {
      return
    }

    state('isStable', stable)

    // we notify the outside world because this is what the runner uses to
    // show the 'loading spinner' during an app page loading transition event
    Cypress.action('cy:stability:changed', stable, event)

    Cypress.action('cy:before:stability:release', stable)
    .then(() => {
      const whenStable = state('whenStable')

      if (stable && whenStable) {
        whenStable()
      }
    })
  },

  whenStable: (fn: () => any) => {
    if (state('isStable') !== false) {
      return Promise.try(fn)
    }

    return new Promise((resolve, reject) => {
      // then when we become stable
      state('whenStable', () => {
        // reset this callback function
        state('whenStable', null)

        // and invoke the original function
        Promise.try(fn)
        .then(resolve)
        .catch(reject)
      })
    })
  },

  isAnticipatingCrossOriginResponseFor (request: {href: string}): void {
    if (state('anticipatingCrossOriginResponse') === request) {
      return
    }

    const whenAnticipatingCrossOriginResponse = state('whenAnticipatingCrossOriginResponse')

    if (!!request?.href && whenAnticipatingCrossOriginResponse) {
      whenAnticipatingCrossOriginResponse()
    }

    state('anticipatingCrossOriginResponse', request)
  },

  whenStableOrAnticipatingCrossOriginResponse (fn, command?) {
    const commandIsOrigin = command?.get('name') === 'origin'
    const commandIsEndLogGroup = command?.get('name') === 'end-logGroup'

    if (
      // cy.origin() needs to run when unstable (if we're anticipating
      // a cross-origin response) in order to allow it to set up a spec bridge
      // before the page loads and stability is restored
      (!!state('anticipatingCrossOriginResponse') && commandIsOrigin)
      // the end-logGroup command is inserted internally to mark the end of
      // a command group and needs to be allowed or stability will hang things
      // up if chaining cy.origin commands
      || commandIsEndLogGroup
      || state('isStable') !== false
    ) {
      return Promise.try(fn)
    }

    return new Promise((resolve, reject) => {
      let fulfilled = false

      const onSignal = () => {
        if (fulfilled) return

        fulfilled = true

        state('whenStable', null)
        state('whenAnticipatingCrossOriginResponse', null)

        Promise.try(fn)
        .then(resolve)
        .catch(reject)
      }

      state('whenStable', onSignal)

      // We only care to listen for anticipating cross origin request when the command we're waiting for is origin
      if (commandIsOrigin) {
        state('whenAnticipatingCrossOriginResponse', onSignal)
      }
    })
  },
})

export interface IStability extends ReturnType<typeof create> {}
