describe('blob-util 2.x', () => {
  it('arrayBufferToBlob', () => {
    cy.on('fail', (err) => {
      expect(err.message).to.include('no longer returns a `Promise`')
    })

    Cypress.Blob.arrayBufferToBlob('1234').then((blob) => {
      // it should fail.
    })
  })

  it('base64StringToBlob', () => {
    cy.on('fail', (err) => {
      expect(err.message).to.include('no longer returns a `Promise`')
    })

    Cypress.Blob.base64StringToBlob('1234').then((blob) => {
      // it should fail.
    })
  })

  it('binaryStringToBlob', () => {
    cy.on('fail', (err) => {
      expect(err.message).to.include('no longer returns a `Promise`')
    })

    Cypress.Blob.binaryStringToBlob('0100101').then((blob) => {
      // it should fail.
    })
  })

  it('dataURLToBlob', () => {
    cy.on('fail', (err) => {
      expect(err.message).to.include('no longer returns a `Promise`')
    })

    Cypress.Blob.dataURLToBlob('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==').then((blob) => {
      // it should fail.
    })
  })
})
