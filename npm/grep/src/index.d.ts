/// <reference types="cypress" />

declare namespace Cypress {
  // specify additional properties in the TestConfig object
  // in our case we will add "tags" property
  interface TestConfigOverrides {
    /**
     * List of tags for this test
     * @example a single tag
     *  it('logs in', { tags: '@smoke' }, () => { ... })
     * @example multiple tags
     *  it('works', { tags: ['@smoke', '@slow'] }, () => { ... })
     */
    tags?: string | string[]
  }

  interface Cypress {
    grep?: (grep?: string, tags?: string, burn?: string) => void
  }
}