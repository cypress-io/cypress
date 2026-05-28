describe('e2e headless spec', function () {
  it('has the expected values for Cypress.browser', function () {
    cy.env(['EXPECT_HEADLESS']).then(({ EXPECT_HEADLESS }) => {
      const expectedHeadless = !!EXPECT_HEADLESS

      expect(Cypress.browser.isHeadless).to.eq(expectedHeadless)
      expect(Cypress.browser.isHeaded).to.eq(!expectedHeadless)
    })
  })

  it('has expected launch args', function () {
    cy.env(['EXPECT_HEADLESS']).then(({ EXPECT_HEADLESS }) => {
      const expectedHeadless = !!EXPECT_HEADLESS

      if (Cypress.browser.family !== 'chromium' || Cypress.browser.name === 'electron') {
        return
      }

      cy.task('get:browser:args')
      .should(expectedHeadless ? 'contain' : 'not.contain', '--headless=new')
    })
  })
})
