exports['deprecated before:browser:launch args / fails when adding unknown properties to launchOptions'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (app.cy.js)                                                                │
  │ Searched:   cypress/e2e/app.cy.js                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  app.cy.js                                                                       (1 of 1)
The launchOptions object returned by your plugin's before:browser:launch handler contained unexpected properties:

 - foo
 - width
 - height

launchOptions may only contain the properties:

 - preferences
 - extensions
 - args
 - env

https://on.cypress.io/browser-launch-api

`

exports['deprecated before:browser:launch args / displays errors thrown and aborts the run'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      2 found (app.cy.js, app_spec2.js)                                                  │
  │ Searched:   cypress/e2e/app.cy.js, cypress/e2e/app_spec2.js                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  app.cy.js                                                                       (1 of 2)
Error thrown from plugins handler
Error: Error thrown from plugins handler
      [stack trace lines]
`

exports['deprecated before:browser:launch args / displays promises rejected and aborts the run'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      2 found (app.cy.js, app_spec2.js)                                                  │
  │ Searched:   cypress/e2e/app.cy.js, cypress/e2e/app_spec2.js                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  app.cy.js                                                                       (1 of 2)
Promise rejected from plugins handler
Error: Promise rejected from plugins handler
      [stack trace lines]
`
