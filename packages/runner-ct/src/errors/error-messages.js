export default {
  reporterError (err, specPath) {
    if (!err) return null

    switch (err.type) {
      case 'BUNDLE_ERROR':
        return {
          title: 'Oops...we found an error preparing this test file:',
          link: 'https://on.cypress.io/we-found-an-error-preparing-your-test-file',
          callout: specPath,
          message: `
This occurred while Cypress was compiling and bundling your test code. This is usually caused by:

* A missing file or dependency
* A syntax error in the file or one of its dependencies

Fix the error in your code and re-run your tests.
          `,
        }
      default:
        return null
    }
  },
}
