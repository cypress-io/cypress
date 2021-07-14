describe('https passthru retries', () => {
  it('retries when visiting a non-test domain', () => {
    // cy.timeout(1e9)

    return new Cypress.Promise((resolve, reject) => {
      const img = new Image()

      img.src = 'https://localhost:13372/javascript-logo.png'
      img.onload = resolve
      img.onerror = () => {
        reject(new Error('onerror event fired, but should not have. expected onload to fire.'))
      }
    })
  })

  it('passes through the network error when it cannot connect to the proxy', () => {
    // cy.timeout(1e9)

    return new Cypress.Promise((resolve, reject) => {
      const img = new Image()

      img.src = 'https://localhost:13373/expected-network-error'
      img.onload = () => {
        reject(new Error('onload event fired, but should not have. expected onerror to fire.'))
      }

      img.onerror = resolve
    })
  })
})
