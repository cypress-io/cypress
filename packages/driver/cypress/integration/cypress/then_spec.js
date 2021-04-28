describe('async / await', () => {
  beforeEach(() => {
    cy.visit('/fixtures/dom.html')
  })

  // it('is broken', () => {
  //   const chainer1 = cy.get('body')
  //   chainer1.find('div:first').then(() => {
  //     chainer1
  //   })
  // })

  it('example from #1417', async () => {
    const body1 = await cy.get('body')
    const body2 = await cy.get('body')

    cy.get('body').then((body) => console.log('body', body)) // logs jQuery-wrapped body tag

    // "promises" have resolved by this point
    console.log('body1', body1) // logs jQuery-wrapped body tag
    console.log('body2', body2) // logs undefined
  })

  it.only('resolves correct values w/ Promise.all', async () => {
    const [body, table] = await Promise.all([
      cy.get('body').then(),
      cy.get('table').then(),
    ])

    // "promises" have resolved by this point
    console.log('body', body) // logs jQuery-wrapped body tag
    console.log('table', table) // logs jQuery-wrapped body tag
  })

  it('should call functions in order', async () => {
    const calls = []

    await cy.get('#table').find('tbody').then(() => {
      calls.push(1)
    })

    calls.push(2)

    expect(calls).to.eql([1, 2])
  })

  it('should function similar to a normal async / await', async () => {
    const $tbody = await cy.get('#table').find('tbody')

    expect($tbody[0]).to.equal(cy.$$('#table').find('tbody')[0])
  })

  it('should run in correct order with multiple chains', async () => {
    const calls = []

    cy.get('#table').find('tbody').its('length').should('eq', 1).then(() => {
      calls.push(1)
    })

    cy.get('#table').find('tbody').its('length').should('eq', 1).then(() => {
      calls.push(2)
    })

    await cy.then(() => {
      calls.push(3)
    })

    expect(calls).to.eql([1, 2, 3])
  })
})
