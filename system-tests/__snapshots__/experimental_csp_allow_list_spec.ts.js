exports['e2e experimentalCspAllowList / experimentalCspAllowList=[\'script-src-elem\', \'script-src\', \'default-src\', \'form-action\'] / works with [\'script-src-elem\', \'script-src\', \'default-src\'] directives'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (with_allow_list_custom.cy.ts)                                             │
  │ Searched:   cypress/e2e/experimental_csp_allow_list_spec/with_allow_list_custom.cy.ts          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  with_allow_list_custom.cy.ts                                                    (1 of 1)


  experimentalCspAllowList=['script-src-elem', 'script-src', 'default-src']
    content-security-policy directive script-src-elem should not be stripped and
      ✓ allows Cypress to run, including configured inline nonces/hashes
      ✓ allows Cypress to run, but doesn't allow none configured inline scripts
    content-security-policy directive script-src should not be stripped and
      ✓ allows Cypress to run, including configured inline nonces/hashes
      ✓ allows Cypress to run, but doesn't allow none configured inline scripts
    content-security-policy directive default-src should not be stripped and
      ✓ allows Cypress to run, including configured inline nonces/hashes
      ✓ allows Cypress to run, but doesn't allow none configured inline scripts


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
  │ Spec Ran:     with_allow_list_custom.cy.ts                                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  with_allow_list_custom.cy.ts             XX:XX        6        6        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        6        6        -        -        -  


`

exports['e2e experimentalCspAllowList / experimentalCspAllowList=true / strips out [\'script-src-elem\', \'script-src\', \'default-src\', \'form-action\'] directives'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (with_allow_list_true.cy.ts)                                               │
  │ Searched:   cypress/e2e/experimental_csp_allow_list_spec/with_allow_list_true.cy.ts            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  with_allow_list_true.cy.ts                                                      (1 of 1)


  experimentalCspAllowList=true
    ✓ passes on inline form action
    content-security-policy directive script-src-elem should be stripped and
      ✓  regardless of nonces/hashes
    content-security-policy directive script-src should be stripped and
      ✓  regardless of nonces/hashes
    content-security-policy directive default-src should be stripped and
      ✓  regardless of nonces/hashes


  4 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        4                                                                                │
  │ Passing:      4                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     with_allow_list_true.cy.ts                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  with_allow_list_true.cy.ts               XX:XX        4        4        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        4        4        -        -        -  


`

exports['e2e experimentalCspAllowList / experimentalCspAllowList=true / always strips known problematic directives and is passive with known working directives'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (with_allow_list_custom_or_true.cy.ts)                                     │
  │ Searched:   cypress/e2e/experimental_csp_allow_list_spec/with_allow_list_custom_or_true.cy.ts  │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  with_allow_list_custom_or_true.cy.ts                                            (1 of 1)


  experimentalCspAllowList is custom or true
    disallowed
      ✓ frame-ancestors are always stripped
      ✓ trusted-types & require-trusted-types-for are always stripped
      ✓ sandbox is always stripped
      ✓ navigate-to is always stripped
    allowed
      ✓ sample: style-src is not stripped
      ✓ sample: upgrade-insecure-requests is not stripped


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
  │ Spec Ran:     with_allow_list_custom_or_true.cy.ts                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  with_allow_list_custom_or_true.cy.t      XX:XX        6        6        -        -        - │
  │    s                                                                                           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        6        6        -        -        -  


`

exports['e2e experimentalCspAllowList / experimentalCspAllowList=[\'script-src-elem\', \'script-src\', \'default-src\', \'form-action\'] / always strips known problematic directives and is passive with known working directives'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (with_allow_list_custom_or_true.cy.ts)                                     │
  │ Searched:   cypress/e2e/experimental_csp_allow_list_spec/with_allow_list_custom_or_true.cy.ts  │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  with_allow_list_custom_or_true.cy.ts                                            (1 of 1)


  experimentalCspAllowList is custom or true
    disallowed
      ✓ frame-ancestors are always stripped
      ✓ trusted-types & require-trusted-types-for are always stripped
      ✓ sandbox is always stripped
      ✓ navigate-to is always stripped
    allowed
      ✓ sample: style-src is not stripped
      ✓ sample: upgrade-insecure-requests is not stripped


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
  │ Spec Ran:     with_allow_list_custom_or_true.cy.ts                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  with_allow_list_custom_or_true.cy.t      XX:XX        6        6        -        -        - │
  │    s                                                                                           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        6        6        -        -        -  


`

exports['e2e experimentalCspAllowList / experimentalCspAllowList=[\'script-src-elem\', \'script-src\', \'default-src\', \'form-action\'] / works with [\'form-action\'] directives'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (form_action_with_allow_list_custom.cy.ts)                                 │
  │ Searched:   cypress/e2e/experimental_csp_allow_list_spec/form_action_with_allow_list_custom.cy │
  │             .ts                                                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  form_action_with_allow_list_custom.cy.ts                                        (1 of 1)


  experimentalCspAllowList=['script-src-elem', 'script-src', 'default-src']
    1) fails on inline form action


  0 passing
  1 failing

  1) experimentalCspAllowList=['script-src-elem', 'script-src', 'default-src']
       fails on inline form action:
     CypressError: Timed out after waiting \`1000ms\` for your remote page to load.

Your page did not fire its \`load\` event within \`1000ms\`.

You can try increasing the \`pageLoadTimeout\` value in \`cypress.config.js\` to wait longer.

Browsers will not fire the \`load\` event until all stylesheets and scripts are done downloading.

When this \`load\` event occurs, Cypress will continue running commands.
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
  │ Spec Ran:     form_action_with_allow_list_custom.cy.ts                                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/form_action_with_allow_list_custom.cy.ts/experi     (1280x720)
     mentalCspAllowList=['script-src-elem', 'script-src', 'default-src'] -- fails on                
     inline form action (failed).png                                                                


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  form_action_with_allow_list_custom.      XX:XX        1        -        1        -        - │
  │    cy.ts                                                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


`
