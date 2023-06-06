describe(`experimentalCspAllowList=['script-src-elem', 'script-src', 'default-src']`, () => {
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

  ;['script-src-elem', 'script-src', 'default-src'].forEach((CSP_directive) => {
    describe(`content-security-policy directive ${CSP_directive} should not be stripped and`, () => {
      it(`allows Cypress to run, including configured inline nonces/hashes`, () => {
        visitUrl.searchParams.append('csp', `${CSP_directive} http://www.foobar.com:4466 http://localhost:4466 'nonce-random_nonce' 'sha256-YM+jfV8mJ3IaF5lqpgvjnYAWdy0k77pupK3tsdMuZv8'`)

        cy.visit(visitUrl.toString())

        // NOTE: for script-src-elem, eval() is allowed to run and is only forbidden if script-src or default-src (as a fallback to script-src) is set.
        // However, the inline script still needs to have an appropriate hash/nonce in order to execute, hence adding a nonce before adding the script onto the page

        cy.window().then((win) => {
          try {
            win.eval(`
              var script = document.createElement('script');
              script.textContent = "window.top.postMessage({ event: 'csp-script-ran', data: 'eval script ran'}, '*')";
              script.nonce = "random_nonce"
              document.head.appendChild(script);
          `)
          } catch (e) {
            // this fails execution with script-src and default-src as expected. If another condition is met, throw
            if (CSP_directive === 'script-src-elem') {
              throw e
            }
          }
        })

        // make sure the stylesheet is loaded with the color purple
        cy.get('h1').contains('CSP Script Test').should('have.css', 'color', 'rgb(128, 0, 128)')

        // wait a small amount of time for all postMessages to trickle in
        cy.wait(1000).then(() => {
          // localhost:4466 and www.foobar.com:4466 script src's are allowed to run
          expect(cspLogMessages).to.contain('script src origin www.foobar.com:4466 script ran')
          expect(cspLogMessages).to.contain('script src origin localhost:4466 script ran')

          // since we told the server via query params to let 'random_nonce' and 'sha256-YM+jfV8mJ3IaF5lqpgvjnYAWdy0k77pupK3tsdMuZv8=' inline scripts to execute, these scripts should have executed
          expect(cspLogMessages).to.contain('nonce script ran')

          // chromium browsers support some features of CSP 3.0, such as hash-source on src like directives
          // currently, Firefox and Webkit seem to be a bit behind. @see https://www.w3.org/TR/CSP3/
          if (!['firefox', 'webkit'].includes(Cypress.browser.name)) {
            expect(cspLogMessages).to.contain('hash script ran')
          }

          // should have been blocked by CSP as it isn't configured by the server to run
          expect(cspLogMessages).to.not.contain('script src origin app.foobar.com:4466 script ran')

          // if the src type is script-src-eval, the eval should have ran. Otherwise, it should have been blocked
          if (CSP_directive === 'script-src-elem') {
            expect(cspLogMessages).to.contain('eval script ran')
          } else {
            expect(cspLogMessages).to.not.contain('eval script ran')
          }
        })
      })

      it(`allows Cypress to run, but doesn't allow none configured inline scripts`, () => {
        visitUrl.searchParams.append('csp', `${CSP_directive} http://www.foobar.com:4466 http://localhost:4466`)

        cy.visit(visitUrl.toString())

        // make sure the stylesheet is loaded with the color purple
        cy.get('h1').contains('CSP Script Test').should('have.css', 'color', 'rgb(128, 0, 128)')

        // wait a small amount of time for all postMessages to trickle in
        cy.wait(1000).then(() => {
          // localhost:4466 and www.foobar.com:4466 script src's are allowed to run
          expect(cspLogMessages).to.contain('script src origin www.foobar.com:4466 script ran')
          expect(cspLogMessages).to.contain('script src origin localhost:4466 script ran')

          // We did not configure any inline script to run, therefore these messages should have never been reported
          expect(cspLogMessages).to.not.contain('nonce script ran')
          expect(cspLogMessages).to.not.contain('hash script ran')
          expect(cspLogMessages).to.not.contain('eval script ran')

          // should have been blocked by CSP as it isn't configured by the server to run
          expect(cspLogMessages).to.not.contain('script src origin app.foobar.com:4466 script ran')
        })
      })
    })
  })
})
