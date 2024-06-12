describe(`experimentalCspAllowList=true`, () => {
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
    // since ['script-src-elem', 'script-src', 'default-src'] are all stripped out when experimentalCspAllowList=true by default, the messages should always be present
    window.top.addEventListener('message', postMessageHandler, false)
  })

  afterEach(() => {
    window.top.removeEventListener('message', postMessageHandler, false)
  })

  ;['script-src-elem', 'script-src', 'default-src'].forEach((CSP_directive) => {
    describe(`content-security-policy directive ${CSP_directive} should be stripped and`, () => {
      it(` regardless of nonces/hashes`, () => {
        visitUrl.searchParams.append('csp', `${CSP_directive} http://www.foobar.com:4466 http://localhost:4466 'nonce-random_nonce' 'sha256-YM+jfV8mJ3IaF5lqpgvjnYAWdy0k77pupK3tsdMuZv8'`)

        cy.visit(visitUrl.toString())

        cy.window().then((win) => {
          return win.eval(`
              var script = document.createElement('script');
              script.textContent = "window.top.postMessage({ event: 'csp-script-ran', data: 'eval script ran'}, '*')";
              script.nonce = "random_nonce"
              document.head.appendChild(script);
          `)
        })

        // make sure the stylesheet is loaded with the color purple
        cy.get('h1').contains('CSP Script Test').should('have.css', 'color', 'rgb(128, 0, 128)')

        // wait a small amount of time for all postMessages to trickle in
        cy.wait(1000).then(() => {
          // since problematic CSP headers are stripped by default, we should have every message from every script
          expect(cspLogMessages).to.contain('script src origin www.foobar.com:4466 script ran')
          expect(cspLogMessages).to.contain('script src origin localhost:4466 script ran')
          expect(cspLogMessages).to.contain('nonce script ran')
          expect(cspLogMessages).to.contain('hash script ran')
          expect(cspLogMessages).to.contain('script src origin app.foobar.com:4466 script ran')
          expect(cspLogMessages).to.contain('eval script ran')
        })
      })
    })
  })

  const timeout = 1000

  it('passes on inline form action', {
    pageLoadTimeout: timeout,
    // @ts-expect-error
  }, () => {
    // this should be stripped out in the middleware
    visitUrl.searchParams.append('csp', `form-action 'none'`)

    cy.visit(visitUrl.toString())

    // expect the form to submit
    cy.get('#submit').click()

    // expect the form action to go through and NOT be blocked by CSP (even though the action itself fails which is OK)
    cy.contains('Cannot POST /').should('exist')
  })
})
