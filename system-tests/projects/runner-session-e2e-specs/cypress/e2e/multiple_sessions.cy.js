it('t1', () => {
  cy.session('user1', () => {
    window.localStorage.foo = 'val'
  })

  cy.session('user2', () => {
    window.localStorage.foo = 'val'
    window.localStorage.bar = 'val'
  })
})
