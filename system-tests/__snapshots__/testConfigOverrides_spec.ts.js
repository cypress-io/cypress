exports['testConfigOverrides / fails when passing invalid config value browser'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (invalid-browser.js)                                                       │
  │ Searched:   cypress/e2e/testConfigOverrides/invalid-browser.js                                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  invalid-browser.js                                                              (1 of 1)


  1) An uncaught error was detected outside of a test

  0 passing
  1 failing

  1) An uncaught error was detected outside of a test:
     CypressError: The following error originated from your test code, not from Cypress.

  > Test config value \`{ browser }\` must be passed a string, object, or an array. You passed: \`true\`

When Cypress detects uncaught errors originating from your test code it will automatically fail the current test.

Cypress could not associate this error to any specific test.

We dynamically generated a new test to display this failure.
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
  │ Spec Ran:     invalid-browser.js                                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/invalid-browser.js/An uncaught error was detect     (1280x720)
     ed outside of a test (failed).png                                                              


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  invalid-browser.js                       XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


`

exports['testConfigOverrides / fails when setting invalid config opt with Cypress.config() in before:test:run'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (invalid_before_test_event.js)                                             │
  │ Searched:   cypress/e2e/testConfigOverrides/invalid_before_test_event.js                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  invalid_before_test_event.js                                                    (1 of 1)


  1) does not run
  nested
    2) does not run 2


  0 passing
  2 failing

  1) does not run:
     Error: CypressError: \`Cypress.config()\` can never override \`chromeWebSecurity\` because it is a read-only configuration option.
      [stack trace lines]

  2) nested
       does not run 2:
     Error: CypressError: \`Cypress.config()\` can never override \`chromeWebSecurity\` because it is a read-only configuration option.
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
  │ Spec Ran:     invalid_before_test_event.js                                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/invalid_before_test_event.js/does not run (fail     (1280x720)
     ed).png                                                                                        
  -  /XXX/XXX/XXX/cypress/screenshots/invalid_before_test_event.js/nested -- does not     (1280x720)
      run 2 (failed).png                                                                            


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  invalid_before_test_event.js             XX:XX        2        -        2        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        2        -        2        -        -  


`

exports['testConfigOverrides / fails when setting invalid config opt with Cypress.config() in before:test:run:async'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (invalid_before_test_async_event.js)                                       │
  │ Searched:   cypress/e2e/testConfigOverrides/invalid_before_test_async_event.js                 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  invalid_before_test_async_event.js                                              (1 of 1)


  1) does not run
  nested
    2) does not run 2


  0 passing
  2 failing

  1) does not run:
     Error: CypressError: \`Cypress.config()\` can never override \`chromeWebSecurity\` because it is a read-only configuration option.
      [stack trace lines]

  2) nested
       does not run 2:
     Error: CypressError: \`Cypress.config()\` can never override \`chromeWebSecurity\` because it is a read-only configuration option.
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
  │ Spec Ran:     invalid_before_test_async_event.js                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/invalid_before_test_async_event.js/does not run     (1280x720)
      (failed).png                                                                                  
  -  /XXX/XXX/XXX/cypress/screenshots/invalid_before_test_async_event.js/nested -- do     (1280x720)
     es not run 2 (failed).png                                                                      


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  invalid_before_test_async_event.js       XX:XX        2        -        2        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        2        -        2        -        -  


`

