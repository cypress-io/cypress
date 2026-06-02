module.exports = {
  e2e: {
    supportFile: false,
    // test isolation is on by default for e2e, but set it explicitly since it is
    // the behavior under test. https://github.com/cypress-io/cypress/issues/29927
    testIsolation: true,
    // keep the previously-buggy path fast: the assertion that the `before` hook's
    // page did NOT leak should time out quickly if the page was not reset.
    defaultCommandTimeout: 1000,
  },
}
