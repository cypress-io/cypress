# Studio Development

In production, the code used to facilitate Studio functionality will be retrieved from the Cloud. While Studio is still in its early stages it is hidden behind an environment variable: `CYPRESS_ENABLE_CLOUD_STUDIO` but can also be run against local cloud Studio code via the environment variable: `CYPRESS_LOCAL_STUDIO_PATH`.

To run against locally developed Studio:

- Clone the `cypress-services` repo (this requires that you be a member of the Cypress organization)
  - Run `yarn`
  - Run `yarn watch` in `app/packages/studio`
- Set:
  - `CYPRESS_INTERNAL_ENV=<environment>` (e.g. `staging` or `production` if you want to hit those deployments of `cypress-services` or `development` if you want to hit a locally running version of `cypress-services`)
  - `CYPRESS_LOCAL_STUDIO_PATH` to the path to the `cypress-services/app/packages/studio/dist/development` directory

Note: When using the `CYPRESS_LOCAL_STUDIO_PATH` environment variable, we bypass our error reporting and instead throw the exception immediately. The purpose of this is to try and surface issues immediately during local development.
 
To run against a deployed version of studio:

- Set:
  - `CYPRESS_INTERNAL_ENV=<environment>` (e.g. `staging` or `production` if you want to hit those deployments of `cypress-services` or `development` if you want to hit a locally running version of `cypress-services`)
  - `CYPRESS_ENABLE_CLOUD_STUDIO=true`

Regardless of running against local or deployed studio:

- Clone the `cypress` repo
  - Run `yarn`
  - Run `yarn cypress:open`
  - Log In to the Cloud via the App
  - Ensure the project has been setup in the `Cypress (staging)` if in staging environment or `Cypress Internal Org` if in production environment and has a `projectId` that represents that. If developing against locally running `cypress-services`, ensure that the project has the feature `studio-ai` enabled for it.
  - Open a project that has `experimentalStudio: true` set in the `e2e` config of the `cypress.config.js|ts` file.
  - Click to 'Add Commands to Test' after hovering over a test command.

## Types

The studio bundle provides the types for the `app` and `server` interfaces that are used within the Cypress code. To incorporate the types into the code base, run:

```sh
yarn gulp downloadStudioTypes
```

or to reference a local `cypress_services` repo:

```sh
CYPRESS_LOCAL_STUDIO_PATH=<path-to-cypress-services/app/studio/dist/development-directory> yarn gulp downloadStudioTypes
```