exports['testConfigOverrides / fails when passing invalid config values - [chrome,electron]'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (invalid.js)                                                               │
  │ Searched:   cypress/e2e/testConfigOverrides/invalid.js                                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  invalid.js                                                                      (1 of 1)


  1) inline test config override throws error
  2) inline test config override throws error when executed within cy cmd
  3) throws error when invalid test-level override
  4) throws error when invalid config opt in Cypress.config() in test
  context config overrides throws error
    5) runs

  nested contexts overrides throws error at the correct line number
    6) 1st test fails on overrides
    7) 2nd test fails on overrides

  nested contexts 
    test override
      8) throws error at the correct line number
      ✓ does execute 2nd test

  throws error correctly when before hook
    9) "before all" hook for "test config override throws error"

  throws error correctly when beforeEach hook
    10) test config override throws error

  throws error when invalid config opt in Cypress.config() in before hook
    11) "before all" hook for "4"

  throws error when invalid config opt in Cypress.config() in beforeEach hook
    12) "before each" hook for "5"

  throws error when invalid config opt in Cypress.config() in after hook
    13) "after all" hook for "5"

  throws error when invalid config opt in Cypress.config() in afterEach hook
    14) "after each" hook for "5"


  1 passing
  14 failing

  1) inline test config override throws error:
     Error: Expected \`baseUrl\` to be a fully qualified URL (starting with \`http://\` or \`https://\`).

Instead the value was: \`""\`
      [stack trace lines]

  2) inline test config override throws error when executed within cy cmd:
     Error: Expected \`baseUrl\` to be a fully qualified URL (starting with \`http://\` or \`https://\`).

Instead the value was: \`"null"\`
      [stack trace lines]

  3) throws error when invalid test-level override:
     CypressError: The config passed to your test-level overrides has the following validation error:

CypressError: The \`testIsolation\` configuration can only be overridden from a suite-level override.

https://on.cypress.io/config
  Error
      [stack trace lines]

  4) throws error when invalid config opt in Cypress.config() in test:
     Error: CypressError: The \`testIsolation\` configuration can only be overridden from a suite-level override.
      [stack trace lines]

  5) context config overrides throws error
       runs:
     CypressError: The config passed to your suite-level overrides has the following validation error:

Expected \`retries\` to be a positive number or null or an object with keys "openMode" and "runMode" with values of numbers, booleans, or nulls, or experimental configuration with key "experimentalStrategy" with value "detect-flake-but-always-fail" or "detect-flake-and-pass-on-threshold" and key "experimentalOptions" to provide a valid configuration for your selected strategy.

Instead the value was: \`"1"\`

https://on.cypress.io/config
  Error
      [stack trace lines]

  6) nested contexts overrides throws error at the correct line number
       1st test fails on overrides:
     CypressError: The config passed to your suite-level overrides has the following validation error:

Expected \`defaultCommandTimeout\` to be a number.

Instead the value was: \`"500"\`

https://on.cypress.io/config
  Error
      [stack trace lines]

  7) nested contexts overrides throws error at the correct line number
       2nd test fails on overrides:
     CypressError: The config passed to your suite-level overrides has the following validation error:

Expected \`defaultCommandTimeout\` to be a number.

Instead the value was: \`"500"\`

https://on.cypress.io/config
  Error
      [stack trace lines]

  8) nested contexts 
       test override
         throws error at the correct line number:
     CypressError: The config passed to your test-level overrides has the following validation error:

Expected \`baseUrl\` to be a fully qualified URL (starting with \`http://\` or \`https://\`).

Instead the value was: \`"not_an_http_url"\`

https://on.cypress.io/config
  Error
      [stack trace lines]

  9) throws error correctly when before hook
       "before all" hook for "test config override throws error":
     CypressError: The config passed to your test-level overrides has the following validation error:

Expected \`retries\` to be a positive number or null or an object with keys "openMode" and "runMode" with values of numbers, booleans, or nulls, or experimental configuration with key "experimentalStrategy" with value "detect-flake-but-always-fail" or "detect-flake-and-pass-on-threshold" and key "experimentalOptions" to provide a valid configuration for your selected strategy.

Instead the value was: \`"1"\`

https://on.cypress.io/config

Because this error occurred during a \`before all\` hook we are skipping the remaining tests in the current suite: \`throws error correctly when...\`
  Error
      [stack trace lines]

  10) throws error correctly when beforeEach hook
       test config override throws error:
     CypressError: The config passed to your test-level overrides has the following validation error:

Expected \`retries\` to be a positive number or null or an object with keys "openMode" and "runMode" with values of numbers, booleans, or nulls, or experimental configuration with key "experimentalStrategy" with value "detect-flake-but-always-fail" or "detect-flake-and-pass-on-threshold" and key "experimentalOptions" to provide a valid configuration for your selected strategy.

Instead the value was: \`"1"\`

https://on.cypress.io/config
  Error
      [stack trace lines]

  11) throws error when invalid config opt in Cypress.config() in before hook
       "before all" hook for "4":
     Error: CypressError: The \`testIsolation\` configuration can only be overridden from a suite-level override.

Because this error occurred during a \`before all\` hook we are skipping the remaining tests in the current suite: \`throws error when invalid c...\`
      [stack trace lines]

  12) throws error when invalid config opt in Cypress.config() in beforeEach hook
       "before each" hook for "5":
     Error: CypressError: The \`testIsolation\` configuration can only be overridden from a suite-level override.

Because this error occurred during a \`before each\` hook we are skipping the remaining tests in the current suite: \`throws error when invalid c...\`
      [stack trace lines]

  13) throws error when invalid config opt in Cypress.config() in after hook
       "after all" hook for "5":
     Error: CypressError: The \`testIsolation\` configuration can only be overridden from a suite-level override.

Because this error occurred during a \`after all\` hook we are skipping the remaining tests in the current suite: \`throws error when invalid c...\`
      [stack trace lines]

  14) throws error when invalid config opt in Cypress.config() in afterEach hook
       "after each" hook for "5":
     Error: CypressError: The \`testIsolation\` configuration can only be overridden from a suite-level override.

Because this error occurred during a \`after each\` hook we are skipping the remaining tests in the current suite: \`throws error when invalid c...\`
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        15                                                                               │
  │ Passing:      1                                                                                │
  │ Failing:      14                                                                               │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  7                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     invalid.js                                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/invalid.js/inline test config override throws e     (1280x720)
     rror (failed).png                                                                              
  -  /XXX/XXX/XXX/cypress/screenshots/invalid.js/inline test config override throws e     (1280x720)
     rror when executed within cy cmd (failed).png                                                  
  -  /XXX/XXX/XXX/cypress/screenshots/invalid.js/throws error when invalid config opt     (1280x720)
      in Cypress.config() in test (failed).png                                                      
  -  /XXX/XXX/XXX/cypress/screenshots/invalid.js/throws error when invalid config opt     (1280x720)
      in Cypress.config() in before hook -- 4 -- before all hook (failed).png                       
  -  /XXX/XXX/XXX/cypress/screenshots/invalid.js/throws error when invalid config opt     (1280x720)
      in Cypress.config() in beforeEach hook -- 5 -- before each hook (failed).png                  
  -  /XXX/XXX/XXX/cypress/screenshots/invalid.js/throws error when invalid config opt     (1280x720)
      in Cypress.config() in after hook -- 5 -- after all hook (failed).png                         
  -  /XXX/XXX/XXX/cypress/screenshots/invalid.js/throws error when invalid config opt     (1280x720)
      in Cypress.config() in afterEach hook -- 5 -- after each hook (failed).png                    


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  invalid.js                               XX:XX       15        1       14        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX       15        1       14        -        -  


`

