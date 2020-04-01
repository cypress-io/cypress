describe('Clicks Integration Tests', () => {
  context('fixed-nav', () => {
    // eslint-disable-next-line no-undef
    enterCommandTestingMode('fixed-nav')

    describe('fixed nav', () => {
      it('can click inputs under a fixed-position nav', () => {
        return this.cy.get('button').click()
      })
    })
  })

  context('dropdown', () => {
    // eslint-disable-next-line no-undef
    enterCommandTestingMode('dropdown', { replaceIframeContents: false })

    // this tests a kendo drop down opening
    // as it opens the element from position returns the background element
    // which is fixed position
    // the fixed position element cannot be scrolled and thus an endless loop
    // is created
    describe('animating dropdown with fixed background', () => {
      it(
        'can click an animating element when the element behind it is fixed position and cannot be scrolled',
        () => {
          this.cy.window().then((win) => {
            const k = win.$('#dropdown').getKendoDropDownList()

            return k.open()
          })

          return this.cy
          .contains('.k-item', 'Strawberries').click()
          .window().then((win) => {
            const k = win.$('#dropdown').getKendoDropDownList()

            expect(k.text()).to.eq('Strawberries')
          })
        },
      )
    })
  })
})
