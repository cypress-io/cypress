exports['video compression 0 / does not compress'] = `
The use of Cypress.env() is deprecated and will be removed in a future major version of Cypress.

Cypress recommends migrating to the cy.env() command and disabling allowCypressEnv within your Cypress configuration.

The use of Cypress.env() will warn and throw an error when allowCypressEnv is explicitly set to false.

Read our Migration Guide for the allowCypressEnv configuration option, why Cypress.env() is deprecated, and how to migrate to cy.env(): https://on.cypress.io/cypress-env-migration.


====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (video_compression.cy.js)                                                  │
  │ Searched:   cypress/e2e/video_compression.cy.js                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  video_compression.cy.js                                                         (1 of 1)


  0 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        0                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     video_compression.cy.js                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Video output: /XXX/XXX/XXX/cypress/videos/video_compression.cy.js.mp4


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  video_compression.cy.js                  XX:XX        -        -        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        -        -        -        -        -  


`

exports['video compression true / coerces true to 32 CRF'] = `
The use of Cypress.env() is deprecated and will be removed in a future major version of Cypress.

Cypress recommends migrating to the cy.env() command and disabling allowCypressEnv within your Cypress configuration.

The use of Cypress.env() will warn and throw an error when allowCypressEnv is explicitly set to false.

Read our Migration Guide for the allowCypressEnv configuration option, why Cypress.env() is deprecated, and how to migrate to cy.env(): https://on.cypress.io/cypress-env-migration.


====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (video_compression.cy.js)                                                  │
  │ Searched:   cypress/e2e/video_compression.cy.js                                                │
  │ Params:     Tag: false, Group: false, Parallel: false                                          │
  │ Run URL:    https://dashboard.cypress.io/projects/cjvoj7/runs/12                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  video_compression.cy.js                                                         (1 of 1)
  Estimated: X second(s)


  0 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        0                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Estimated:    X second(s)                                                                      │
  │ Spec Ran:     video_compression.cy.js                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started compressing: Compressing to 32 CRF                                                     
  -  Finished compressing: X second(s)                                               

  -  Video output: /XXX/XXX/XXX/cypress/videos/video_compression.cy.js.mp4


  (Uploading Cloud Artifacts)

  - Video - 1 kB /XXX/XXX/XXX/cypress/videos/video_compression.cy.js.mp4
  - Screenshot - Nothing to upload 
  - Test Replay - Nothing to upload - Test Replay is disabled for this project. Enable Test Replay in Cloud project settings

  Uploading Cloud Artifacts: . . . . .

  (Uploaded Cloud Artifacts)

  - Video - Done Uploading 1 kB in Xm, Ys ZZ.ZZms 1/1 /XXX/XXX/XXX/cypress/videos/video_compression.cy.js.mp4

====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  video_compression.cy.js                  XX:XX        -        -        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        -        -        -        -        -  


───────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                       
  Recorded Run: https://dashboard.cypress.io/projects/cjvoj7/runs/12


`
