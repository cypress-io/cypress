# Studio Development

In production, the code used to facilitate Studio functionality will be retrieved from the Cloud. During development, the environment variable `CYPRESS_LOCAL_STUDIO_PATH` can be used to run against a local version.

To run against locally developed Studio:

- Clone the `cypress-services` repo (this requires that you be a member of the Cypress organization)
  - Run `yarn`
  - Run `yarn watch` in `app/packages/studio`
  - If developing against locally running `cypress-services`: Run `yarn dev` in the `cypress-services` directory first
- Set environment variables:
  - `CYPRESS_INTERNAL_ENV=<environment>` (typically `staging` or `production` to hit those deployments of `cypress-services`, or `development` if you want to hit a locally running version of `cypress-services`)
  - Set `CYPRESS_LOCAL_STUDIO_PATH` to a relative path pointing to the `cypress-services/app/packages/studio/dist/development` directory (regardless of the `CYPRESS_INTERNAL_ENV` set).
- Clone the `cypress` repo
  - Run `yarn`
  - Run `yarn cypress:open`
  - Log In to the Cloud via the App
  - Ensure the project has been setup in the `Cypress (staging)` if in staging environment or `Cypress Internal Org` if in production environment and has a `projectId` that represents that. If developing against locally running `cypress-services`, ensure that the project has the feature `studio-ai` enabled for it.
  - Open a project with `e2e` tests.
  - Click to 'Add Commands to Test' after hovering over a test command.

Note: When using the `CYPRESS_LOCAL_STUDIO_PATH` environment variable or when running the Cypress app via the locally cloned repository, we bypass our error reporting and instead log errors to the browser or node console.

Note: When using the `CYPRESS_LOCAL_STUDIO_PATH` the cloud studio code will be watched for changes so that you do not have to stop the app to incorporate any new changes.

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

Several helpers are provided to facilitate testing cloud Studio using Cypress in Cypress tests. The [helper file](https://github.com/cypress-io/cypress/blob/ad353fcc0f7fdc51b8e624a2a1ef4e76ef9400a0/packages/app/cypress/e2e/studio/helper.ts) provides a method, `launchStudio` that:

1. Loads a project (by default [`experimental-studio`](https://github.com/cypress-io/cypress/tree/develop/system-tests/projects/experimental-studio)).
2. Navigates to the appropriate spec (by default `specName.cy.js`).
3. Enters Studio either by creating a new test or entering from an existing test via the `createNewTest` parameter
4. Waits for the test to finish executing again in Studio mode.

The above steps actually download the studio code from the cloud and use it for the test. Note that `experimental-studio` is set up to be a `canary` project so it will always get the latest and greatest of the cloud Studio code, whether or not it has been fully promoted to production. Note that this means that if you are writing Cypress in Cypress tests that depend on new functionality delivered from the cloud, the Cypress in Cypress tests cannot be merged until the code lands and is built in the cloud. Local development is still possible however by setting `process.env.CYPRESS_LOCAL_STUDIO_PATH` to your local studio path where we enable studio [here](https://github.com/cypress-io/cypress/blob/develop/packages/frontend-shared/cypress/e2e/e2ePluginSetup.ts#L424).

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
