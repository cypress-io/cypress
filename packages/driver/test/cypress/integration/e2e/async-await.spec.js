describe('async-await.spec', () => {
  let a = false

  it('can use async/await', async () => {
    setTimeout(() => {
      a = true
    }, 300)

    cy.wait(100)

    await new Promise((resolve) => {
      setTimeout(resolve, 100)
    })

    await Cypress.Promise.delay(100)

  })

  it('should run only after 300ms', () => {
    expect(a).ok
  })
})

describe('working', () => {
  let a = false

  it('can ret cy', () => {
    setTimeout(() => {
      a = true
    }, 300)

    cy.wait(100)
    cy.wait(100)

    return Cypress.Promise.delay(100)

  })

  it('did wait', () => {
    expect(a).ok
  })
})
