# Studio Development

Studio is delivered from Cypress Cloud. In production, the Studio bundle is retrieved from the Cloud at runtime. For local development, the environment variable `CYPRESS_LOCAL_STUDIO_PATH` can be used to run against a local Studio build from the `cypress-services` repo.

To run against locally developed Studio:

- Clone the `cypress-services` repo (requires Cypress organization membership)
  - Run `yarn`
  - Run `yarn watch` in `app/packages/studio`
  - If developing against locally running `cypress-services`: run `yarn dev` in the `cypress-services` directory first
- Set environment variables:
  - `CYPRESS_INTERNAL_ENV=<environment>` (e.g. `staging`, `production`, or `development` for a local `cypress-services` instance)
  - `CYPRESS_LOCAL_STUDIO_PATH`: path to `cypress-services/app/packages/studio/dist/development` (overrides Cloud bundle when set)
- In the `cypress` repo:
  - Run `yarn` and `yarn cypress:open`
  - Log in to Cypress Cloud in the app
  - Use a project that has Studio enabled (e.g. in Cypress (staging) or Cypress Internal Org with the `studio-ai` feature enabled for that project)
  - Open a project with E2E tests and use "Add Commands to Test" from a test to enter Studio

Note: With `CYPRESS_LOCAL_STUDIO_PATH` or when running the app from a local clone, error reporting is bypassed and errors are logged to the browser or Node console. With `CYPRESS_LOCAL_STUDIO_PATH`, the local Studio code is watched so you can change it without restarting the app.

## Types

The studio bundle provides the types for the `app` and `server` interfaces that are used within the Cypress code. To incorporate the types into the code base, run:

```sh
yarn gulp downloadStudioTypes
```

or to reference a local `cypress_services` repo:

```sh
CYPRESS_LOCAL_STUDIO_PATH=<path-to-cypress-services/app/studio/dist/development-directory> yarn gulp downloadStudioTypes
```

## Testing

### Unit/Component Testing

The code that supports cloud Studio and lives in the `cypress` monorepo is unit and component tested in a similar fashion to the rest of the code in the repo. See the [contributing guide](https://github.com/cypress-io/cypress/blob/ad353fcc0f7fdc51b8e624a2a1ef4e76ef9400a0/CONTRIBUTING.md?plain=1#L366) for more specifics.

The code that supports cloud Studio and lives in the `cypress-services` monorepo has unit and component tests that live alongside the code in that monorepo.

### Cypress in Cypress Testing

Helpers for testing Studio with Cypress-in-Cypress live in [packages/app/cypress/e2e/studio/helper.ts](https://github.com/cypress-io/cypress/blob/develop/packages/app/cypress/e2e/studio/helper.ts). The `launchStudio` helper:

1. Loads a project (by default the [`studio`](https://github.com/cypress-io/cypress/tree/develop/system-tests/projects/studio) fixture project).
2. Navigates to the target spec (by default `specName.cy.js`).
3. Enters Studio (new test or existing test via the `createNewTest` parameter).
4. Waits for the test run to finish in Studio mode.

Those tests use the Studio bundle from the Cloud. The `studio` project uses a `canary` projectId so it receives the latest Cloud Studio build. For local Studio changes, set `process.env.CYPRESS_LOCAL_STUDIO_PATH` to your local studio build; Studio is enabled in that environment in [packages/frontend-shared/cypress/e2e/e2ePluginSetup.ts](https://github.com/cypress-io/cypress/blob/develop/packages/frontend-shared/cypress/e2e/e2ePluginSetup.ts).

In order to properly engage with Studio AI, we choose to simulate the cloud interactions that enable it via something like:

```js
cy.mockNodeCloudRequest({
  url: '/studio/testgen/n69px6/enabled',
  method: 'get',
  body: { enabled: true },
})
```

To ensure that we get the same results from our Studio AI calls every time, we simulate them via something like:

```js
const aiOutput = 'cy.get(\'button\').should(\'have.text\', \'Increment\')'
cy.mockNodeCloudRequest({
  url: '/studio/testgen/n69px6/generate',
  method: 'post',
  body: { recommendations: [{ content: aiOutput }] },
})
```

The above two helpers actually mock out the Node requests so we still test the interface between the browser and node with these tests.

Also, since protocol does not work properly on the inner Cypress of Cypress in Cypress tests, we choose to create a dummy protocol which means we need to provide a simulated CDP full snapshot that will be sent to AI via something like:

```js
cy.mockStudioFullSnapshot({
  id: 1,
  nodeType: 1,
  nodeName: 'div',
  localName: 'div',
  nodeValue: 'div',
  children: [],
  shadowRoots: [],
})
```
