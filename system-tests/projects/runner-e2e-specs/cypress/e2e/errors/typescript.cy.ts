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
    const myVar = { something: 'foo' } as Foo

    cy.log(`Printing TS: ${ myVar}`)
    cy.get('#does-not-exist')
  })
})
