/* eslint-disable no-undef */
describe('Cypress static methods + props', () => {
  it('.version', () => {
    expect(Cypress.version).to.be.a('string')
  })

  it('.platform', () => {
    expect(Cypress.platform).to.be.a('string')
    expect(Cypress.platform).to.be.oneOf(['darwin', 'linux', 'win32'])
  })

  it('.arch', () => {
    expect(Cypress.arch).to.be.a('string')
  })

  it('.browser', () => {
    const { browser } = Cypress

    expect(browser).to.be.an('object')
    expect(browser.name).to.be.oneOf(['electron', 'chrome', 'chromium'])
    expect(browser.displayName).to.be.oneOf(['Electron', 'Chrome', 'Canary', 'Chromium'])
    expect(browser.version).to.be.a('string')
    // we are parsing major version, so it should be a number
    expect(browser.majorVersion).to.be.a('number')
    expect(browser.path).to.be.a('string')

    if (browser.isHeadless === true) {
      expect(browser.isHeaded).to.be.false
    } else if (browser.isHeadless === false) {
      expect(browser.isHeaded).to.be.true
    } else {
      expect(browser.isHeadless, 'browser.isHeadless').not.to.be.undefined
    }
  })

  it('.spec', () => {
    const { spec } = Cypress

    expect(spec).to.be.an('object')
    expect(spec.name).to.eq('config_passing.cy.js')
    expect(spec.relative).to.eq('cypress/e2e/config_passing.cy.js')
    expect(spec.absolute.indexOf('cypress/e2e/config_passing.cy.js')).to.be.gt(0)
  })

  context('.env', () => {
    // https://github.com/cypress-io/cypress/issues/4952
    it(`doesn't die on <script> tags`, () => {
      expect(Cypress.env('scriptlet')).to.eq('<script>alert(\'this should not break\')</script>')
    })
  })
})
