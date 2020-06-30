import './setup'

// simple example of typescript types
type Foo = {
  something: string
}

describe('typescript', { defaultCommandTimeout: 0 }, () => {
  it('assertion failure', () => {
    expect('actual').to.equal('expected')
  })

  it('exception', () => {
    // @ts-ignore
    ({}).bar()
  })

  it('command failure', () => {
    cy.get('#does-not-exist')
  })
})
