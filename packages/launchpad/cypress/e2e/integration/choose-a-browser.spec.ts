import type { FoundBrowser } from '@packages/types/src'

describe('Choose a Browser config', () => {
  // Temporary?
  const stepThroughConfigPages = () => {
    cy.get('h1').should('contain', 'Configuration Files')
    cy.contains('Continue').click()
    cy.get('h1').should('contain', 'Initializing Config...')
    cy.contains('Next Step').click()
  }

  it('should highlight browser radio item when clicked', () => {
    cy.setupE2E('launchpad')
    cy.visitLaunchpad()

    cy.withCtx(async (ctx) => {
      ctx.launchArgs.testingType = 'e2e'
      await ctx.initializeData()
    })

    // Need to visit after args have been configured, todo: fix in #18776
    cy.visitLaunchpad()

    stepThroughConfigPages()

    cy.get('h1').should('contain', 'Choose a Browser')

    // TODO Recommend this be a list with radio group roles (role=radiogroup, role=radio + aria-checked for children, labels)
    cy.get('[data-testid="browser-radio-group"] [data-selected-browser]').eq(0).as('chromeRadioOption')
    cy.get('[data-testid="browser-radio-group"] [data-selected-browser]').eq(1).as('firefoxRadioOption')

    cy.get('@chromeRadioOption')
    .should('have.attr', 'data-selected-browser', 'true')
    .and('contain', 'Chrome')
    .and('have.class', 'border-jade-300') // this is flaky, would prefer coverage elsewhere (percy visual diff?)

    cy.get('@firefoxRadioOption')
    .should('have.attr', 'data-selected-browser', 'false')
    .and('contain', 'Firefox')
    .and('not.have.class', 'border-jade-300')
    .click()

    cy.get('@firefoxRadioOption')
    .should('have.attr', 'data-selected-browser', 'true')
    .and('contain', 'Firefox')
    .and('have.class', 'border-jade-300')

    cy.get('@chromeRadioOption')
    .should('contain', 'Chrome')
    .and('have.attr', 'data-selected-browser', 'false')
    .and('not.have.class', 'border-jade-300')
  })

  it('should preselect valid --browser option', () => {
    cy.setupE2E('launchpad')
    cy.visitLaunchpad()

    cy.withCtx(async (ctx) => {
      ctx.launchArgs.testingType = 'e2e'
      ctx.launchArgs.browser = 'firefox'
      await ctx.initializeData()
    })

    // Need to visit after args have been configured, todo: fix in #18776
    cy.visitLaunchpad()

    stepThroughConfigPages()

    cy.get('h1').should('contain', 'Choose a Browser')

    cy.get('[data-testid="browser-radio-group"] [data-selected-browser="true"]')
    .should('contain', 'Firefox')
    .and('have.class', 'border-jade-300')
  })

  it('shows alert when launched with --browser option that cannot be found', () => {
    cy.setupE2E('launchpad')
    cy.visitLaunchpad()

    cy.withCtx(async (ctx) => {
      ctx.launchArgs.testingType = 'e2e'
      ctx.launchArgs.browser = 'doesNotExist'
      await ctx.initializeData()
    })

    // Need to visit after args have been configured, todo: fix in #18776
    // Flaky without this
    cy.visitLaunchpad()

    stepThroughConfigPages()

    cy.get('h1').should('contain', 'Choose a Browser')
    cy.get('[data-testid="alert-header"]').should('contain', 'Warning: Browser Not Found')
    cy.get('[data-testid="alert-body"]')
    .should('contain', 'The specified browser was not found on your system or is not supported by Cypress: doesNotExist')

    cy.get('[data-testid="alert-body"] a').eq(1)
    .should('have.attr', 'href')
    .and('equal', 'https://on.cypress.io/troubleshooting-launching-browsers')

    // TODO Alert looks to be dismissable, but the X button isn't hooked up yet
    // cy.get('[data-testid="alert-suffix-icon"]').click()
    // cy.get('[data-testid="alert-header"]').should('not.exist')
  })

  it('shows alert when launched with --browser path option that cannot be found', () => {
    cy.setupE2E('launchpad')
    cy.visitLaunchpad()

    cy.withCtx(async (ctx) => {
      ctx.launchArgs.testingType = 'e2e'
      ctx.launchArgs.browser = '/this/does/doesNotExist'
      await ctx.initializeData()
    })

    // Need to visit after args have been configured, todo: fix in #18776
    cy.visitLaunchpad()

    stepThroughConfigPages()

    cy.get('h1').should('contain', 'Choose a Browser')
    cy.get('[data-testid="alert-header"]').should('contain', 'Warning: Browser Not Found')
    cy.get('[data-testid="alert-body"]')
    .should('contain', 'We could not identify a known browser at the path you specified: /this/does/doesNotExist')
    .should('contain', 'spawn /this/does/doesNotExist ENOENT')

    cy.get('[data-testid="alert-body"] a')
    .should('have.attr', 'href')
    .and('equal', 'https://on.cypress.io/troubleshooting-launching-browsers')

    // TODO Alert looks to be dismissable, but the X button isn't hooked up yet
    // cy.get('[data-testid="alert-suffix-icon"]').click()
    // cy.get('[data-testid="alert-header"]').should('not.exist')
  })

  it('should show all valid installed browsers with their relevant properties', () => {
    cy.setupE2E('launchpad')
    cy.visitLaunchpad()

    // cy.intercept('query-OpenBrowser').as('OpenBrowser')

    cy.withCtx(async (ctx) => {
      ctx.launchArgs.testingType = 'e2e'
      await ctx.initializeData()
    })

    // Need to visit after args have been configured, todo: fix in #18776
    cy.visitLaunchpad()

    stepThroughConfigPages()

    cy.get('h1').should('contain', 'Choose a Browser')

    cy.withCtx((ctx) => {
      // TODO: yikes, fixture for this?
      ctx.coreData.currentProject.browsers = [{
        'id': '1',
        'channel': 'stable',
        'disabled': false,
        'isSelected': true,
        'displayName': 'Chrome',
        'family': 'chromium',
        'majorVersion': '1',
        'name': 'chrome',
        'path': '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        'version': '1.2.333.445',
      } as FoundBrowser, {
        'id': '2',
        'channel': 'stable',
        'disabled': false,
        'isSelected': false,
        'displayName': 'Firefox',
        'family': 'firefox',
        'majorVersion': '2',
        'name': 'firefox',
        'path': '/Applications/Firefox.app/Contents/MacOS/firefox-bin',
        'version': '2.3.444',
      } as FoundBrowser, {
        'id': '3',
        'channel': 'stable',
        'disabled': false,
        'isSelected': false,
        'displayName': 'Electron',
        'family': 'chromium',
        'majorVersion': '3',
        'name': 'electron',
        'path': '',
        'version': '3.4.555.66',
      } as FoundBrowser, {
        'id': '4',
        'channel': 'stable',
        'disabled': false,
        'isSelected': false,
        'displayName': 'Edge',
        'family': 'chromium',
        'majorVersion': '4',
        'name': 'edge',
        'path': '',
        'version': '4.5.666.77',
      } as FoundBrowser, {
        'id': '5',
        'channel': 'stable',
        'disabled': false,
        'isSelected': false,
        'displayName': 'Chromium',
        'family': 'chromium',
        'majorVersion': '5',
        'name': 'chromium',
        'path': '',
        'version': '5.6.777.88',
      } as FoundBrowser, {
        'id': '6',
        'channel': 'canary',
        'disabled': false,
        'isSelected': false,
        'displayName': 'Canary',
        'family': 'chromium',
        'majorVersion': '6',
        'name': 'chrome',
        'path': '',
        'version': '6.7.888.99',
      } as FoundBrowser, {
        'id': '7',
        'channel': 'beta',
        'disabled': false,
        'isSelected': false,
        'displayName': 'Chrome Beta',
        'family': 'chromium',
        'majorVersion': '7',
        'name': 'canary',
        'path': '',
        'version': '7.8.999.10',
      } as FoundBrowser, {
        'id': '8',
        'channel': 'nightly',
        'disabled': false,
        'isSelected': false,
        'displayName': 'Firefox Nightly',
        'family': 'firefox',
        'majorVersion': '8',
        'name': 'firefox',
        'path': '',
        'version': '8.999.10',
      } as FoundBrowser, {
        'id': '9',
        'channel': 'dev',
        'disabled': false,
        'isSelected': false,
        'displayName': 'Firefox Developer Edition',
        'family': 'firefox',
        'majorVersion': '9',
        'name': 'firefox',
        'path': '',
        'version': '9.10',
      } as FoundBrowser, {
        'id': '10',
        'channel': 'canary',
        'disabled': false,
        'isSelected': false,
        'displayName': 'Edge Canary',
        'family': 'chromium',
        'majorVersion': '10',
        'name': 'edge',
        'path': '',
        'version': '10.1.222',
      } as FoundBrowser, {
        'id': '11',
        'channel': 'beta',
        'disabled': false,
        'isSelected': false,
        'displayName': 'Edge Beta',
        'family': 'chromium',
        'majorVersion': '11',
        'name': 'edge',
        'path': '',
        'version': '11.2.333',
      } as FoundBrowser, {
        'id': '12',
        'channel': 'dev',
        'disabled': false,
        'isSelected': false,
        'displayName': 'Edge Dev',
        'family': 'chromium',
        'majorVersion': '12',
        'name': 'edge',
        'path': '',
        'version': '12.3.444',
      } as FoundBrowser]

      ctx.emitter.toLaunchpad()
    })

    cy.get('[data-testid="browser-radio-group"] [data-selected-browser]').eq(0)
    .should('contain', 'Chrome')
    .and('contain', 'v1.x')
    .find('img')
    .should('have.attr', 'alt', 'Chrome')

    cy.get('[data-testid="browser-radio-group"] [data-selected-browser]').eq(1)
    .should('contain', 'Firefox')
    .and('contain', 'v2.x')
    .find('img')
    .should('have.attr', 'alt', 'Firefox')

    cy.get('[data-testid="browser-radio-group"] [data-selected-browser]').eq(2)
    .should('contain', 'Electron')
    .and('contain', 'v3.x')
    .find('img')
    .should('have.attr', 'alt', 'Electron')

    cy.get('[data-testid="browser-radio-group"] [data-selected-browser]').eq(3)
    .should('contain', 'Edge')
    .and('contain', 'v4.x')
    .find('img')
    .should('have.attr', 'alt', 'Edge')

    cy.get('[data-testid="browser-radio-group"] [data-selected-browser]').eq(4)
    .should('contain', 'Chromium')
    .and('contain', 'v5.x')
    .find('img')
    .should('have.attr', 'alt', 'Chromium')

    cy.get('[data-testid="browser-radio-group"] [data-selected-browser]').eq(5)
    .should('contain', 'Canary')
    .and('contain', 'v6.x')
    .find('img')
    .should('have.attr', 'alt', 'Canary')

    cy.get('[data-testid="browser-radio-group"] [data-selected-browser]').eq(6)
    .should('contain', 'Chrome Beta')
    .and('contain', 'v7.x')
    .find('img')
    .should('have.attr', 'alt', 'Chrome Beta')

    cy.get('[data-testid="browser-radio-group"] [data-selected-browser]').eq(7)
    .should('contain', 'Firefox Nightly')
    .and('contain', 'v8.x')
    .find('img')
    .should('have.attr', 'alt', 'Firefox Nightly')

    cy.get('[data-testid="browser-radio-group"] [data-selected-browser]').eq(8)
    .should('contain', 'Firefox Developer Edition')
    .and('contain', 'v9.x')
    .find('img')
    .should('have.attr', 'alt', 'Firefox Developer Edition')

    cy.get('[data-testid="browser-radio-group"] [data-selected-browser]').eq(9)
    .should('contain', 'Edge Canary')
    .and('contain', 'v10.x')
    .find('img')
    .should('have.attr', 'alt', 'Edge Canary')

    cy.get('[data-testid="browser-radio-group"] [data-selected-browser]').eq(10)
    .should('contain', 'Edge Beta')
    .and('contain', 'v11.x')
    .find('img')
    .should('have.attr', 'alt', 'Edge Beta')

    cy.get('[data-testid="browser-radio-group"] [data-selected-browser]').eq(11)
    .should('contain', 'Edge Dev')
    .and('contain', 'v12.x')
    .find('img')
    .should('have.attr', 'alt', 'Edge Dev')
  })

  it('should launch selected browser when launch button is clicked', () => {
    cy.setupE2E('launchpad')
    cy.visitLaunchpad()

    cy.withCtx(async (ctx) => {
      ctx.launchArgs.testingType = 'e2e'
      await ctx.initializeData()
    })

    // Need to visit after args have been configured, todo: fix in #18776
    cy.visitLaunchpad()

    stepThroughConfigPages()

    cy.get('h1').should('contain', 'Choose a Browser')

    // TODO "external link" icon in button needs label
    cy.get('[data-testid="launch-button"]').as('launchButton').should('contain', 'Launch Chrome')

    cy.intercept('mutation-OpenBrowser_LaunchProject').as('launchProject')

    cy.get('@launchButton').click()

    cy.wait('@launchProject').then(({ response }) => {
      expect(response?.body.data.launchOpenProject).to.eq(true)
    })
  })
})
