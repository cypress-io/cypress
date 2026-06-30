// References the `process` global the same way Node-oriented dependencies
// (e.g. otplib) do. This only resolves in the browser if the webpack
// `ProvidePlugin` that injects `process` is preserved when bundling the
// cy.origin callback. @see https://github.com/cypress-io/cypress/discussions/30646
export const usesProcessGlobal = () => {
  return typeof process !== 'undefined' && typeof process.nextTick === 'function'
}
