import MigrationWizard from './MigrationWizard.vue'

describe('<MigrationWizard/>', { viewportWidth: 1119 }, () => {
  it('renders expected content', () => {
    cy.mount(() => (<div class="p-16px">
      <MigrationWizard />
    </div>))
  })
})
