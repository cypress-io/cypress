// @see https://github.com/cypress-io/cypress/issues/17805
describe('issue 17805', { experimentalSessionAndOrigin: true }, () => {
  it('recreates session on spec reload in open mode', () => {
    let validateFlag = false

    cy.session('persist_session', () => {
      validateFlag = true
    },
    {
      validate () {
        if (validateFlag) {
          return true
        }

        return false
      },
    })
  })

  after(() => {
    if (cy.$$('.commands-container li.command:first', top.document).text().includes('(new)')) {
      top.location.reload()
    }
  })
})
