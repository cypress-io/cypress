it('reloads when restart is clicked after config changes', () => {
  cy.visit('/index.html')
  cy.task('modify:cypress:json').then(() => {
    const el = window.top.document.documentElement

    cy.wrap(el)
    .find('.reporter .banner')
    .contains('Restart')
  })
})

