describe('cross-origin messages from frames the runner did not create', () => {
  const postFromFrame = (event: string, args: unknown[]) => {
    cy.visit('/fixtures/primary-origin.html')

    return cy.window().then((win) => {
      return new Cypress.Promise((resolve) => {
        win.addEventListener('message', ({ data }) => {
          if (data?.type === 'other:response') {
            resolve(data.data)
          }

          if (data?.type === 'other:sent') {
            setTimeout(() => resolve('no response'), 1000)
          }
        })

        const iframe = win.document.createElement('iframe')
        const query = new URLSearchParams({ event, args: JSON.stringify(args) })

        iframe.src = `http://www.foobar.com:3500/fixtures/other/post-to-top.html?${query}`
        win.document.body.appendChild(iframe)
      })
    })
  }

  it('does not relay automation requests', () => {
    cy.setCookie('foo', 'bar')

    postFromFrame('automation:request', ['get:cookies', { domain: 'localhost' }])
    .should('equal', 'no response')
  })

  it('does not relay backend requests', () => {
    postFromFrame('backend:request', ['get:fixture', 'example.json', {}])
    .should('equal', 'no response')
  })
})
