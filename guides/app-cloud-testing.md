# App <--> Cloud Testing

Testing communication between the Cypress App and Cypress Cloud can be complex depending on how much data is going back and forth. For example, we recently completed the Debug page feature which involved writing some e2e tests to verify that the page was functioning correctly with the expected data from Cypress Cloud. In this document, we'll share some of our findings from the process of writing these tests for the Debug page.

## Working with GraphQL requests

We use GraphQL to interface with Cypress Cloud, so there are some things to know when writing e2e tests between the App and Cloud.

The App talks to the server over a web socket, so `cy.intercept` never sees its GraphQL requests. Mock the server's requests to Cypress Cloud with `cy.remoteGraphQLIntercept`, and check the App's mutations by spying on the `data-context` action they call with `cy.withCtx` and `cy.withRetryableCtx`.

### Creating JSON fixtures from GraphQL requests

Large Cloud responses are easiest to mock by starting from a real one. Run the query in GraphiQL (**Developer Tools > GraphiQL** in a dev build) against a real project, copy the response into a fixture, and modify individual fields to tweak the app state.

### Intercepting requests from the server

`cy.remoteGraphQLIntercept` intercepts the request at the server level, so we are able to return fixture data here and have the resolver continue on as if this is the data that was returned from Cypress Cloud.

You can see an example of this in [our spec for the Debug page](/packages/app/cypress/e2e/debug.cy.ts#L23).

```js
import RelevantRunsDataSource_RunsByCommitShas from '../fixtures/gql-RelevantRunsDataSource_RunsByCommitShas.json'

beforeEach(() => {
  cy.remoteGraphQLIntercept((obj, _testState, options) => {
    if (obj.operationName === 'RelevantRunsDataSource_RunsByCommitShas') {
      obj.result.data = options.RelevantRunsDataSource_RunsByCommitShas.data
    }

    return obj.result
  }, { RelevantRunsDataSource_RunsByCommitShas })
})
```