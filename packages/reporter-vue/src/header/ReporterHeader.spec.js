import ReporterHeader from './ReporterHeader.vue'

it('renders', () => {
  cy.mount(ReporterHeader, {
    props: {
      runState: 'running',
      stats: {
        failed: 1,
        passed: 9,
        pending: 2,
      },
    }
  }).as('component')
    .get('[data-cy=play-pause-toggle]')
    .click().get('@component')
    .then((wrapper) => {
      expect(wrapper.emitted('pause')).to.have.length
      wrapper.setProps({ runState: 'paused' })
    }).get('[data-cy=play-pause-toggle]')
    .click().get('@component')
    .then((wrapper) => {
      expect(wrapper.emitted('restart')).to.have.length
    })
})
