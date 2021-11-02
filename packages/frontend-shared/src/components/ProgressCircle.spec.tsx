import ProgressCircle from './ProgressCircle.vue'

describe('<ProgressCircle />', { viewportWidth: 50, viewportHeight: 50 }, () => {
  it('playground', () => {
    cy.mount(() => (
      <ProgressCircle progress={57} radius={25} stroke={3} class="text-indigo-400" />
    ))
  })
})
