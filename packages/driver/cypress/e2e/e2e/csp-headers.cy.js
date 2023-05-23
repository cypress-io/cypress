describe('csp-headers', () => {
  // Currently unable to test spec based config values for experimentalCspAllowList
  if (cy.config('experimentalCspAllowList') === false || cy.config('experimentalCspAllowList') === true) {
    it('content-security-policy headers stripped', () => {
      const route = '/fixtures/empty.html'

      cy.intercept(route, (req) => {
        req.continue((res) => {
          res.headers['content-security-policy'] = `script-src http://not-here.net;`
        })
      })

      cy.visit(route)
      .wait(1000)

      // Next verify that inline scripts are allowed, because if they aren't, the CSP header is not getting stripped
      const inlineId = `__${Math.random()}`

      cy.window().then((win) => {
        expect(() => {
          return win.eval(`
              var script = document.createElement('script');
              script.textContent = "window['${inlineId}'] = '${inlineId}'";
              document.head.appendChild(script);
          `)
        }).not.to.throw() // CSP should be stripped, so this should not throw

        // Inline script should have created the var
        expect(win[`${inlineId}`]).to.equal(`${inlineId}`, 'CSP Headers are not being stripped')
      })
    })
  } else if (cy.config('experimentalCspAllowList').includes('script-src')) {
    it('content-security-policy headers available', () => {
      const route = '/fixtures/empty.html'

      cy.intercept(route, (req) => {
        req.continue((res) => {
          res.headers['content-security-policy'] = `script-src http://not-here.net;`
        })
      })

      cy.visit(route)
      .wait(1000)

      // Next verify that inline scripts are blocked, because if they aren't, the CSP header is getting stripped
      const inlineId = `__${Math.random()}`

      cy.window().then((win) => {
        expect(() => {
          return win.eval(`
              var script = document.createElement('script');
              script.textContent = "window['${inlineId}'] = '${inlineId}'";
              document.head.appendChild(script);
          `)
        }).to.throw() // CSP should prevent `unsafe-eval`

        // Inline script should not have created the var
        expect(win[`${inlineId}`]).to.equal(undefined, 'CSP Headers are stripped')
      })
    })
  }
})
