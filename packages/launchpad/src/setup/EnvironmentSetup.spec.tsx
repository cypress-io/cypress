import EnvironmentSetup from './EnvironmentSetup.vue'

describe('<EnvironmentSetup />', () => {
  it('playground', { viewportWidth: 800 }, () => {
    cy.mount(
      <div class="m-10">
        <EnvironmentSetup />
      </div>,
    )

    cy.get('[data-cy="select-framework"]').click()
    cy.contains('Nuxt.js').click()
  })
})
