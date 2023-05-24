exports['e2e experimentalCspAllowList=true / experimentalCspAllowList=true / strips out [\'script-src-elem\', \'script-src\', \'default-src\'] directives'] = `

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
    content-security-policy directive script-src-elem should be stripped and
      ✓  regardless of nonces/hashes
    content-security-policy directive script-src should be stripped and
      ✓  regardless of nonces/hashes
    content-security-policy directive default-src should be stripped and
      ✓  regardless of nonces/hashes


  3 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        3                                                                                │
  │ Passing:      3                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     with_allow_list_true.cy.ts                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  with_allow_list_true.cy.ts               XX:XX        3        3        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        3        3        -        -        -  


`

exports['e2e experimentalCspAllowList=true / experimentalCspAllowList=true / always strips known problematic directives and is passive with known working directives'] = `

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
    allowed
      ✓ sample: style-src is not stripped
      ✓ sample: upgrade-insecure-requests is not stripped


  4 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        4                                                                                │
  │ Passing:      4                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     with_allow_list_custom_or_true.cy.ts                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  with_allow_list_custom_or_true.cy.t      XX:XX        4        4        -        -        - │
  │    s                                                                                           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        4        4        -        -        -  


`

exports['e2e experimentalCspAllowList=true / experimentalCspAllowList=[\'script-src-elem\', \'script-src\', \'default-src\'] / works with [\'script-src-elem\', \'script-src\', \'default-src\'] directives'] = `

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
  │ Video:        true                                                                             │
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

exports['e2e experimentalCspAllowList=true / experimentalCspAllowList=[\'script-src-elem\', \'script-src\', \'default-src\'] / always strips known problematic directives and is passive with known working directives'] = `

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
    allowed
      ✓ sample: style-src is not stripped
      ✓ sample: upgrade-insecure-requests is not stripped


  4 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        4                                                                                │
  │ Passing:      4                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     with_allow_list_custom_or_true.cy.ts                                             │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  with_allow_list_custom_or_true.cy.t      XX:XX        4        4        -        -        - │
  │    s                                                                                           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        4        4        -        -        -  


`
