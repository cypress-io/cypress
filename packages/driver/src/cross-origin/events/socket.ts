export const handleSocketEvents = (Cypress) => {
  const onRequest = async (event, args) => {
    // The last argument is the callback, pop that off before messaging primary and call it with the response.
    const callback = args.pop()
    const response = await Cypress.specBridgeCommunicator.toPrimaryPromise({
      event,
      data: { args },
      timeout: Cypress.config().defaultCommandTimeout,
    })

    if (response && response.error) {
      return callback({ error: response.error })
    }

    callback({ response })
  }

  Cypress.on('backend:request', (...args) => onRequest('backend:request', args))
  Cypress.on('automation:request', (...args) => onRequest('automation:request', args))
}
