const onRequest = async (event, args) => {
  // The last argument is the callback, pop that off before messaging primary and call it with the response.
  const callback = args.pop()
  const response = await Cypress.specBridgeCommunicator.toPrimaryPromise<{ error?: string, response?: any }>({
    event,
    data: { args },
    timeout: Cypress.config().defaultCommandTimeout,
  })

  if (response && response.error) {
    return callback({ error: response.error })
  }

  callback({ response })
}

export const handleCrossOriginSocketEvent = (Cypress, eventName: string) => {
  Cypress.on(eventName, (...args) => onRequest(eventName, args))
}

export const handleDefaultCrossOriginSocketEvents = (Cypress) => {
  handleCrossOriginSocketEvent(Cypress, 'backend:request')
  handleCrossOriginSocketEvent(Cypress, 'automation:request')
}
