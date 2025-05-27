# `cy.prompt` Development

In production, the code used to facilitate the prompt command will be retrieved from the Cloud.

To run against locally developed `cy.prompt`:

- Clone the `cypress-services` repo
  - Run `yarn`
  - Run `yarn watch` in `app/packages/cy-prompt`
- Set:
  - `CYPRESS_INTERNAL_ENV=<environment>` (e.g. `staging` or `production` if you want to hit those deployments of `cypress-services` or `development` if you want to hit a locally running version of `cypress-services`)
  - `CYPRESS_LOCAL_CY_PROMPT_PATH` to the path to the `cypress-services/app/packages/cy-prompt/dist/development` directory
- Clone the `cypress` repo
  - Run `yarn`
  - Run `yarn cypress:open`
  - Log In to the Cloud via the App
  - Open a project that has `experimentalPromptCommand: true` set in the `e2e` config of the `cypress.config.js|ts` file.
 
To run against a deployed version of `cy.prompt`:

- Set:
  - `CYPRESS_INTERNAL_ENV=<environment>` (e.g. `staging` or `production` if you want to hit those deployments of `cypress-services` or `development` if you want to hit a locally running version of `cypress-services`)

## Testing

### Unit/Component Testing

The code that supports cloud `cy.prompt` and lives in the `cypress` monorepo is unit, integration, and e2e tested in a similar fashion to the rest of the code in the repo. See the [contributing guide](https://github.com/cypress-io/cypress/blob/ad353fcc0f7fdc51b8e624a2a1ef4e76ef9400a0/CONTRIBUTING.md?plain=1#L366) for more specifics.

The code that supports cloud `cy.prompt` and lives in the `cypress-services` monorepo has unit tests that live alongside the code in that monorepo.
