exports['e2e multi domain errors / captures the stack trace correctly for multi-domain errors to point users to their "cy.origin" callback'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (multi_domain_error_spec.ts)                                               │
  │ Searched:   cypress/integration/multi_domain_error_spec.ts                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────

  Running:  multi_domain_error_spec.ts                                                      (1 of 1)


  multi-domain
    1) tries to find an element that doesn't exist and fails


  0 passing
  1 failing

  1) multi-domain
       tries to find an element that doesn't exist and fails:
     AssertionError: Timed out retrying after 1000ms: Expected to find element: \`#doesnotexist\`, but never found it.
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
  │ Spec Ran:     multi_domain_error_spec.ts                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/multi_domain_error_spec.ts/multi-domain -- trie     (1280x720)
     s to find an element that doesn't exist and fails (failed).png


  (Video)

  -  Started processing:  Compressing to 32 CRF
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/multi_domain_error_spec.ts.mp4      (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  multi_domain_error_spec.ts               XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -


`
