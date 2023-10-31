describe('experimentalCspAllowList is custom or true', () => {
  let cspLogMessages = []
  let visitUrl: URL
  let postMessageHandler = ({ data }) => {
    if (data.event === 'csp-script-ran') {
      cspLogMessages.push(data.data)
    }
  }

  beforeEach(() => {
    cspLogMessages = []
    visitUrl = new URL('http://localhost:4466/csp_script_test.html')

    // To test scripts for execution under CSP, we send messages of postMessage to verify a script has run to prevent any cross origin iframe issues
    window.top.addEventListener('message', postMessageHandler, false)
  })

  afterEach(() => {
    window.top.removeEventListener('message', postMessageHandler, false)
  })

  describe('disallowed', () => {
    it('frame-ancestors are always stripped', () => {
      visitUrl.searchParams.append('csp', `frame-ancestors 'none'`)
      cy.visit(visitUrl.toString())

      // expect the iframe to load, which implies the csp directive was stripped out
      cy.get('h1').contains('CSP Script Test').should('be.visible')
    })

    it('trusted-types & require-trusted-types-for are always stripped', () => {
      visitUrl.searchParams.append('csp', `require-trusted-types-for 'script'; trusted-types foo bar 'allow-duplicates'`)
      cy.visit(visitUrl.toString())

      // expect to be able to manipulate the DOM as trusted-types policies are stripped out allowing for injection sink like methods
      cy.get('h1').its(0).then(($el) => {
        $el.innerHTML = 'CSP Script Test Modified'
      })

      cy.get('h1').contains('CSP Script Test Modified').should('be.visible')
    })

    it('sandbox is always stripped', () => {
      // Since sandbox is inclusive, all other sandbox actions would be restricted except for `allow-downloads`
      visitUrl.searchParams.append('csp', `sandbox 'allow-downloads'`)
      cy.visit(visitUrl.toString())

      // expect the form to post and navigate to a new page, meaning the sandbox directive was stripped
      cy.get('#submit').click()
      cy.contains('Cannot POST /').should('exist')
    })

    it('navigate-to is always stripped', () => {
      visitUrl.searchParams.append('csp', `navigate-to 'none'`)
      cy.visit(visitUrl.toString())

      // expect the form to post and navigate to a new page, meaning the navigate-to directive was stripped
      cy.get('#submit').click()
      cy.contains('Cannot POST /').should('exist')
    })
  })

  describe('allowed', () => {
    it('sample: style-src is not stripped', () => {
      visitUrl.searchParams.append('csp', `style-src http://www.foobar.com:4466`)
      cy.visit(visitUrl.toString())

      // make sure the stylesheet is loaded with the color purple
      cy.get('h1').contains('CSP Script Test').should('have.css', 'color', 'rgb(128, 0, 128)')
    })

    it('sample: upgrade-insecure-requests is not stripped', () => {
      // fake the https automatic upgrade by fulfilling the http request to the express server. verify the requests are actually upgraded
      const requestsFulfilled = {
        www_foobar_com_script: false,
        app_foobar_com_script: false,
        www_foobar_com_style: false,
      }

      cy.intercept('https://www.foobar.com:4466/csp_empty_script.js', (req) => {
        requestsFulfilled.www_foobar_com_script = true
        req.reply('')
      })

      cy.intercept('https://app.foobar.com:4466/csp_empty_script.js', (req) => {
        requestsFulfilled.app_foobar_com_script = true
        req.reply('')
      })

      cy.intercept('https://www.foobar.com:4466/csp_empty_style.css', (req) => {
        requestsFulfilled.www_foobar_com_style = true
        req.reply('')
      })

      visitUrl.searchParams.append('csp', `upgrade-insecure-requests`)
      cy.visit(visitUrl.toString())

      cy.get('h1').contains('CSP Script Test').should('be.visible')

      cy.then(() => {
        Object.keys(requestsFulfilled).forEach((key) => {
          expect(requestsFulfilled[key]).to.be.true
        })
      })
    })
  })
})
