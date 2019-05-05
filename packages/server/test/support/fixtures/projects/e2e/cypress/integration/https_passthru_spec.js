describe('https passthru retries', function () {
  it('retries when visiting a non-test domain', function () {

    return Cypress.Promise.delay(5000)
    .then(() => {
      return new Cypress.Promise((resolve, reject) => {
        const img = new Image()

        img.src = 'https://localhost:13372/javascript-logo.png'
        img.onload = resolve
        img.onerror = (err) => {
          // TODO: reject a real error instance
          // not an event object
          reject(err)
        }
      })
    })
  })
})
