# `cy.prompt` Development

In production, the code used to facilitate the prompt command will be retrieved from the Cloud.

To run against locally developed `cy.prompt`:

- Clone the `cypress-services` repo
  - Run `yarn && yarn all`
  - Run `yarn watch` in `app/packages/cy-prompt`
- Set:
  - `CYPRESS_INTERNAL_ENV=<environment>` (e.g. `staging` or `production` if you want to hit those deployments of `cypress-services` or `development` if you want to hit a locally running version of `cypress-services`)
  - `CYPRESS_LOCAL_CY_PROMPT_PATH` to the path to the `cypress-services/app/packages/cy-prompt/dist/development` directory

To run against a deployed version of `cy.prompt`:

- Set:
  - `CYPRESS_INTERNAL_ENV=<environment>` (e.g. `staging` or `production` if you want to hit those deployments of `cypress-services` or `development` if you want to hit a locally running version of `cypress-services`)

Regardless of running against local or deployed `cy.prompt`:

- Clone the `cypress` repo
  - Run `yarn`
  - Run `yarn cypress:open`
  - Log In to the Cloud via the App
  - Open a project that has `experimentalPromptCommand: true` set in the config of the `cypress.config.js|ts` file within `e2e`. Ensure the project has the feature flag `cy-prompt` enabled.
 
To run against a deployed version of `cy.prompt`:

- Set:
  - `CYPRESS_INTERNAL_ENV=<environment>` (e.g. `staging` or `production` if you want to hit those deployments of `cypress-services` or `development` if you want to hit a locally running version of `cypress-services`)

## Types

The prompt bundle provides the types for the `app`, `driver`, and `server` interfaces that are used within the Cypress code. To incorporate the types into the code base, run:

```sh
yarn gulp downloadPromptTypes
```

or to reference a local `cypress_services` repo:

```sh
CYPRESS_LOCAL_CY_PROMPT_PATH=<path-to-cypress-services/app/cy-prompt/dist/development-directory> yarn gulp downloadPromptTypes
```

## Testing

### Unit/Component Testing

The code that supports cloud `cy.prompt` and lives in the `cypress` monorepo is unit, integration, and e2e tested in a similar fashion to the rest of the code in the repo. See the [contributing guide](https://github.com/cypress-io/cypress/blob/ad353fcc0f7fdc51b8e624a2a1ef4e76ef9400a0/CONTRIBUTING.md?plain=1#L366) for more specifics.

The code that supports cloud `cy.prompt` and lives in the `cypress-services` monorepo has unit tests that live alongside the code in that monorepo.
