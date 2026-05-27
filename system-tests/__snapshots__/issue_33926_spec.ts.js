exports['e2e issue 33926 / fails on webkit 15.15+ when session restore and intercepts deadlock stability queue'] = `
Warning: The allowCypressEnv configuration option is enabled. This allows any browser code to read values from Cypress.env(). This is insecure and will be removed in a future major version.

1. Replace Cypress.env() calls with cy.env() (for sensitive values) or Cypress.expose() (for public configuration)
2. Set allowCypressEnv: false in your Cypress configuration to disable Cypress.env()

Learn more: https://on.cypress.io/cypress-env-migration


====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:      1.2.3                                                                            │
  │ Browser:      FooBrowser 88                                                                    │
  │ Specs:        1 found (issue_33926.cy.js)                                                      │
  │ Searched:     cypress/e2e/issue_33926.cy.js                                                    │
  │ Experiments:  experimentalWebKitSupport=true                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  issue_33926.cy.js                                                               (1 of 1)


  issue 33926
    1) loads dashboard with subresources
    2) restores session and loads dashboard on second test


  0 passing
  2 failing

  1) issue 33926
       loads dashboard with subresources:
     CypressError: Timed out retrying after 5000ms: \`cy.wait()\` timed out waiting \`5000ms\` for the 1st request to the route: \`vueLibrary\`. No request ever occurred.

https://on.cypress.io/wait
      [stack trace lines]

  2) issue 33926
       restores session and loads dashboard on second test:
     CypressError: Timed out retrying after 5000ms: \`cy.wait()\` timed out waiting \`5000ms\` for the 1st request to the route: \`vueLibrary\`. No request ever occurred.

https://on.cypress.io/wait
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      2                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  2                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     issue_33926.cy.js                                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/issue_33926.cy.js/issue 33926 -- loads dashboar     (1280x720)
     d with subresources (failed).png                                                               
  -  /XXX/XXX/XXX/cypress/screenshots/issue_33926.cy.js/issue 33926 -- restores sessi     (1280x720)
     on and loads dashboard on second test (failed).png                                             


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  issue_33926.cy.js                        XX:XX        2        -        2        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        2        -        2        -        -  


`
