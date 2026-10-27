describe('cross-origin messages from other frames', () => {
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

        iframe.src = `http://www.foobar.com:3500/fixtures/other/message.html?${query}`
        win.document.body.appendChild(iframe)
      })
    })
  }

  it('ignores automation:request', () => {
    postFromFrame('automation:request', ['is:automation:client:connected', {}])
    .should('equal', 'no response')
  })

  it('ignores backend:request', () => {
    postFromFrame('backend:request', ['get:rendered:html:origins'])
    .should('equal', 'no response')
  })
})
