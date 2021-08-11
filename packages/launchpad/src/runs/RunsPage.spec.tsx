import RunsPage from './RunsPage.vue'

xdescribe('<RunsPage />', () => {
  it('playground', () => {
    cy.mountFragment(
    cy.mount(() => (
      <RunsPage />
    ))
  })
})
