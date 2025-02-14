# Studio Development

In production, the code used to facilitate Studio functionality will be retrieved from the Cloud. However, in order to develop locally, developers will:

- Clone the `cypress-services` repo (this requires that you be a member of the Cypress organization)
  - Run `yarn`
  - Run `yarn watch` in `app/studio`
- Set `CYPRESS_LOCAL_STUDIO_PATH` to the path to the `cypress-services/app/studio/dist/development` directory
- Clone the `cypress` repo
  - Run `yarn`
  - Run `yarn cypress:open`
