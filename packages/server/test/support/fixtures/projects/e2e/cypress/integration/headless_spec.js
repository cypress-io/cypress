const { _ } = Cypress
const expectedHeadless = !!Cypress.env('EXPECT_HEADLESS')

describe('e2e headless spec', function () {
  it('has the expected values for Cypress.browser', function () {
    expect(Cypress.browser.isHeadless).to.eq(expectedHeadless)
    expect(Cypress.browser.isHeaded).to.eq(!expectedHeadless)
  })

  it('has expected launch args', function () {
    if (Cypress.browser.family !== 'chrome') {
      return
    }

    cy.exec(`ps aux`)
    .its('stdout')
    .should('contain', 'chrome')
    .and(expectedHeadless ? 'match' : 'not.match', /chrome[^\n]+--headless/)
  })

  it('has expected window bounds in CI', function () {
    cy.screenshot('window-size', {
      capture: 'runner',
    })
    .task('get:screenshots:taken')
    .then((screenshotsTaken) => {
      const ss = _.find(screenshotsTaken, { name: 'window-size' })

      expect(ss.dimensions).to.deep.eq({
        width: 1280,
        height: 720,
      })
    })
  })
})
