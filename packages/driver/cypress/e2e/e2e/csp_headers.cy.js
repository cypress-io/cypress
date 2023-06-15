describe('csp-headers', () => {
  it('content-security-policy headers are always stripped', () => {
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
      expect(win[`${inlineId}`]).to.equal(`${inlineId}`, 'CSP Headers are being stripped')
    })
  })
})
