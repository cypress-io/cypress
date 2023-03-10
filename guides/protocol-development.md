# Protocol Development

Under normal circumstances, we retrieve from the cloud the code that is used to capture and communicate test data. In order to develop the code locally, developers will:

* Clone the `cypress-services` repo
  * Run `yarn`
  * Run `yarn watch` in `packages/app-capture-protocol`
* Set `CYPRESS_LOCAL_PROTOCOL_PATH` to the path to `cypress-services/packages/app-capture-protocol/dist/index.js`
* Clone the `cypress` repo
  * Run `yarn`
  * Execute `cypress run` on a project in record mode