exports['testConfigOverrides / fails when passing invalid config values with beforeEach - [chrome,electron]'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (before-invalid.js)                                                        │
  │ Searched:   cypress/e2e/testConfigOverrides/before-invalid.js                                  │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  before-invalid.js                                                               (1 of 1)


  runs all tests
    1) inline test config override throws error
    2) inline test config override throws error when executed within cy cmd
    context config overrides throws error
      3) runs
    nested contexts overrides throws error at the correct line number
      4) 1st test fails on overrides
      5) 2nd test fails on overrides
    nested contexts 
      test override
        6) throws error at the correct line number
        ✓ does execute 2nd test
    throws error correctly when before hook
      7) "before all" hook for "test config override throws error"
    throws error correctly when beforeEach hook
      8) test config override throws error


  1 passing
  8 failing

  1) runs all tests
       inline test config override throws error:
     Error: Expected \`baseUrl\` to be a fully qualified URL (starting with \`http://\` or \`https://\`).

Instead the value was: \`""\`
      [stack trace lines]

  2) runs all tests
       inline test config override throws error when executed within cy cmd:
     Error: Expected \`baseUrl\` to be a fully qualified URL (starting with \`http://\` or \`https://\`).

Instead the value was: \`"null"\`
      [stack trace lines]

  3) runs all tests
       context config overrides throws error
         runs:
     CypressError: The config passed to your suite-level overrides has the following validation error:

Expected \`retries\` to be a positive number or null or an object with keys "openMode" and "runMode" with values of numbers, booleans, or nulls, or experimental configuration with key "experimentalStrategy" with value "detect-flake-but-always-fail" or "detect-flake-and-pass-on-threshold" and key "experimentalOptions" to provide a valid configuration for your selected strategy.

Instead the value was: \`"1"\`

https://on.cypress.io/config
  Error
      [stack trace lines]

  4) runs all tests
       nested contexts overrides throws error at the correct line number
         1st test fails on overrides:
     CypressError: The config passed to your suite-level overrides has the following validation error:

Expected \`defaultCommandTimeout\` to be a number.

Instead the value was: \`"500"\`

https://on.cypress.io/config
  Error
      [stack trace lines]

  5) runs all tests
       nested contexts overrides throws error at the correct line number
         2nd test fails on overrides:
     CypressError: The config passed to your suite-level overrides has the following validation error:

Expected \`defaultCommandTimeout\` to be a number.

Instead the value was: \`"500"\`

https://on.cypress.io/config
  Error
      [stack trace lines]

  6) runs all tests
       nested contexts 
         test override
           throws error at the correct line number:
     CypressError: The config passed to your test-level overrides has the following validation error:

Expected \`baseUrl\` to be a fully qualified URL (starting with \`http://\` or \`https://\`).

Instead the value was: \`"not_an_http_url"\`

https://on.cypress.io/config
  Error
      [stack trace lines]

  7) runs all tests
       throws error correctly when before hook
         "before all" hook for "test config override throws error":
     CypressError: The config passed to your test-level overrides has the following validation error:

Expected \`retries\` to be a positive number or null or an object with keys "openMode" and "runMode" with values of numbers, booleans, or nulls, or experimental configuration with key "experimentalStrategy" with value "detect-flake-but-always-fail" or "detect-flake-and-pass-on-threshold" and key "experimentalOptions" to provide a valid configuration for your selected strategy.

Instead the value was: \`"1"\`

https://on.cypress.io/config

Because this error occurred during a \`before all\` hook we are skipping the remaining tests in the current suite: \`throws error correctly when...\`
  Error
      [stack trace lines]

  8) runs all tests
       throws error correctly when beforeEach hook
         test config override throws error:
     CypressError: The config passed to your test-level overrides has the following validation error:

Expected \`retries\` to be a positive number or null or an object with keys "openMode" and "runMode" with values of numbers, booleans, or nulls, or experimental configuration with key "experimentalStrategy" with value "detect-flake-but-always-fail" or "detect-flake-and-pass-on-threshold" and key "experimentalOptions" to provide a valid configuration for your selected strategy.

Instead the value was: \`"1"\`

https://on.cypress.io/config
  Error
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        9                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      8                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  2                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     before-invalid.js                                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/before-invalid.js/runs all tests -- inline test     (1280x720)
      config override throws error (failed).png                                                     
  -  /XXX/XXX/XXX/cypress/screenshots/before-invalid.js/runs all tests -- inline test     (1280x720)
      config override throws error when executed within cy cmd (failed).png                         


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  before-invalid.js                        XX:XX        9        1        8        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        9        1        8        -        -  


`

