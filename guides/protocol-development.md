# Protocol Development

In production, the capture code used to capture and communicate test data will be retrieved from the Cloud. However, in order to develop the capture code locally, developers will:

* Clone the `cypress-services` repo
  * Run `yarn`
  * Run `yarn watch` in `packages/app-capture-protocol`
* Clone the `cypress` repo
  * Run `yarn`
  * Execute `CYPRESS_LOCAL_PROTOCOL_PATH=path/to/cypress-services/packages/app-capture-protocol/dist/index.js CYPRESS_INTERNAL_ENV=staging yarn cypress:run --record --key <record_key> --project <path/to/project>` on a project in record mode
