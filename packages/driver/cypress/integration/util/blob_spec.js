describe('blob-util 2.x', () => {
  const { Blob, Promise } = Cypress

  // https://github.com/cypress-io/cypress/issues/8365
  ;[
    ['arrayBufferToBlob', '1234'],
    ['base64StringToBlob', '1234'],
    ['binaryStringToBlob', '0100101'],
    ['dataURLToBlob', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=='],
  ].forEach(([method, value]) => {
    it(`Cypress.Blob.${method} does not error when wrapped by Promise methods`, () => {
      return Promise.all([
        Promise.resolve(Blob[method](value)),
        Promise.try(() => Blob[method](value)),
      ])
    })
  })
})
