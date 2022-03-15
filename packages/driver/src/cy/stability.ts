import Promise from 'bluebird'

// eslint-disable-next-line @cypress/dev/arrow-body-multiline-braces
export const create = (Cypress, state) => ({
  isStable: (stable: boolean = true, event: string) => {
    if (state('isStable') === stable) {
      return
    }

    const whenStable = state('whenStable')

    if (stable && whenStable) {
      whenStable()
    }

    state('isStable', stable)

    // we notify the outside world because this is what the runner uses to
    // show the 'loading spinner' during an app page loading transition event
    Cypress.action('cy:stability:changed', stable, event)
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

  isAnticipatingMultiDomainFor (href: string): void {
    if (state('anticipatingMultiDomain') === href) {
      return
    }

    const whenAnticipatingMultiDomain = state('whenAnticipatingMultiDomain')

    if (!!href && whenAnticipatingMultiDomain) {
      whenAnticipatingMultiDomain()
    }

    state('anticipatingMultiDomain', href)
  },

  whenStableOrAnticipatingMultiDomain (fn, command) {
    const commandIsSwitchToDomain = command?.get('name') === 'switchToDomain' || false

    // switchToDomain is a special command that can continue even when unstable.
    if ((!!state('anticipatingMultiDomain') && commandIsSwitchToDomain) || state('isStable') !== false) {
      return Promise.try(fn)
    }

    return new Promise((resolve, reject) => {
      let fulfilled = false

      const onSignal = () => {
        if (fulfilled) return

        fulfilled = true

        state('whenStable', null)
        state('whenAnticipatingMultiDomain', null)

        Promise.try(fn)
        .then(resolve)
        .catch(reject)
      }

      state('whenStable', onSignal)

      // We only care to listen for anticipating multi-domain when the command we're waiting for is switchToDomain
      if (commandIsSwitchToDomain) {
        state('whenAnticipatingMultiDomain', onSignal)
      }
    })
  },
})

export interface IStability extends ReturnType<typeof create> {}
