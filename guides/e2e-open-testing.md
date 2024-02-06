# E2E Open Mode Testing

The "Open Mode" E2E tests in `packages/app` & `packages/launchpad` are the "system tests" for the open mode. This means that they hit the actual node server and act as a realistic "real world" scenario as much as possible. The main idea of these tests is to act as comprehensive "end-to-end" test for the actual server execution, and act as a "black box", testing for functional behavior as high-level as possible - only tapping into lower-level details when it's necessary.

### Example Test:

```ts
beforeEach(() => {
  // Scaffold a project, from system-tests/fixtures
  cy.scaffoldProject('todos')

  // "Open" the project, as though you did cypress open --project 'path/to/todos'
  cy.openProject('todos')

  // Open the project, passing '--e2e' in the argv for cypress open
  cy.openProject('todos', ['--e2e'])

  // cypress open --global
  cy.openGlobalMode()
})

it('should onboard a todos project', () => {
  cy.visitLaunchpad()
  cy.get('[e2e-project]').click()
  cy.withCtx(async (ctx) => {
    await ctx.actions.file.writeFileInProject('cypress.config.ts', 'export default {}') // Adds a file
  })
})
```

### Testing the App:

```ts
it('should open todos in the app', () => {
  cy.startAppServer() // starts the express server used to run the "app"
  cy.visitApp() // visits the app page, without launching the browser
  cy.specsPageIsVisible()
  cy.get('[href=#/runs]').click()
  cy.get('[href=#/settings]').click()
})
```

### Remote GraphQL Schema Mocking

When we hit the remote GraphQL server, we mock against the same mocked schema we use client-side in the component tests. If we want to modify these responses we can use `cy.remoteGraphQLIntercept` to tap in and modify the mocked payloads to simulate different states:

```ts
cy.remoteGraphQLIntercept(async (obj) => {
  // Currently, all remote requests go through here, we want to use this to modify the
  // remote request before it's used and avoid touching the login query
  if (obj.result.data?.cloudProjectBySlug.runs?.nodes) {
    obj.result.data.cloudProjectBySlug.runs.nodes = []
  }

  return obj.result
})
```
