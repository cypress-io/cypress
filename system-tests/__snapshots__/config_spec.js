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
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     config_passing.cy.js                                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


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
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     dom_times_out.cy.js                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/dom_times_out.cy.js/short defaultCommandTimeout     (1280x720)
      -- times out looking for a missing element (failed).png                                       


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

Expected family to be either chromium, firefox or webkit.

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
Could not load a Cypress configuration file because there are multiple matches.

We've found 2 Cypress configuration files named
cypress.config.ts, cypress.config.js at the location below:

  > /foo/bar/.projects/pristine-with-e2e-testing

Please delete the conflicting configuration files.


`

exports['e2e config throws error when cypress.json is found in project and need migration 1'] = `
There is a cypress.json file at the path: /foo/bar/.projects/pristine

Cypress version 10.0.0 no longer supports cypress.json.

Please run cypress open to launch the migration tool to migrate to cypress.config.{js,ts,mjs,cjs}.

https://on.cypress.io/migration-guide


`

exports['e2e config throws error when cypress.json is found in project and cypress.config.{js,ts,mjs,cjs} exists as well 1'] = `
There is both a cypress.config.js and a cypress.json file at the location below:

/foo/bar/.projects/multiple-config-files-with-json

Cypress no longer supports cypress.json, please remove it from your project.


`

exports['e2e config throws an error if supportFile is set on the root level 1'] = `
The supportFile configuration option is now invalid when set from the root of the config object in Cypress version 10.0.0.

It is now configured separately as a testing type property: e2e.supportFile and component.supportFile

{
  e2e: {
    specPattern: '...',
  },
  component: {
    specPattern: '...',
  },
}

https://on.cypress.io/migration-guide

`

exports['e2e config throws an error if specPattern is set on the root level 1'] = `
The specPattern configuration option is now invalid when set from the root of the config object in Cypress version 10.0.0.

It is now configured separately as a testing type property: e2e.specPattern and component.specPattern

{
  e2e: {
    specPattern: '...',
  },
  component: {
    specPattern: '...',
  },
}

https://on.cypress.io/migration-guide

`

exports['e2e config throws an error if excludeSpecPattern is set on the root level 1'] = `
The excludeSpecPattern configuration option is now invalid when set from the root of the config object in Cypress version 10.0.0.

It is now configured separately as a testing type property: e2e.excludeSpecPattern and component.excludeSpecPattern

{
  e2e: {
    specPattern: '...',
  },
  component: {
    specPattern: '...',
  },
}

https://on.cypress.io/migration-guide

`

exports['e2e config throws an error if baseUrl is set on the root level 1'] = `
The baseUrl configuration option is now invalid when set from the root of the config object in Cypress version 10.0.0.

It is now configured separately as a testing type property: e2e.baseUrl

{
  e2e: {
    baseUrl: '...',
  }
}

https://on.cypress.io/migration-guide

`

exports['e2e config throws an error if baseUrl is set on the component level 1'] = `
The component.baseUrl configuration option is not valid for component testing.

Please remove this option or add this as an e2e testing type property: e2e.baseUrl

{
  e2e: {
    baseUrl: '...',
  }
}

https://on.cypress.io/migration-guide

`

exports['e2e config throws an error if testFiles is set on the config file 1'] = `
The testFiles configuration option is now invalid when set on the config object in Cypress version 10.0.0.

It is now renamed to specPattern and configured separately as a testing type property: e2e.specPattern

{
  e2e: {
    specPattern: '...',
  },
}

https://on.cypress.io/migration-guide

`

exports['e2e config setupNodeEvents modify specPattern for current testing type 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (a_record.cy.js)                                                           │
  │ Searched:   cypress/e2e/a_record.cy.js                                                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  a_record.cy.js                                                                  (1 of 1)


  a spec
    ✓ a test


  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     a_record.cy.js                                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  a_record.cy.js                           XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`

exports['e2e config throws an error if componentFolder is set on the config file 1'] = `
The componentFolder configuration option is now invalid when set on the config object in Cypress version 10.0.0.

It is now renamed to specPattern and configured separately as a component testing property: component.specPattern

{
  component: {
    specPattern: '...',
  },
}

https://on.cypress.io/migration-guide

`

exports['e2e config throws an error if indexHtml is set on the root level 1'] = `
The indexHtmlFile configuration option is now invalid when set from the root of the config object in Cypress version 10.0.0.

It is now configured separately as a testing type property: component.indexHtmlFile

{
  component: {
    indexHtmlFile: '...',
  }
}

https://on.cypress.io/migration-guide

`

exports['e2e config throws an error if indexHtml is set on the e2e level 1'] = `
The e2e.indexHtmlFile configuration option is not valid for e2e testing.

Please remove this option or add this as a component testing type property: component.indexHtmlFile

{
  e2e: {
    indexHtmlFile: '...',
  }
}

https://on.cypress.io/migration-guide

`

exports['e2e config finds supportFiles in projects containing glob syntax 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (app.cy.js)                                                                │
  │ Searched:   cypress/e2e/**/*.cy.{js,jsx,ts,tsx}                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  app.cy.js                                                                       (1 of 1)


  ✓ is true

  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     app.cy.js                                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  app.cy.js                                XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`

exports['e2e config throws an error if cypress.env.json specifies invalid property 1'] = `
Your configFile at /foo/bar/.projects/invalid-env-file/cypress.env.json set an invalid value:

Expected reporter to be a string.

Instead the value was: 5

`
