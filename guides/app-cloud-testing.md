# App <--> Cloud Testing

Testing communication between the Cypress App and Cypress Cloud can be complex depending on how much data is going back and forth. For example, we recently completed the Debug page feature which involved writing some e2e tests to verify that the page was functioning correctly with the expected data from Cypress Cloud. In this document, we'll share some of our findings from the process of writing these tests for the Debug page.

## Working with GraphQL requests

We use GraphQL to interface with Cypress Cloud, so there are some things to know when writing e2e tests between the App and Cloud.

### GraphQL requests over fetch

By default, GraphQL queries use web sockets to fetch data. This doesn't let us intercept these messages and return a mock response using `cy.intercept` to get our app into the desired state for the test. We can set the GraphQL client to use fetch rather than WS by adding this hook at the top of our spec file.

You can see an example of this in [our spec for the Debug page](/packages/app/cypress/e2e/debug.cy.ts#L4).

```js
Cypress.on('window:before:load', (win) => {
  win.__CYPRESS_GQL_NO_SOCKET__ = 'true'
})
```

Now that the GraphQL requests to Cypress Cloud are happening over fetch, we can use `cy.intercept` to intercept the requests and do whatever we need to do (in most cases, return a JSON fixture as a response to the request).

Note that this intercepts requests between the App and Server. This means that any logic that we have in the `data-context` layer for this query will not be executed by the test because the query will be intercepted before it runs.

### Creating JSON fixtures from GraphQL requests

Another benefit of making our GraphQL requests over fetch is that we can easily see the real responses from Cypress Cloud in the Network tab of our browser developer tools. This is especially useful when we have large responses coming back from Cypress Cloud that we want to mock in our tests. 

We can start our fixture by copying the real response from the dev tools response into our fixture and then modifying individual fields to tweak our app state. Then we can intercept the GraphQL request and return our fixture. 

You can see an example of this in [our spec for the Debug page](/packages/app/cypress/e2e/debug.cy.ts#L35).

```js
cy.intercept('query-Debug', {
  fixture: 'debug-Passing/gql-Debug.json',
})
```

### Intercepting subscriptions and requests from the server

There are a few situations in which we need to use `cy.remoteGraphQLIntercept` to intercept a request:

- If the request originates from the server
- If the request is a subscription (these will always be over web sockets, so cy.intercept doesn't work)
- If there is server-side logic in the resolver that we want to cover with our test

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