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
    if (Cypress.browser.family !== 'chrome') {
      // Browser.getWindowForTarget does not exist in Electron
      return
    }

    // in CI, Cypress will fill the entire screen, this test is to explicitly
    // assert on the expected dimensions

    const cdp = _.bind(Cypress.automation, Cypress, 'remote:debugger:protocol')

    return cdp({
      command: 'Browser.getWindowForTarget',
    })
    .then(({ windowId }) => {
      return cdp({
        command: 'Browser.getWindowBounds',
        params: {
          windowId,
        },
      })
    })
    .then(({ bounds }) => {
      expect(bounds).to.include({
        width: expectedHeadless ? 800 : 1050,
        height: expectedHeadless ? 600 : 1004,
      })
    })
  })
})