exports['testConfigOverrides / correctly fails when invalid config values for it.only [chrome,electron]'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (only-invalid.js)                                                          │
  │ Searched:   cypress/e2e/testConfigOverrides/only-invalid.js                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  only-invalid.js                                                                 (1 of 1)


  nested contexts 
    test override
      1) throws error at the correct line number


  0 passing
  1 failing

  1) nested contexts 
       test override
         throws error at the correct line number:
     CypressError: The config passed to your suite-level overrides has the following validation error:

Expected \`retries\` to be a positive number or null or an object with keys "openMode" and "runMode" with values of numbers, booleans, or nulls, or experimental configuration with key "experimentalStrategy" with value "detect-flake-but-always-fail" or "detect-flake-and-pass-on-threshold" and key "experimentalOptions" to provide a valid configuration for your selected strategy.

Instead the value was: \`"1"\`

https://on.cypress.io/config
  Error
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     only-invalid.js                                                                  │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  only-invalid.js                          XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


`

exports['testConfigOverrides / successfully runs valid suite-level-only overrides'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (valid-suite-only.js)                                                      │
  │ Searched:   cypress/e2e/testConfigOverrides/valid-suite-only.js                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  valid-suite-only.js                                                             (1 of 1)


  suite-level-only overrides run as expected
    ✓ 1st test passes
    ✓ 2nd test passes
    ✓ 3rd test passes

  nested contexts 
    nested suite-level-only overrides run as expected
      ✓ 1st test passes
      ✓ 2nd test passes
      ✓ 3rd test passes


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
  │ Spec Ran:     valid-suite-only.js                                                              │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  valid-suite-only.js                      XX:XX        6        6        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        6        6        -        -        -  


`

exports['testConfigOverrides / has originalTitle when skipped due to browser config'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (skip-browser.js)                                                          │
  │ Searched:   cypress/e2e/testConfigOverrides/skip-browser.js                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  skip-browser.js                                                                 (1 of 1)


  suite
    - is skipped due to test-level browser override (skipped due to browser)

  suite 2 (skipped due to browser)
    - is skipped due to suite-level browser override


  0 passing
  2 pending


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      2                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     skip-browser.js                                                                  │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  skip-browser.js                          XX:XX        2        -        -        2        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        -        -        2        -  


`

exports['testConfigOverrides / maintains runnable body when skipped due to browser config'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (skip-browser.js)                                                          │
  │ Searched:   cypress/e2e/testConfigOverrides/skip-browser.js                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  skip-browser.js                                                                 (1 of 1)


  suite
    - is skipped due to test-level browser override (skipped due to browser)

  suite 2 (skipped due to browser)
    - is skipped due to suite-level browser override


  0 passing
  2 pending


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      2                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     skip-browser.js                                                                  │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  skip-browser.js                          XX:XX        2        -        -        2        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        2        -        -        2        -  


`

exports['testConfigOverrides / fails when passing invalid config values - [firefox]'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (invalid.js)                                                               │
  │ Searched:   cypress/e2e/testConfigOverrides/invalid.js                                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  invalid.js                                                                      (1 of 1)


  1) inline test config override throws error
  2) inline test config override throws error when executed within cy cmd
  3) throws error when invalid test-level override
  4) throws error when invalid config opt in Cypress.config() in test
  context config overrides throws error
    5) runs

  nested contexts overrides throws error at the correct line number
    6) 1st test fails on overrides
    7) 2nd test fails on overrides

  nested contexts 
    test override
      8) throws error at the correct line number
      ✓ does execute 2nd test

  throws error correctly when before hook
    9) "before all" hook for "test config override throws error"

  throws error correctly when beforeEach hook
    10) test config override throws error

  throws error when invalid config opt in Cypress.config() in before hook
    11) "before all" hook for "4"

  throws error when invalid config opt in Cypress.config() in beforeEach hook
    12) "before each" hook for "5"

  throws error when invalid config opt in Cypress.config() in after hook
    13) "after all" hook for "5"

  throws error when invalid config opt in Cypress.config() in afterEach hook
    14) "after each" hook for "5"


  1 passing
  14 failing

  1) inline test config override throws error:
     Error: Expected \`baseUrl\` to be a fully qualified URL (starting with \`http://\` or \`https://\`).

Instead the value was: \`""\`
      [stack trace lines]

  2) inline test config override throws error when executed within cy cmd:
     Error: Expected \`baseUrl\` to be a fully qualified URL (starting with \`http://\` or \`https://\`).

Instead the value was: \`"null"\`
      [stack trace lines]

  3) throws error when invalid test-level override:
     CypressError: The config passed to your test-level overrides has the following validation error:

CypressError: The \`testIsolation\` configuration can only be overridden from a suite-level override.

https://on.cypress.io/config
      [stack trace lines]

  4) throws error when invalid config opt in Cypress.config() in test:
     Error: CypressError: The \`testIsolation\` configuration can only be overridden from a suite-level override.
      [stack trace lines]

  5) context config overrides throws error
       runs:
     CypressError: The config passed to your suite-level overrides has the following validation error:

Expected \`retries\` to be a positive number or null or an object with keys "openMode" and "runMode" with values of numbers, booleans, or nulls, or experimental configuration with key "experimentalStrategy" with value "detect-flake-but-always-fail" or "detect-flake-and-pass-on-threshold" and key "experimentalOptions" to provide a valid configuration for your selected strategy.

Instead the value was: \`"1"\`

https://on.cypress.io/config
      [stack trace lines]

  6) nested contexts overrides throws error at the correct line number
       1st test fails on overrides:
     CypressError: The config passed to your suite-level overrides has the following validation error:

Expected \`defaultCommandTimeout\` to be a number.

Instead the value was: \`"500"\`

https://on.cypress.io/config
      [stack trace lines]

  7) nested contexts overrides throws error at the correct line number
       2nd test fails on overrides:
     CypressError: The config passed to your suite-level overrides has the following validation error:

Expected \`defaultCommandTimeout\` to be a number.

Instead the value was: \`"500"\`

https://on.cypress.io/config
      [stack trace lines]

  8) nested contexts 
       test override
         throws error at the correct line number:
     CypressError: The config passed to your test-level overrides has the following validation error:

Expected \`baseUrl\` to be a fully qualified URL (starting with \`http://\` or \`https://\`).

Instead the value was: \`"not_an_http_url"\`

https://on.cypress.io/config
      [stack trace lines]

  9) throws error correctly when before hook
       "before all" hook for "test config override throws error":
     CypressError: The config passed to your test-level overrides has the following validation error:

Expected \`retries\` to be a positive number or null or an object with keys "openMode" and "runMode" with values of numbers, booleans, or nulls, or experimental configuration with key "experimentalStrategy" with value "detect-flake-but-always-fail" or "detect-flake-and-pass-on-threshold" and key "experimentalOptions" to provide a valid configuration for your selected strategy.

Instead the value was: \`"1"\`

https://on.cypress.io/config

Because this error occurred during a \`before all\` hook we are skipping the remaining tests in the current suite: \`throws error correctly when...\`
      [stack trace lines]

  10) throws error correctly when beforeEach hook
       test config override throws error:
     CypressError: The config passed to your test-level overrides has the following validation error:

Expected \`retries\` to be a positive number or null or an object with keys "openMode" and "runMode" with values of numbers, booleans, or nulls, or experimental configuration with key "experimentalStrategy" with value "detect-flake-but-always-fail" or "detect-flake-and-pass-on-threshold" and key "experimentalOptions" to provide a valid configuration for your selected strategy.

Instead the value was: \`"1"\`

https://on.cypress.io/config
      [stack trace lines]

  11) throws error when invalid config opt in Cypress.config() in before hook
       "before all" hook for "4":
     Error: CypressError: The \`testIsolation\` configuration can only be overridden from a suite-level override.

Because this error occurred during a \`before all\` hook we are skipping the remaining tests in the current suite: \`throws error when invalid c...\`
      [stack trace lines]

  12) throws error when invalid config opt in Cypress.config() in beforeEach hook
       "before each" hook for "5":
     Error: CypressError: The \`testIsolation\` configuration can only be overridden from a suite-level override.

Because this error occurred during a \`before each\` hook we are skipping the remaining tests in the current suite: \`throws error when invalid c...\`
      [stack trace lines]

  13) throws error when invalid config opt in Cypress.config() in after hook
       "after all" hook for "5":
     Error: CypressError: The \`testIsolation\` configuration can only be overridden from a suite-level override.

Because this error occurred during a \`after all\` hook we are skipping the remaining tests in the current suite: \`throws error when invalid c...\`
      [stack trace lines]

  14) throws error when invalid config opt in Cypress.config() in afterEach hook
       "after each" hook for "5":
     Error: CypressError: The \`testIsolation\` configuration can only be overridden from a suite-level override.

Because this error occurred during a \`after each\` hook we are skipping the remaining tests in the current suite: \`throws error when invalid c...\`
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        15                                                                               │
  │ Passing:      1                                                                                │
  │ Failing:      14                                                                               │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  7                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     invalid.js                                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/invalid.js/inline test config override throws e     (1280x720)
     rror (failed).png                                                                              
  -  /XXX/XXX/XXX/cypress/screenshots/invalid.js/inline test config override throws e     (1280x720)
     rror when executed within cy cmd (failed).png                                                  
  -  /XXX/XXX/XXX/cypress/screenshots/invalid.js/throws error when invalid config opt     (1280x720)
      in Cypress.config() in test (failed).png                                                      
  -  /XXX/XXX/XXX/cypress/screenshots/invalid.js/throws error when invalid config opt     (1280x720)
      in Cypress.config() in before hook -- 4 -- before all hook (failed).png                       
  -  /XXX/XXX/XXX/cypress/screenshots/invalid.js/throws error when invalid config opt     (1280x720)
      in Cypress.config() in beforeEach hook -- 5 -- before each hook (failed).png                  
  -  /XXX/XXX/XXX/cypress/screenshots/invalid.js/throws error when invalid config opt     (1280x720)
      in Cypress.config() in after hook -- 5 -- after all hook (failed).png                         
  -  /XXX/XXX/XXX/cypress/screenshots/invalid.js/throws error when invalid config opt     (1280x720)
      in Cypress.config() in afterEach hook -- 5 -- after each hook (failed).png                    


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  invalid.js                               XX:XX       15        1       14        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX       15        1       14        -        -  


`

exports['testConfigOverrides / fails when passing invalid config values with beforeEach - [firefox]'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (before-invalid.js)                                                        │
  │ Searched:   cypress/e2e/testConfigOverrides/before-invalid.js                                  │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  before-invalid.js                                                               (1 of 1)


  runs all tests
    1) inline test config override throws error
    2) inline test config override throws error when executed within cy cmd
    context config overrides throws error
      3) runs
    nested contexts overrides throws error at the correct line number
      4) 1st test fails on overrides
      5) 2nd test fails on overrides
    nested contexts 
      test override
        6) throws error at the correct line number
        ✓ does execute 2nd test
    throws error correctly when before hook
      7) "before all" hook for "test config override throws error"
    throws error correctly when beforeEach hook
      8) test config override throws error


  1 passing
  8 failing

  1) runs all tests
       inline test config override throws error:
     Error: Expected \`baseUrl\` to be a fully qualified URL (starting with \`http://\` or \`https://\`).

Instead the value was: \`""\`
      [stack trace lines]

  2) runs all tests
       inline test config override throws error when executed within cy cmd:
     Error: Expected \`baseUrl\` to be a fully qualified URL (starting with \`http://\` or \`https://\`).

Instead the value was: \`"null"\`
      [stack trace lines]

  3) runs all tests
       context config overrides throws error
         runs:
     CypressError: The config passed to your suite-level overrides has the following validation error:

Expected \`retries\` to be a positive number or null or an object with keys "openMode" and "runMode" with values of numbers, booleans, or nulls, or experimental configuration with key "experimentalStrategy" with value "detect-flake-but-always-fail" or "detect-flake-and-pass-on-threshold" and key "experimentalOptions" to provide a valid configuration for your selected strategy.

Instead the value was: \`"1"\`

https://on.cypress.io/config
      [stack trace lines]

  4) runs all tests
       nested contexts overrides throws error at the correct line number
         1st test fails on overrides:
     CypressError: The config passed to your suite-level overrides has the following validation error:

Expected \`defaultCommandTimeout\` to be a number.

Instead the value was: \`"500"\`

https://on.cypress.io/config
      [stack trace lines]

  5) runs all tests
       nested contexts overrides throws error at the correct line number
         2nd test fails on overrides:
     CypressError: The config passed to your suite-level overrides has the following validation error:

Expected \`defaultCommandTimeout\` to be a number.

Instead the value was: \`"500"\`

https://on.cypress.io/config
      [stack trace lines]

  6) runs all tests
       nested contexts 
         test override
           throws error at the correct line number:
     CypressError: The config passed to your test-level overrides has the following validation error:

Expected \`baseUrl\` to be a fully qualified URL (starting with \`http://\` or \`https://\`).

Instead the value was: \`"not_an_http_url"\`

https://on.cypress.io/config
      [stack trace lines]

  7) runs all tests
       throws error correctly when before hook
         "before all" hook for "test config override throws error":
     CypressError: The config passed to your test-level overrides has the following validation error:

Expected \`retries\` to be a positive number or null or an object with keys "openMode" and "runMode" with values of numbers, booleans, or nulls, or experimental configuration with key "experimentalStrategy" with value "detect-flake-but-always-fail" or "detect-flake-and-pass-on-threshold" and key "experimentalOptions" to provide a valid configuration for your selected strategy.

Instead the value was: \`"1"\`

https://on.cypress.io/config

Because this error occurred during a \`before all\` hook we are skipping the remaining tests in the current suite: \`throws error correctly when...\`
      [stack trace lines]

  8) runs all tests
       throws error correctly when beforeEach hook
         test config override throws error:
     CypressError: The config passed to your test-level overrides has the following validation error:

Expected \`retries\` to be a positive number or null or an object with keys "openMode" and "runMode" with values of numbers, booleans, or nulls, or experimental configuration with key "experimentalStrategy" with value "detect-flake-but-always-fail" or "detect-flake-and-pass-on-threshold" and key "experimentalOptions" to provide a valid configuration for your selected strategy.

Instead the value was: \`"1"\`

https://on.cypress.io/config
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        9                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      8                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  2                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     before-invalid.js                                                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/before-invalid.js/runs all tests -- inline test     (1280x720)
      config override throws error (failed).png                                                     
  -  /XXX/XXX/XXX/cypress/screenshots/before-invalid.js/runs all tests -- inline test     (1280x720)
      config override throws error when executed within cy cmd (failed).png                         


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  before-invalid.js                        XX:XX        9        1        8        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        9        1        8        -        -  


`

