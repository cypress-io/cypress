const _ = Cypress._

// https://github.com/cypress-io/cypress/issues/3253
describe('issue #3253: scrollbar appearing full height including scrolling AUT', () => {
  it('does not scroll html', () => {
    const html = window.top.document.documentElement

    const beforeScrollY = window.top.scrollY
    const beforeClientRect = html.getBoundingClientRect()
    const beforeRect = _.pick(beforeClientRect, _.keysIn(beforeClientRect))

    cy.viewport(300, 300)
    // this bug only happens when the command log
    // extends below the height of the html and aut
    _.times(100, (i) => {
      cy.wrap(i)
    })

    cy.wrap(null).then(() => {
      // try to scroll the page down a lot
      window.scroll(0, 10000)

      const afterScrollY = window.top.scrollY
      const afterClientRect = html.getBoundingClientRect()
      const afterRect = _.pick(afterClientRect, _.keysIn(afterClientRect))

      // the html should not be scrollable
      // we only want the Command Log to scroll
      // so no scrolling should have happened
      expect(beforeScrollY).to.deep.eq(afterScrollY)

      // the width of the html should not have changed
      // meaning, the width of the scrollbar was not subtracted
      expect(beforeRect).to.deep.eq(afterRect)
    })
  })
})
