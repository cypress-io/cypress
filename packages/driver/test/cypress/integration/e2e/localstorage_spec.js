describe('localstorage', () => {
  beforeEach(() => {
    cy.visit('/fixtures/generic.html')
  })

  it.only('sets localstorage', () => {
    window.localStorage.foo = JSON.stringify(Array(10000).fill().map((x, i) => [i, 'adsfsadf']))
    // setTimeout(() => {
    window.localStorage.clear()
    window.location.href = 'about:blank'
    cy.visit('/fixtures/generic.html')
    .then(() => {
      expect(window.localStorage.foo).not.exist
    })
    // }, 500)
  })

  it('persist clearing localstorage after visit', () => {
    // expect(window.localStorage.foo).not.exist
  })
})
