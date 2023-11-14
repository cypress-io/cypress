const banner = require('terminal-banner').terminalBanner
const allPaths = require('@bahmutov/all-paths')
const cypress = require('cypress')

console.log('cypress is', cypress)

const onSuccess = (runResult) => {
  banner('Cypress results')
  console.log('%o', runResult)
  banner('Results paths')
  // TODO find a better way to show all available properties in the runResult object
  // maybe a tree representation in the terminal?
  console.log(allPaths(runResult).join('\n'))
}

cypress.run({
  spec: './cypress/e2e/a-spec.cy.js',
})
.then(onSuccess)
.catch(console.error)
