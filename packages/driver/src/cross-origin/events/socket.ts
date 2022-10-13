export const handleSocketEvents = (Cypress) => {
  const onBackendRequest = async (...args) => {
    // The last argument is the callback, pop that off before messaging primary and call it with the response.
    const callback = args.pop()
    const response = await Cypress.specBridgeCommunicator.toPrimaryPromise({
      event: 'backend:request',
      data: { args },
      timeout: Cypress.config().defaultCommandTimeout,
    })

    callback(response)
  }

  const onAutomationRequest = async (...args) => {
    // The last argument is the callback, pop that off before messaging primary and call it with the response.
    const callback = args.pop()
    const response = await Cypress.specBridgeCommunicator.toPrimaryPromise({
      event: 'automation:request',
      data: { args },
      timeout: Cypress.config().defaultCommandTimeout,
    })

    callback(response)
  }

  Cypress.on('backend:request', onBackendRequest)
  Cypress.on('automation:request', onAutomationRequest)
}
