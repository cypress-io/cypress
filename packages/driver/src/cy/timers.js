const create = (Cypress) => {
  const reset = () => {
    return Cypress.action('app:timers:reset')
  }

  const pauseTimers = (shouldPause) => {
    return Cypress.action('app:timers:pause', shouldPause)
  }

  return {
    reset,

    pauseTimers,
  }
}

module.exports = {
  create,
}
