exports['e2e interception spec character encodings does not mangle non-UTF-8 text 1'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (character_encoding_spec.js)                                               │
  │ Searched:   cypress/integration/character_encoding_spec.js                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  character_encoding_spec.js                                                      (1 of 1)


  character encoding tests
    without gzip
      ✓ iso-8859-1 works
      ✓ euc-kr works
      ✓ shift-jis works
      ✓ gb2312 works
    with gzip
      ✓ iso-8859-1 works
      ✓ euc-kr works
      ✓ shift-jis works
      ✓ gb2312 works
    without gzip (no content-type charset)
      ✓ iso-8859-1 works
      ✓ euc-kr works
      ✓ shift-jis works
      ✓ gb2312 works
    with gzip (no content-type charset)
      ✓ iso-8859-1 works
      ✓ euc-kr works
      ✓ shift-jis works
      ✓ gb2312 works


  16 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        16                                                                               │
  │ Passing:      16                                                                               │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     character_encoding_spec.js                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/character_encoding_spec.js.mp4      (X second)


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  character_encoding_spec.js               XX:XX       16       16        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX       16       16        -        -        -  


`
