exports['plugins not supported in v10 / @cypress/code-coverage'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:      1.2.3                                                                            │
  │ Browser:      FooBrowser 88                                                                    │
  │ Specs:        1 found (foo.cy.js)                                                              │
  │ Searched:     cypress/e2e/*                                                                    │
  │ Experiments:  experimentalInteractiveRunEvents=true                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  foo.cy.js                                                                       (1 of 1)


  Blank Contents
    ✓ renders the blank page
    1) renders the visit failure page
    2) "after all" hook: mergeUnitTestCoverage for "renders the visit failure page"


  1 passing
  2 failing

  1) Blank Contents
       renders the visit failure page:
     CypressError: \`cy.visit()\` failed trying to load:

http://localhost:999/

We attempted to make an http request to this URL but the request failed without a response.

We received this error at the network level:

  > Error: connect ECONNREFUSED 127.0.0.1:999

Common situations why this would fail:
  - you don't have internet access
  - you forgot to run / boot your web server
  - your web server isn't accessible
  - you have weird network configuration settings on your computer
      [stack trace lines]
  
  From Node.js Internals:
    Error: connect ECONNREFUSED 127.0.0.1:999
      [stack trace lines]
    

  2) Blank Contents
       "after all" hook: mergeUnitTestCoverage for "renders the visit failure page":
     TypeError: Cypress detected that the current version of \`@cypress/code-coverage\` is not supported. Update it to the latest version

The following error was caught:

> glob pattern string required

Because this error occurred during a \`after all\` hook we are skipping all of the remaining tests.
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  2                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     foo.cy.js                                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/foo.cy.js/Blank Contents -- renders the visit f     (1280x720)
     ailure page (failed).png                                                                       
  -  /XXX/XXX/XXX/cypress/screenshots/foo.cy.js/renders the visit failure page -- aft     (1280x720)
     er all hook mergeUnitTestCoverage (failed).png                                                 


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  foo.cy.js                                XX:XX        2        1        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        2        1        1        -        -  


`
