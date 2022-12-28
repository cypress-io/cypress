exports['e2e experimentalUseDefaultDocumentDomain=true / passes'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:      1.2.3                                                                            │
  │ Browser:      FooBrowser 88                                                                    │
  │ Specs:        1 found (experimental_use_default_document_domain.cy.ts)                         │
  │ Searched:     cypress/e2e/experimental_use_default_document_domain.cy.ts                       │
  │ Experiments:  experimentalUseDefaultDocumentDomain=true                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  experimental_use_default_document_domain.cy.ts                                  (1 of 1)


  expected behavior when experimentalUseDefaultDocumentDomain=true
    ✓ Handles cross-site/cross-origin navigation the same way without the experimental flag enabled
    ✓ errors appropriately when doing a sub domain navigation w/o cy.origin()
    ✓ allows sub-domain navigations with the use of cy.origin()


  3 passing

Warning: We failed processing this video.

This error will not alter the exit code.

TimeoutError: operation timed out
      [stack trace lines]


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        3                                                                                │
  │ Passing:      3                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     experimental_use_default_document_domain.cy.ts                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  experimental_use_default_document_d      XX:XX        3        3        -        -        - │
  │    omain.cy.ts                                                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        3        3        -        -        -  


`
