exports['e2e experimentalUseDefaultDocumentDomain=true / passes'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:      1.2.3                                                                            │
  │ Browser:      FooBrowser 88                                                                    │
  │ Specs:        1 found (experimental_use_default_document_domain.cy.ts)                         │
  │ Searched:     cypress/e2e/experimental_use_default_document_domain.cy.ts                       │
  │ Experiments:  experimentalUseDefaultDocumentDomain=*.foobar.com                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  experimental_use_default_document_domain.cy.ts                                  (1 of 1)


  expected behavior when experimentalUseDefaultDocumentDomain=true
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
  │ Spec Ran:     experimental_use_default_document_domain.cy.ts                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/experimental_use_default_docume     (X second)
                          nt_domain.cy.ts.mp4                                                       


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  experimental_use_default_document_d      XX:XX        3        3        -        -        - │
  │    omain.cy.ts                                                                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        3        3        -        -        -  


`
