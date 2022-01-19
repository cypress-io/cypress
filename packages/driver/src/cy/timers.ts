// eslint-disable-next-line @cypress/dev/arrow-body-multiline-braces
export const create = (Cypress) => ({
  reset () {
    return Cypress.action('app:timers:reset')
  },

  pauseTimers (shouldPause) {
    return Cypress.action('app:timers:pause', shouldPause)
  },
})

export interface ITimer {
  pauseTimers: ReturnType<typeof create>['pauseTimers']
}
