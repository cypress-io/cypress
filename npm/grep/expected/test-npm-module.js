// https://github.com/cypress-io/cypress-grep/issues/41
// shows how to pass grep parameters using Cypress NPM Module API
// https://on.cypress.io/module-api
const cypress = require('cypress')

cypress
.run({
  env: {
    grep: 'works',
    grepTags: '@tag2',
  },
})
.then((results) => {
  // TODO use cypress-expects to compare the test results
  if (results.totalTests !== 5) {
    console.error('expected 5 tests total, got %d', results.totalTests)
    process.exit(1)
  }

  if (results.totalPassed !== 2) {
    console.error('expected 2 tests passed, got %d', results.totalPassed)
    process.exit(1)
  }

  if (results.totalPending !== 3) {
    console.error('expected 3 tests pending, got %d', results.totalPending)
    process.exit(1)
  }

  console.log(results.runs[0])
})
