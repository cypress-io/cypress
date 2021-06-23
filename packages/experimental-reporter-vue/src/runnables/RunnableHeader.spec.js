import RunnableHeader from './RunnableHeader.vue'

const specName = 'src/runnables/RunnableHeader.spec.js'
it('renders', () => {
  cy.mount(RunnableHeader, { slots: { default: specName } })
    .get('[data-cy=runnable-header]')
    .should('contain.text', specName)
})