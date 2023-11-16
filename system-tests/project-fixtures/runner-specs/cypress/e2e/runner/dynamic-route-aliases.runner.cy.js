it('dynamic route aliases', () => {
  const { $ } = Cypress

  const url = 'foo*'

  cy.intercept(url, (req) => {
    req.alias = 'fooAlias',
    req.reply({ foo: 'bar' })
  }).then(() => {
    $.get(url)
  }).wait('@fooAlias')
})
