import ipc from 'node-ipc'

let graphqlEndpoint: string

export function requestGraphQLEndpoint () {
  return new Promise((resolve, reject) => {
    // if we already connected once no need to reconnect, just return cached url
    if (graphqlEndpoint) {
      resolve(graphqlEndpoint)
    }

    // The IPC is basically instantaneous
    // If we don't hear back within 500ms, we can assume Cypress is **not** open.
    // In a future update, we could spawn Cypress via the module API.
    // Until that's implemented, we will just show the user an error informing them
    // Cypress is not opened.
    const timeoutId = global.setTimeout(reject, 5000)
    const request = 'graphql:endpoint'

    ipc.config.retry = 1500

    // Continously attempt to connect to Cypress instance
    ipc.connectToNet('cypress', () => {
      ipc.of['cypress'].on('connect', (...args) => {
        // Once we connect, ask Cypress for the GraphQL endpoint
        ipc.of['cypress'].emit(request)
      })

      ipc.of['cypress'].on(request, (endpoint: string) => {
        ipc.log('Got GraphQL endpoint: ', endpoint)
        graphqlEndpoint = endpoint
        global.clearTimeout(timeoutId)
        resolve(graphqlEndpoint)
      })
    })

    // ipc.('cypress', (...args) => {
    //   console.log('DISCONNECt', ...args)
    // })
  })
}
