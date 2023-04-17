exports['e2e experimentalSkipDomainInjection=true / passes'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:      1.2.3                                                                            │
  │ Browser:      FooBrowser 88                                                                    │
  │ Specs:        1 found (experimental_skip_domain_injection.cy.ts)                               │
  │ Searched:     cypress/e2e/experimental_skip_domain_injection.cy.ts                             │
  │ Experiments:  experimentalSkipDomainInjection=*.foobar.com                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  experimental_skip_domain_injection.cy.ts                                        (1 of 1)


  expected behavior when experimentalSkipDomainInjection=true
    ✓ Handles cross-site/cross-origin navigation the same way without the experimental flag enabled
    ✓ errors appropriately when doing a sub domain navigation w/o cy.origin()
    ✓ allows sub-domain navigations with the use of cy.origin()


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
  │ Spec Ran:     experimental_skip_domain_injection.cy.ts                                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  experimental_skip_domain_injection.      XX:XX        3        3        -        -        - │
  │    cy.ts                                                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        3        3        -        -        -  


`
