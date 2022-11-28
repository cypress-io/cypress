import DebugFailedTest from './DebugFailedTest.vue'

describe('<DebugSpec/>', () => {
  it('mounts correctly', () => {
    cy.mount(() => (
      <DebugFailedTest failedTest="Login should redirect unauthenticated user to signin page" />
    ))
  })
})
