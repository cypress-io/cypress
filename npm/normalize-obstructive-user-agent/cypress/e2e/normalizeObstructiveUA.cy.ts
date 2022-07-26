import { setUserAgentOverride, replaceCypressInUserAgent, replaceElectronInUserAgent, normalizeObstructiveUserAgent } from '../../src/main'

describe('replaceCypressInUserAgent', function () {
  const sampleUserAgentsContainingCypress = [
    `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/10.0.3 Chrome/100.0.4896.75 Electron/18.0.4 Safari/537.36`,
    `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/0.0.0-development Chrome/100.0.4896.75 Electron/18.0.4 Safari/537.36`,
  ]

  sampleUserAgentsContainingCypress.forEach((UA) => {
    it(`replaces Cypress in the user agent for user agent: ${UA}`, () => {
      const results = replaceCypressInUserAgent(UA)

      expect(results).to.equal('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Electron/18.0.4 Safari/537.36')
    })
  })
})

describe('replaceElectronInUserAgent', function () {
  const sampleUserAgentsContainingElectron = [
    `Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) electron/1.0.0 Chrome/53.0.2785.113 Electron/1.4.3 Safari/537.36`,
    `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Teams/1.5.00.4689 Chrome/85.0.4183.121 Electron/10.4.7 Safari/537.36`,
    `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Typora/0.9.93 Chrome/83.0.4103.119 Electron/9.0.5 Safari/E7FBAF`,
    `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/8.3.0 Chrome/91.0.4472.124 Electron/13.1.7 Safari/537.36`,
    `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Teams/1.5.00.4683 Chrome/85.0.4183.121 Electron/10.4.7 Safari/537.36`,
    `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Electron/18.0.4 Safari/537.36`,
  ]

  it(`replaces Electron in the user agent for user agent: ${sampleUserAgentsContainingElectron[0]}`, () => {
    const results = replaceElectronInUserAgent(sampleUserAgentsContainingElectron[0])

    expect(results).to.equal(`Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.113 Safari/537.36`)
  })

  it(`replaces Electron in the user agent for user agent: ${sampleUserAgentsContainingElectron[1]}`, () => {
    const results = replaceElectronInUserAgent(sampleUserAgentsContainingElectron[1])

    expect(results).to.equal(`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Teams/1.5.00.4689 Chrome/85.0.4183.121 Safari/537.36`)
  })

  it(`replaces Electron in the user agent for user agent: ${sampleUserAgentsContainingElectron[2]}`, () => {
    const results = replaceElectronInUserAgent(sampleUserAgentsContainingElectron[2])

    expect(results).to.equal(`Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Typora/0.9.93 Chrome/83.0.4103.119 Safari/E7FBAF`)
  })

  it(`replaces Electron in the user agent for user agent: ${sampleUserAgentsContainingElectron[3]}`, () => {
    const results = replaceElectronInUserAgent(sampleUserAgentsContainingElectron[3])

    expect(results).to.equal(`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/8.3.0 Chrome/91.0.4472.124 Safari/537.36`)
  })

  it(`replaces Electron in the user agent for user agent: ${sampleUserAgentsContainingElectron[4]}`, () => {
    const results = replaceElectronInUserAgent(sampleUserAgentsContainingElectron[4])

    expect(results).to.equal(`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Teams/1.5.00.4683 Chrome/85.0.4183.121 Safari/537.36`)
  })

  it(`replaces Electron in the user agent for user agent: ${sampleUserAgentsContainingElectron[5]}`, () => {
    const results = replaceElectronInUserAgent(sampleUserAgentsContainingElectron[5])

    expect(results).to.equal(`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36`)
  })
})

describe('setUserAgentOverride', () => {
  it('calls Cypress.automation correctly to forward user agent command to CDP', async () => {
    cy.stub(Cypress, 'automation').resolves()
    await setUserAgentOverride('foobar')
    expect(Cypress.automation).to.be.calledWith('remote:debugger:protocol',
      {
        command: 'Network.setUserAgentOverride',
        params: {
          userAgent: 'foobar',
        },
      })
  })

  it('gracefully wraps errors if Cypress.automation fails for any reason', async () => {
    cy.stub(Cypress, 'automation').rejects(new Error('Cypress.automation was not stubbed'))
    try {
      await setUserAgentOverride('foobar')
    } catch (e: any) {
      expect(e.message).to.equal('Error occurred setting user agent')
    }
  })
})

describe('normalizeObstructiveUserAgent', () => {
  it('does nothing when the browser is not electron', {
    browser: ['firefox', 'chrome', 'edge'],
  }, async () => {
    const currentUserAgent = window.navigator.userAgent

    await normalizeObstructiveUserAgent()

    expect(window.navigator.userAgent).to.equal(currentUserAgent)
  })

  it('correctly sets the user agent when the browser is electron', {
    browser: 'electron',
  }, async () => {
    await normalizeObstructiveUserAgent()

    expect(window.navigator.userAgent).to.match(/Mozilla\/5\.0 \(Macintosh; Intel Mac OS X 10_15_7\) AppleWebKit\/537\.36 \(KHTML, like Gecko\) Chrome.*? Safari\/537\.36/)
  })
})
