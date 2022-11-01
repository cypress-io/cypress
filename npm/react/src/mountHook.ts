/**
 * Mounts a React hook function in a test component for testing.
 * @deprecated Removed as of Cypress 11.0.0
 */
export const mountHook = <T>(hookFn: (...args: any[]) => T) => {
  throw new Error('mountHook is no longer supported. See https://docs.cypress.io/guides/references/migration-guide#Component-Testing-Changes to migrate.')
}