exports['testConfigOverrides / correctly fails when invalid config values for it.only [firefox]'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (only-invalid.js)                                                          │
  │ Searched:   cypress/e2e/testConfigOverrides/only-invalid.js                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  only-invalid.js                                                                 (1 of 1)


  nested contexts 
    test override
      1) throws error at the correct line number


  0 passing
  1 failing

  1) nested contexts 
       test override
         throws error at the correct line number:
     CypressError: The config passed to your suite-level overrides has the following validation error:

Expected \`retries\` to be a positive number or null or an object with keys "openMode" and "runMode" with values of numbers, booleans, or nulls, or experimental configuration with key "experimentalStrategy" with value "detect-flake-but-always-fail" or "detect-flake-and-pass-on-threshold" and key "experimentalOptions" to provide a valid configuration for your selected strategy.

Instead the value was: \`"1"\`

https://on.cypress.io/config
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     only-invalid.js                                                                  │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  only-invalid.js                          XX:XX        1        -        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        1        -        1        -        -  


`

exports['testConfigOverrides / experimental retries specific behavior / fails when attempting to set experimental retries as override [chrome,electron]'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (override-with-experimental-retries.cy.js)                                 │
  │ Searched:   cypress/e2e/override-with-experimental-retries.cy.js                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  override-with-experimental-retries.cy.js                                        (1 of 1)


  overriding legacy retries with experimental retries
    at the describe level
      1) sets the config
    at the test level
      2) sets the config


  0 passing
  2 failing

  1) overriding legacy retries with experimental retries
       at the describe level
         sets the config:
     CypressError: The config passed to your suite-level overrides has the following validation error:

