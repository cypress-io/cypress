const expectedHeadless = !!Cypress.env('EXPECT_HEADLESS')

describe('e2e headless spec', function () {
  it('has the expected values for Cypress.browser', function () {
    expect(Cypress.browser.isHeadless).to.eq(expectedHeadless)
    expect(Cypress.browser.isHeaded).to.eq(!expectedHeadless)
  })

  it('has expected launch args', function () {
    if (Cypress.browser.family !== 'chromium' || Cypress.browser.name === 'electron') {
      return
    }

    cy.task('get:browser:args')
    .should(expectedHeadless ? 'contain' : 'not.contain', '--headless=new')
  })
})
