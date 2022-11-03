/**
 * Mounts a React hook function in a test component for testing.
 * Removed as of Cypress 11.0.0.
 * @see https://on.cypress.io/migration-11-0-0-component-testing-updates
 */
export const mountHook = <T>(hookFn: (...args: any[]) => T) => {
  throw new Error('mountHook is no longer supported. See https://on.cypress.io/migration-11-0-0-component-testing-updates to migrate.')
}
