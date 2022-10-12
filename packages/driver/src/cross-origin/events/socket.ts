export const handleSocketEvents = (Cypress, topOrigin) => {
  const onBackendRequest = async (...args) => {
    // The last argument is the callback, pop that off before messaging primary and call it with the response.
    const callback = args.pop()
    const response = await Cypress.specBridgeCommunicator.toPrimaryPromise('backend:request', { args })

    callback(response)
  }

  const onAutomationRequest = async (...args) => {
    // The last argument is the callback, pop that off before messaging primary and call it with the response.
    const callback = args.pop()
    const response = await Cypress.specBridgeCommunicator.toPrimaryPromise('automation:request', { args })

    callback(response)
  }

  Cypress.on('backend:request', onBackendRequest)
  Cypress.on('automation:request', onAutomationRequest)
}
