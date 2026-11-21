describe('pointer and hover media queries', () => {
  it('match a desktop mouse', () => {
    cy.window().then((win) => {
      expect(win.matchMedia('(pointer: fine)').matches, '(pointer: fine)').to.be.true
      expect(win.matchMedia('(hover: hover)').matches, '(hover: hover)').to.be.true
      expect(win.matchMedia('(any-pointer: fine)').matches, '(any-pointer: fine)').to.be.true
      expect(win.matchMedia('(any-hover: hover)').matches, '(any-hover: hover)').to.be.true
    })
  })
})
