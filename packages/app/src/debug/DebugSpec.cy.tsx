import type { Spec, TestResults } from './DebugSpec.vue'
import DebugSpec from './DebugSpec.vue'

const spec: Spec = {
  id: '1',
  path: 'cypress/tests/auth.spec.ts',
}

const testResults: TestResults = {
  id: '1',
  titleParts: ['Login Should redirect unauthenticated user to signin page', 'Login redirects to stored path after login'],
}

describe('<DebugSpec/>', () => {
  it('mounts correctly', () => {
    cy.mount(() => (
      <DebugSpec spec={spec} testResults={testResults} disabled={false} />
    ))
  })
})
