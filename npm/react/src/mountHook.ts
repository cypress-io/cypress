/**
 * Mounts a React hook function in a test component for testing.
 * Removed as of Cypress 11.0.0.
 * @see https://on.cypress.io/migration-11-0-0-component-testing-updates
 */
export const mountHook = <T>(hookFn: (...args: any[]) => T) => {
  // @ts-expect-error - internal API
  Cypress.utils.throwErrByPath('mount.mount_hook')
}
