describe('Type Integration Tests', () => {
  context('type', () => {
    // eslint-disable-next-line no-undef
    enterCommandTestingMode('type')

    describe('card.js', () => {
      it('it correctly changes the caret position and value of card expiration', () => {
        return this.cy
        .window().then((win) => {
          return win.$('form').card({
            container: '#card-container',
          })
        }).get('[name=\'expiry\']')
        .type('0314')
        .should('have.value', '03 / 14')
      })
    })
  })
})
