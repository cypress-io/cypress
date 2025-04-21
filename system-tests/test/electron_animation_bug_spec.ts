import { default as systemTests } from '../lib/system-tests'

describe('e2e electron animation bug', () => {
  systemTests.it('executes a test that demonstrates the electron animation bug and ensures that we have worked around it', {
    browser: 'electron',
    project: 'e2e',
    spec: 'electron_animation_bug.cy.ts',
  })
})