CypressError: The \`retries.experimentalStrategy\` configuration can only be set globally.

https://on.cypress.io/config
  Error
      [stack trace lines]

  2) overriding legacy retries with experimental retries
       at the test level
         sets the config:
     CypressError: The config passed to your test-level overrides has the following validation error:

CypressError: The \`retries.experimentalStrategy\` configuration can only be set globally.

https://on.cypress.io/config
  Error
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      2                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     override-with-experimental-retries.cy.js                                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  override-with-experimental-retries.      XX:XX        2        -        2        -        - │
  │    cy.js                                                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        2        -        2        -        -  


`

exports['testConfigOverrides / experimental retries specific behavior / succeeds when setting legacy retries as an override to experimental retries [chrome,electron]'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (override-with-legacy-retries.cy.js)                                       │
  │ Searched:   cypress/e2e/override-with-legacy-retries.cy.js                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  override-with-legacy-retries.cy.js                                              (1 of 1)


  overriding experimental retries with legacy retries
    ✓ sets the config


  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     override-with-legacy-retries.cy.js                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  override-with-legacy-retries.cy.js       XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`

exports['testConfigOverrides / experimental retries specific behavior / fails when attempting to set experimental retries as override [firefox]'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (override-with-experimental-retries.cy.js)                                 │
  │ Searched:   cypress/e2e/override-with-experimental-retries.cy.js                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  override-with-experimental-retries.cy.js                                        (1 of 1)


  overriding legacy retries with experimental retries
    at the describe level
      1) sets the config
    at the test level
      2) sets the config


  0 passing
  2 failing

  1) overriding legacy retries with experimental retries
       at the describe level
         sets the config:
     CypressError: The config passed to your suite-level overrides has the following validation error:

CypressError: The \`retries.experimentalStrategy\` configuration can only be set globally.

https://on.cypress.io/config
      [stack trace lines]

  2) overriding legacy retries with experimental retries
       at the test level
         sets the config:
     CypressError: The config passed to your test-level overrides has the following validation error:

CypressError: The \`retries.experimentalStrategy\` configuration can only be set globally.

https://on.cypress.io/config
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      0                                                                                │
  │ Failing:      2                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     override-with-experimental-retries.cy.js                                         │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  override-with-experimental-retries.      XX:XX        2        -        2        -        - │
  │    cy.js                                                                                       │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        2        -        2        -        -  


`

exports['testConfigOverrides / experimental retries specific behavior / succeeds when setting legacy retries as an override to experimental retries [firefox]'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (override-with-legacy-retries.cy.js)                                       │
  │ Searched:   cypress/e2e/override-with-legacy-retries.cy.js                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  override-with-legacy-retries.cy.js                                              (1 of 1)


  overriding experimental retries with legacy retries
    ✓ sets the config


  1 passing


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        1                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     override-with-legacy-retries.cy.js                                               │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  override-with-legacy-retries.cy.js       XX:XX        1        1        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        XX:XX        1        1        -        -        -  


`
