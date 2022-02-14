exports['e2e config provides various environment details 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (config_passing.cy.js)                                                     │
  │ Searched:   cypress/e2e/config_passing.cy.js                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  config_passing.cy.js                                                            (1 of 1)


  Cypress static methods + props
    ✓ .version
    ✓ .platform
    ✓ .arch
    ✓ .browser
    ✓ .spec
    .env
      ✓ doesn't die on <script> tags


  6 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        6                                                                                │
  │ Passing:      6                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     config_passing.cy.js                                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/config_passing.cy.js.mp4            (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  config_passing.cy.js                     XX:XX        6        6        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        6        6        -        -        -  


`

exports['e2e config applies defaultCommandTimeout globally 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (dom_times_out.cy.js)                                                      │
  │ Searched:   cypress/e2e/**/*.cy.{js,jsx,ts,tsx}                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  dom_times_out.cy.js                                                             (1 of 1)


  short defaultCommandTimeout
    1) times out looking for a missing element


  0 passing
  1 failing

  1) short defaultCommandTimeout
       times out looking for a missing element:
     AssertionError: Timed out retrying after 1000ms: Expected to find element: \`#bar\`, but never found it.
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  1                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     dom_times_out.cy.js                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/dom_times_out.cy.js/short defaultCommandTimeout     (1280x720)
      -- times out looking for a missing element (failed).png                                       


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/dom_times_out.cy.js.mp4             (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  dom_times_out.cy.js                      XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


`

exports['e2e config throws error when invalid viewportWidth in the configuration file 1'] = `
Your configFile at /foo/bar/.projects/config-with-invalid-viewport/cypress.config.js set an invalid value:

Expected viewportWidth to be a number.

Instead the value was: "foo"

`

exports['e2e config throws error when invalid browser in the configuration file 1'] = `
Your configFile at /foo/bar/.projects/config-with-invalid-browser/cypress.config.js set an invalid value:

The error occurred while validating the browsers list.

Expected family to be either chromium or firefox.

Instead the value was: 

{
  "name": "bad browser",
  "family": "unknown family",
  "displayName": "Bad browser",
  "version": "no version",
  "path": "/path/to",
  "majorVersion": 123
}

`

exports['e2e config throws error when multiple default config file are found in project 1'] = `
There is both a cypress.config.js and a cypress.config.ts at the location below:

  > /foo/bar/.projects/pristine-with-e2e-testing

Cypress does not know which one to read for config. Please remove one of the two and try again.


`

exports['e2e config throws error when cypress.json is found in project and need migration 1'] = `
There is a cypress.json file at the path: /foo/bar/.projects/pristine

Cypress version 10.0.0 no longer supports cypress.json.

Please run cypress open to launch the migration tool to migrate to cypress.config.{ts|js}.


`

exports['e2e config throws error when cypress.json is found in project and cypress.config.{ts|js} exists as well 1'] = `
There is both a cypress.config.js and a cypress.json file at the location below:

/foo/bar/.projects/multiple-config-files-with-json

Cypress no longer supports cypress.json, please remove it from your project.


`

exports['e2e config throws an error if supportFile is set on the root level 1'] = `
The supportFile configuration option was removed from the root of the Cypress config object in version 10.0.0.

Please update this option under each testing type property.

https://on.cypress.io/migration-guide

`

exports['e2e config throws an error if specPattern is set on the root level 1'] = `
The specPattern configuration option was removed from the root of the Cypress config object in version 10.0.0.

Please update this option under each testing type property.

https://on.cypress.io/migration-guide

`

exports['e2e config throws an error if excludeSpecPattern is set on the root level 1'] = `
The excludeSpecPattern configuration option was removed from the root of the Cypress config object in version 10.0.0.

Please update this option under each testing type property.

https://on.cypress.io/migration-guide

`

exports['e2e config throws an error if baseUrl is set on the root level 1'] = `
The baseUrl configuration option was removed from the root of the Cypress config object in version 10.0.0.

Please update this option under the e2e testing type property.

https://on.cypress.io/migration-guide

`

exports['e2e config throws an error if baseUrl is set on the component level 1'] = `
The baseUrl configuration option is not valid in Component testing. 

Please remove or add this option under e2e testing type property.

https://on.cypress.io/migration-guide

`
