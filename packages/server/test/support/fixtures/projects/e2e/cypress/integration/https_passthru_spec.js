describe('https passthru retries', function () {
  it('retries when visiting a non-test domain', function () {
    return new Cypress.Promise((resolve, reject) => {
      const img = new Image()

      img.src = 'https://localhost:13372/the-image.jpg'
      img.onload = resolve
      img.onerror = reject
    })
  })
})
