describe('navigation cross origin errors', () => {
  it('displays cross origin failures when "experimentalMultiDomain" is turned off', function () {
    // @ts-ignore
    cy.visit('/jquery.html').window().then((win) => {
      const constructedCrossOriginAnchor = win.$(`<a href='http://www.foobar.com:4466/cross_origin.html'>cross origin</a>`).appendTo(win.document.body)

      constructedCrossOriginAnchor.get(0).click()
    })
  })
})
