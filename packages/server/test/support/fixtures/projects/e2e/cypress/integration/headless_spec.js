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

    cy.task('get:browser:args')
    .should(expectedHeadless ? 'contain' : 'not.contain', '--headless')
  })

  it('has expected window bounds in CI', function () {
    // in CI, Cypress will fill the entire screen, this test is to explicitly
    // assert on the expected dimensions

    cy.screenshot('window-size', {
      capture: 'runner',
    })
    .task('get:screenshots:taken')
    .then((screenshotsTaken) => {
      let expectedHeight = 695

      const noTopBar = expectedHeadless || Cypress.browser.family === 'chrome'

      if (noTopBar) {
        expectedHeight += 25
      }

      const ss = _.find(screenshotsTaken, { name: 'window-size' })

      expect(ss.dimensions).to.deep.eq({
        width: 1280,
        height: expectedHeight,
      })
    })
  })
})
