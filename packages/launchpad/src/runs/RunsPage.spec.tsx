import RunsPage from './RunsPage.vue'

describe('<RunsPage />', () => {
  it('playground', () => {
    cy.mount(() => (
      <RunsPage />
    ))
  })
})
