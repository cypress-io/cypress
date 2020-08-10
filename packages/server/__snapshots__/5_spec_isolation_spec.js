exports['e2e spec isolation fails'] = {
  "startedTestsAt": "2018-02-01T20:14:19.323Z",
  "endedTestsAt": "2018-02-01T20:14:19.323Z",
  "totalDuration": 5555,
  "totalSuites": 8,
  "totalTests": 12,
  "totalFailed": 5,
  "totalPassed": 5,
  "totalPending": 1,
  "totalSkipped": 1,
  "runs": [
    {
      "stats": {
        "suites": 5,
        "tests": 6,
        "passes": 1,
        "pending": 1,
        "skipped": 1,
        "failures": 3,
        "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
        "wallClockEndedAt": "2018-02-01T20:14:19.323Z",
        "wallClockDuration": 1234
      },
      "reporter": "spec",
      "reporterStats": {
        "suites": 5,
        "tests": 5,
        "passes": 1,
        "pending": 1,
        "failures": 3,
        "start": "2018-02-01T20:14:19.323Z",
        "end": "2018-02-01T20:14:19.323Z",
        "duration": 1234
      },
      "hooks": [
        {
          "hookId": "h1",
          "hookName": "before each",
          "title": [
            "\"before each\" hook"
          ],
          "body": "function() {\n      throw new Error(\"fail1\");\n    }"
        },
        {
          "hookId": "h2",
          "hookName": "after each",
          "title": [
            "\"after each\" hook"
          ],
          "body": "function() {\n      throw new Error(\"fail2\");\n    }"
        },
        {
          "hookId": "h3",
          "hookName": "after all",
          "title": [
            "\"after all\" hook"
          ],
          "body": "function() {\n      throw new Error(\"fail3\");\n    }"
        }
      ],
      "tests": [
        {
          "testId": "r4",
          "title": [
            "simple failing hook spec",
            "beforeEach hooks",
            "never gets here"
          ],
          "state": "failed",
          "body": "function() {}",
          "displayError": "Error: fail1\n\nBecause this error occurred during a `before each` hook we are skipping the remaining tests in the current suite: `beforeEach hooks`\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fail1\n\nBecause this error occurred during a `before each` hook we are skipping the remaining tests in the current suite: `beforeEach hooks`",
                "stack": "[stack trace lines]"
              },
              "timings": {
                "lifecycle": 100,
                "before each": [
                  {
                    "hookId": "h1",
                    "fnDuration": 400,
                    "afterFnDuration": 200
                  }
                ]
              },
              "failedFromHookId": "h1",
              "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
              "wallClockDuration": 1234,
              "videoTimestamp": 9999
            }
          ]
        },
        {
          "testId": "r6",
          "title": [
            "simple failing hook spec",
            "pending",
            "is pending"
          ],
          "state": "pending",
          "body": "",
          "displayError": null,
          "attempts": [
            {
              "state": "pending",
              "error": null,
              "timings": null,
              "failedFromHookId": null,
              "wallClockStartedAt": null,
              "wallClockDuration": null,
              "videoTimestamp": null
            }
          ]
        },
        {
          "testId": "r8",
          "title": [
            "simple failing hook spec",
            "afterEach hooks",
            "runs this"
          ],
          "state": "failed",
          "body": "function() {}",
          "displayError": "Error: fail2\n\nBecause this error occurred during a `after each` hook we are skipping the remaining tests in the current suite: `afterEach hooks`\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fail2\n\nBecause this error occurred during a `after each` hook we are skipping the remaining tests in the current suite: `afterEach hooks`",
                "stack": "[stack trace lines]"
              },
              "timings": {
                "lifecycle": 100,
                "test": {
                  "fnDuration": 400,
                  "afterFnDuration": 200
                },
                "after each": [
                  {
                    "hookId": "h2",
                    "fnDuration": 400,
                    "afterFnDuration": 200
                  }
                ]
              },
              "failedFromHookId": "h2",
              "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
              "wallClockDuration": 1234,
              "videoTimestamp": 9999
            }
          ]
        },
        {
          "testId": "r9",
          "title": [
            "simple failing hook spec",
            "afterEach hooks",
            "does not run this"
          ],
          "state": "skipped",
          "body": "function() {}",
          "displayError": null,
          "attempts": [
            {
              "state": "skipped",
              "error": null,
              "timings": null,
              "failedFromHookId": null,
              "wallClockStartedAt": null,
              "wallClockDuration": null,
              "videoTimestamp": null
            }
          ]
        },
        {
          "testId": "r11",
          "title": [
            "simple failing hook spec",
            "after hooks",
            "runs this"
          ],
          "state": "passed",
          "body": "function() {}",
          "displayError": null,
          "attempts": [
            {
              "state": "passed",
              "error": null,
              "timings": {
                "lifecycle": 100,
                "test": {
                  "fnDuration": 400,
                  "afterFnDuration": 200
                }
              },
              "failedFromHookId": null,
              "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
              "wallClockDuration": 1234,
              "videoTimestamp": 9999
            }
          ]
        },
        {
          "testId": "r12",
          "title": [
            "simple failing hook spec",
            "after hooks",
            "fails on this"
          ],
          "state": "failed",
          "body": "function() {}",
          "displayError": "Error: fail3\n\nBecause this error occurred during a `after all` hook we are skipping the remaining tests in the current suite: `after hooks`\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fail3\n\nBecause this error occurred during a `after all` hook we are skipping the remaining tests in the current suite: `after hooks`",
                "stack": "[stack trace lines]"
              },
              "timings": {
                "lifecycle": 100,
                "test": {
                  "fnDuration": 400,
                  "afterFnDuration": 200
                },
                "after all": [
                  {
                    "hookId": "h3",
                    "fnDuration": 400,
                    "afterFnDuration": 200
                  }
                ]
              },
              "failedFromHookId": "h3",
              "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
              "wallClockDuration": 1234,
              "videoTimestamp": 9999
            }
          ]
        }
      ],
      "error": null,
      "video": "/foo/bar/.projects/e2e/cypress/videos/simple_failing_hook_spec.coffee.mp4",
      "screenshots": [
        {
          "screenshotId": "some-random-id",
          "name": null,
          "testId": "r4",
          "testAttemptIndex": 0,
          "takenAt": "2018-02-01T20:14:19.323Z",
          "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- beforeEach hooks -- never gets here -- before each hook (failed).png",
          "height": 720,
          "width": 1280
        },
        {
          "screenshotId": "some-random-id",
          "name": null,
          "testId": "r8",
          "testAttemptIndex": 0,
          "takenAt": "2018-02-01T20:14:19.323Z",
          "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- afterEach hooks -- runs this -- after each hook (failed).png",
          "height": 720,
          "width": 1280
        },
        {
          "screenshotId": "some-random-id",
          "name": null,
          "testId": "r12",
          "testAttemptIndex": 0,
          "takenAt": "2018-02-01T20:14:19.323Z",
          "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- after hooks -- fails on this -- after all hook (failed).png",
          "height": 720,
          "width": 1280
        }
      ],
      "spec": {
        "name": "simple_failing_hook_spec.coffee",
        "relative": "cypress/integration/simple_failing_hook_spec.coffee",
        "absolute": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_hook_spec.coffee",
        "specType": "integration"
      },
      "shouldUploadVideo": true
    },
    {
      "stats": {
        "suites": 1,
        "tests": 2,
        "passes": 0,
        "pending": 0,
        "skipped": 0,
        "failures": 2,
        "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
        "wallClockEndedAt": "2018-02-01T20:14:19.323Z",
        "wallClockDuration": 1234
      },
      "reporter": "spec",
      "reporterStats": {
        "suites": 1,
        "tests": 2,
        "passes": 0,
        "pending": 0,
        "failures": 2,
        "start": "2018-02-01T20:14:19.323Z",
        "end": "2018-02-01T20:14:19.323Z",
        "duration": 1234
      },
      "hooks": [],
      "tests": [
        {
          "testId": "r3",
          "title": [
            "simple failing spec",
            "fails1"
          ],
          "state": "failed",
          "body": "function() {\n    return cy.wrap(true, {\n      timeout: 100\n    }).should(\"be.false\");\n  }",
          "displayError": "AssertionError: Timed out retrying: expected true to be false\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "AssertionError",
                "message": "Timed out retrying: expected true to be false",
                "stack": "[stack trace lines]"
              },
              "timings": {
                "lifecycle": 100,
                "test": {
                  "fnDuration": 400,
                  "afterFnDuration": 200
                }
              },
              "failedFromHookId": null,
              "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
              "wallClockDuration": 1234,
              "videoTimestamp": 9999
            }
          ]
        },
        {
          "testId": "r4",
          "title": [
            "simple failing spec",
            "fails2"
          ],
          "state": "failed",
          "body": "function() {\n    throw new Error(\"fails2\");\n  }",
          "displayError": "Error: fails2\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fails2",
                "stack": "[stack trace lines]"
              },
              "timings": {
                "lifecycle": 100,
                "test": {
                  "fnDuration": 400,
                  "afterFnDuration": 200
                }
              },
              "failedFromHookId": null,
              "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
              "wallClockDuration": 1234,
              "videoTimestamp": 9999
            }
          ]
        }
      ],
      "error": null,
      "video": "/foo/bar/.projects/e2e/cypress/videos/simple_failing_spec.coffee.mp4",
      "screenshots": [
        {
          "screenshotId": "some-random-id",
          "name": null,
          "testId": "r3",
          "testAttemptIndex": 0,
          "takenAt": "2018-02-01T20:14:19.323Z",
          "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_spec.coffee/simple failing spec -- fails1 (failed).png",
          "height": 720,
          "width": 1280
        },
        {
          "screenshotId": "some-random-id",
          "name": null,
          "testId": "r4",
          "testAttemptIndex": 0,
          "takenAt": "2018-02-01T20:14:19.323Z",
          "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_spec.coffee/simple failing spec -- fails2 (failed).png",
          "height": 720,
          "width": 1280
        }
      ],
      "spec": {
        "name": "simple_failing_spec.coffee",
        "relative": "cypress/integration/simple_failing_spec.coffee",
        "absolute": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_spec.coffee",
        "specType": "integration"
      },
      "shouldUploadVideo": true
    },
    {
      "stats": {
        "suites": 1,
        "tests": 3,
        "passes": 3,
        "pending": 0,
        "skipped": 0,
        "failures": 0,
        "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
        "wallClockEndedAt": "2018-02-01T20:14:19.323Z",
        "wallClockDuration": 1234
      },
      "reporter": "spec",
      "reporterStats": {
        "suites": 1,
        "tests": 3,
        "passes": 3,
        "pending": 0,
        "failures": 0,
        "start": "2018-02-01T20:14:19.323Z",
        "end": "2018-02-01T20:14:19.323Z",
        "duration": 1234
      },
      "hooks": [
        {
          "hookId": "h1",
          "hookName": "before all",
          "title": [
            "\"before all\" hook"
          ],
          "body": "function() {\n    return cy.wait(100);\n  }"
        },
        {
          "hookId": "h2",
          "hookName": "before each",
          "title": [
            "\"before each\" hook"
          ],
          "body": "function() {\n    return cy.wait(200);\n  }"
        },
        {
          "hookId": "h4",
          "hookName": "after each",
          "title": [
            "\"after each\" hook"
          ],
          "body": "function() {\n    return cy.wait(200);\n  }"
        },
        {
          "hookId": "h3",
          "hookName": "after all",
          "title": [
            "\"after all\" hook"
          ],
          "body": "function() {\n    return cy.wait(100);\n  }"
        }
      ],
      "tests": [
        {
          "testId": "r3",
          "title": [
            "simple hooks spec",
            "t1"
          ],
          "state": "passed",
          "body": "function() {\n    return cy.wrap(\"t1\").should(\"eq\", \"t1\");\n  }",
          "displayError": null,
          "attempts": [
            {
              "state": "passed",
              "error": null,
              "timings": {
                "lifecycle": 100,
                "before all": [
                  {
                    "hookId": "h1",
                    "fnDuration": 400,
                    "afterFnDuration": 200
                  }
                ],
                "before each": [
                  {
                    "hookId": "h2",
                    "fnDuration": 400,
                    "afterFnDuration": 200
                  }
                ],
                "test": {
                  "fnDuration": 400,
                  "afterFnDuration": 200
                },
                "after each": [
                  {
                    "hookId": "h4",
                    "fnDuration": 400,
                    "afterFnDuration": 200
                  }
                ]
              },
              "failedFromHookId": null,
              "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
              "wallClockDuration": 1234,
              "videoTimestamp": 9999
            }
          ]
        },
        {
          "testId": "r4",
          "title": [
            "simple hooks spec",
            "t2"
          ],
          "state": "passed",
          "body": "function() {\n    return cy.wrap(\"t2\").should(\"eq\", \"t2\");\n  }",
          "displayError": null,
          "attempts": [
            {
              "state": "passed",
              "error": null,
              "timings": {
                "lifecycle": 100,
                "before each": [
                  {
                    "hookId": "h2",
                    "fnDuration": 400,
                    "afterFnDuration": 200
                  }
                ],
                "test": {
                  "fnDuration": 400,
                  "afterFnDuration": 200
                },
                "after each": [
                  {
                    "hookId": "h4",
                    "fnDuration": 400,
                    "afterFnDuration": 200
                  }
                ]
              },
              "failedFromHookId": null,
              "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
              "wallClockDuration": 1234,
              "videoTimestamp": 9999
            }
          ]
        },
        {
          "testId": "r5",
          "title": [
            "simple hooks spec",
            "t3"
          ],
          "state": "passed",
          "body": "function() {\n    return cy.wrap(\"t3\").should(\"eq\", \"t3\");\n  }",
          "displayError": null,
          "attempts": [
            {
              "state": "passed",
              "error": null,
              "timings": {
                "lifecycle": 100,
                "before each": [
                  {
                    "hookId": "h2",
                    "fnDuration": 400,
                    "afterFnDuration": 200
                  }
                ],
                "test": {
                  "fnDuration": 400,
                  "afterFnDuration": 200
                },
                "after each": [
                  {
                    "hookId": "h4",
                    "fnDuration": 400,
                    "afterFnDuration": 200
                  }
                ],
                "after all": [
                  {
                    "hookId": "h3",
                    "fnDuration": 400,
                    "afterFnDuration": 200
                  }
                ]
              },
              "failedFromHookId": null,
              "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
              "wallClockDuration": 1234,
              "videoTimestamp": 9999
            }
          ]
        }
      ],
      "error": null,
      "video": "/foo/bar/.projects/e2e/cypress/videos/simple_hooks_spec.coffee.mp4",
      "screenshots": [],
      "spec": {
        "name": "simple_hooks_spec.coffee",
        "relative": "cypress/integration/simple_hooks_spec.coffee",
        "absolute": "/foo/bar/.projects/e2e/cypress/integration/simple_hooks_spec.coffee",
        "specType": "integration"
      },
      "shouldUploadVideo": true
    },
    {
      "stats": {
        "suites": 1,
        "tests": 1,
        "passes": 1,
        "pending": 0,
        "skipped": 0,
        "failures": 0,
        "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
        "wallClockEndedAt": "2018-02-01T20:14:19.323Z",
        "wallClockDuration": 1234
      },
      "reporter": "spec",
      "reporterStats": {
        "suites": 1,
        "tests": 1,
        "passes": 1,
        "pending": 0,
        "failures": 0,
        "start": "2018-02-01T20:14:19.323Z",
        "end": "2018-02-01T20:14:19.323Z",
        "duration": 1234
      },
      "hooks": [
        {
          "hookId": "h1",
          "hookName": "before each",
          "title": [
            "\"before each\" hook"
          ],
          "body": "function() {\n    return cy.wait(1000);\n  }"
        }
      ],
      "tests": [
        {
          "testId": "r3",
          "title": [
            "simple passing spec",
            "passes"
          ],
          "state": "passed",
          "body": "function() {\n    return cy.wrap(true).should(\"be.true\");\n  }",
          "displayError": null,
          "attempts": [
            {
              "state": "passed",
              "error": null,
              "timings": {
                "lifecycle": 100,
                "before each": [
                  {
                    "hookId": "h1",
                    "fnDuration": 400,
                    "afterFnDuration": 200
                  }
                ],
                "test": {
                  "fnDuration": 400,
                  "afterFnDuration": 200
                }
              },
              "failedFromHookId": null,
              "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
              "wallClockDuration": 1234,
              "videoTimestamp": 9999
            }
          ]
        }
      ],
      "error": null,
      "video": "/foo/bar/.projects/e2e/cypress/videos/simple_passing_spec.coffee.mp4",
      "screenshots": [],
      "spec": {
        "name": "simple_passing_spec.coffee",
        "relative": "cypress/integration/simple_passing_spec.coffee",
        "absolute": "/foo/bar/.projects/e2e/cypress/integration/simple_passing_spec.coffee",
        "specType": "integration"
      },
      "shouldUploadVideo": true
    }
  ],
  "browserPath": "path/to/browser",
  "browserName": "FooBrowser",
  "browserVersion": "88",
  "osName": "FooOS",
  "osVersion": "1234",
  "cypressVersion": "9.9.9",
  "config": {}
}

exports['e2e spec_isolation / failing with retries enabled'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      1 found (simple_failing_hook_spec.coffee)                                          │
  │ Searched:   cypress/integration/simple_failing_hook_spec.coffee                                │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  simple_failing_hook_spec.coffee                                                 (1 of 1)


  simple failing hook spec
    beforeEach hooks
      (Attempt 1 of 2) never gets here
      1) "before each" hook for "never gets here"
    pending
      - is pending
    afterEach hooks
      (Attempt 1 of 2) runs this
      2) "after each" hook for "runs this"
    after hooks
      ✓ runs this
      3) "after all" hook for "fails on this"


  1 passing
  1 pending
  3 failing

  1) simple failing hook spec
       beforeEach hooks
         "before each" hook for "never gets here":
     Error: fail1

Because this error occurred during a \`before each\` hook we are skipping the remaining tests in the current suite: \`beforeEach hooks\`
      [stack trace lines]

  2) simple failing hook spec
       afterEach hooks
         "after each" hook for "runs this":
     Error: fail2

Because this error occurred during a \`after each\` hook we are skipping the remaining tests in the current suite: \`afterEach hooks\`
      [stack trace lines]

  3) simple failing hook spec
       after hooks
         "after all" hook for "fails on this":
     Error: fail3

Because this error occurred during a \`after all\` hook we are skipping the remaining tests in the current suite: \`after hooks\`

Although you have test retries enabled, we do not retry tests when \`before all\` or \`after all\` hooks fail
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        6                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      3                                                                                │
  │ Pending:      1                                                                                │
  │ Skipped:      1                                                                                │
  │ Screenshots:  5                                                                                │
  │ Video:        true                                                                             │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     simple_failing_hook_spec.coffee                                                  │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing      (1280x720)
     hook spec -- beforeEach hooks -- never gets here (failed).png                                  
  -  /XXX/XXX/XXX/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing      (1280x720)
     hook spec -- beforeEach hooks -- never gets here -- before each hook (failed) (a               
     ttempt 2).png                                                                                  
  -  /XXX/XXX/XXX/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing      (1280x720)
     hook spec -- afterEach hooks -- runs this -- after each hook (failed).png                      
  -  /XXX/XXX/XXX/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing      (1280x720)
     hook spec -- afterEach hooks -- runs this -- after each hook (failed) (attempt 2               
     ).png                                                                                          
  -  /XXX/XXX/XXX/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing      (1280x720)
     hook spec -- after hooks -- fails on this -- after all hook (failed).png                       


  (Video)

  -  Started processing:  Compressing to 32 CRF                                                     
  -  Finished processing: /XXX/XXX/XXX/cypress/videos/simple_failing_hook_spec.coffee     (X second)
                          .mp4                                                                      


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  simple_failing_hook_spec.coffee          XX:XX        6        1        3        1        1 │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  1 of 1 failed (100%)                     XX:XX        6        1        3        1        1  


`

exports['failing with retries enabled'] = {
  "startedTestsAt": "2018-02-01T20:14:19.323Z",
  "endedTestsAt": "2018-02-01T20:14:19.323Z",
  "totalDuration": 5555,
  "totalSuites": 5,
  "totalTests": 6,
  "totalFailed": 3,
  "totalPassed": 1,
  "totalPending": 1,
  "totalSkipped": 1,
  "runs": [
    {
      "stats": {
        "suites": 5,
        "tests": 6,
        "passes": 1,
        "pending": 1,
        "skipped": 1,
        "failures": 3,
        "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
        "wallClockEndedAt": "2018-02-01T20:14:19.323Z",
        "wallClockDuration": 1234
      },
      "reporter": "spec",
      "reporterStats": {
        "suites": 5,
        "tests": 5,
        "passes": 1,
        "pending": 1,
        "failures": 3,
        "start": "2018-02-01T20:14:19.323Z",
        "end": "2018-02-01T20:14:19.323Z",
        "duration": 1234
      },
      "hooks": [
        {
          "hookId": "h1",
          "hookName": "before each",
          "title": [
            "\"before each\" hook"
          ],
          "body": "function() {\n      throw new Error(\"fail1\");\n    }"
        },
        {
          "hookId": "h2",
          "hookName": "after each",
          "title": [
            "\"after each\" hook"
          ],
          "body": "function() {\n      throw new Error(\"fail2\");\n    }"
        },
        {
          "hookId": "h3",
          "hookName": "after all",
          "title": [
            "\"after all\" hook"
          ],
          "body": "function() {\n      throw new Error(\"fail3\");\n    }"
        }
      ],
      "tests": [
        {
          "testId": "r4",
          "title": [
            "simple failing hook spec",
            "beforeEach hooks",
            "never gets here"
          ],
          "state": "failed",
          "body": "function() {}",
          "displayError": "Error: fail1\n\nBecause this error occurred during a `before each` hook we are skipping the remaining tests in the current suite: `beforeEach hooks`\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fail1\n\nBecause this error occurred during a `before each` hook we are skipping the remaining tests in the current suite: `beforeEach hooks`",
                "stack": "[stack trace lines]"
              },
              "timings": {
                "lifecycle": 100,
                "before each": [
                  {
                    "hookId": "h1",
                    "fnDuration": 400,
                    "afterFnDuration": 200
                  }
                ]
              },
              "failedFromHookId": "h1",
              "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
              "wallClockDuration": 1234,
              "videoTimestamp": 9999
            },
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fail1",
                "stack": "[stack trace lines]"
              },
              "timings": {
                "lifecycle": 100,
                "before each": [
                  {
                    "hookId": "h1",
                    "fnDuration": 400,
                    "afterFnDuration": 200
                  }
                ],
                "test": {
                  "fnDuration": 400,
                  "afterFnDuration": 200
                }
              },
              "failedFromHookId": "h1",
              "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
              "wallClockDuration": 1234,
              "videoTimestamp": 9999
            }
          ]
        },
        {
          "testId": "r6",
          "title": [
            "simple failing hook spec",
            "pending",
            "is pending"
          ],
          "state": "pending",
          "body": "",
          "displayError": null,
          "attempts": [
            {
              "state": "pending",
              "error": null,
              "timings": null,
              "failedFromHookId": null,
              "wallClockStartedAt": null,
              "wallClockDuration": null,
              "videoTimestamp": null
            }
          ]
        },
        {
          "testId": "r8",
          "title": [
            "simple failing hook spec",
            "afterEach hooks",
            "runs this"
          ],
          "state": "failed",
          "body": "function() {}",
          "displayError": "Error: fail2\n\nBecause this error occurred during a `after each` hook we are skipping the remaining tests in the current suite: `afterEach hooks`\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fail2\n\nBecause this error occurred during a `after each` hook we are skipping the remaining tests in the current suite: `afterEach hooks`",
                "stack": "[stack trace lines]"
              },
              "timings": {
                "lifecycle": 100,
                "test": {
                  "fnDuration": 400,
                  "afterFnDuration": 200
                },
                "after each": [
                  {
                    "hookId": "h2",
                    "fnDuration": 400,
                    "afterFnDuration": 200
                  }
                ]
              },
              "failedFromHookId": "h2",
              "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
              "wallClockDuration": 1234,
              "videoTimestamp": 9999
            },
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fail2",
                "stack": "[stack trace lines]"
              },
              "timings": {
                "lifecycle": 100,
                "test": {
                  "fnDuration": 400,
                  "afterFnDuration": 200
                },
                "after each": [
                  {
                    "hookId": "h2",
                    "fnDuration": 400,
                    "afterFnDuration": 200
                  }
                ]
              },
              "failedFromHookId": "h2",
              "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
              "wallClockDuration": 1234,
              "videoTimestamp": 9999
            }
          ]
        },
        {
          "testId": "r9",
          "title": [
            "simple failing hook spec",
            "afterEach hooks",
            "does not run this"
          ],
          "state": "skipped",
          "body": "function() {}",
          "displayError": null,
          "attempts": [
            {
              "state": "skipped",
              "error": null,
              "timings": null,
              "failedFromHookId": null,
              "wallClockStartedAt": null,
              "wallClockDuration": null,
              "videoTimestamp": null
            }
          ]
        },
        {
          "testId": "r11",
          "title": [
            "simple failing hook spec",
            "after hooks",
            "runs this"
          ],
          "state": "passed",
          "body": "function() {}",
          "displayError": null,
          "attempts": [
            {
              "state": "passed",
              "error": null,
              "timings": {
                "lifecycle": 100,
                "test": {
                  "fnDuration": 400,
                  "afterFnDuration": 200
                }
              },
              "failedFromHookId": null,
              "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
              "wallClockDuration": 1234,
              "videoTimestamp": 9999
            }
          ]
        },
        {
          "testId": "r12",
          "title": [
            "simple failing hook spec",
            "after hooks",
            "fails on this"
          ],
          "state": "failed",
          "body": "function() {}",
          "displayError": "Error: fail3\n\nBecause this error occurred during a `after all` hook we are skipping the remaining tests in the current suite: `after hooks`\n\nAlthough you have test retries enabled, we do not retry tests when `before all` or `after all` hooks fail\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fail3\n\nBecause this error occurred during a `after all` hook we are skipping the remaining tests in the current suite: `after hooks`\n\nAlthough you have test retries enabled, we do not retry tests when `before all` or `after all` hooks fail",
                "stack": "[stack trace lines]"
              },
              "timings": {
                "lifecycle": 100,
                "test": {
                  "fnDuration": 400,
                  "afterFnDuration": 200
                },
                "after all": [
                  {
                    "hookId": "h3",
                    "fnDuration": 400,
                    "afterFnDuration": 200
                  }
                ]
              },
              "failedFromHookId": "h3",
              "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
              "wallClockDuration": 1234,
              "videoTimestamp": 9999
            }
          ]
        }
      ],
      "error": null,
      "video": "/foo/bar/.projects/e2e/cypress/videos/simple_failing_hook_spec.coffee.mp4",
      "screenshots": [
        {
          "screenshotId": "some-random-id",
          "name": null,
          "testId": "r4",
          "testAttemptIndex": 0,
          "takenAt": "2018-02-01T20:14:19.323Z",
          "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- beforeEach hooks -- never gets here (failed).png",
          "height": 720,
          "width": 1280
        },
        {
          "screenshotId": "some-random-id",
          "name": null,
          "testId": "r4",
          "testAttemptIndex": 1,
          "takenAt": "2018-02-01T20:14:19.323Z",
          "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- beforeEach hooks -- never gets here -- before each hook (failed) (attempt 2).png",
          "height": 720,
          "width": 1280
        },
        {
          "screenshotId": "some-random-id",
          "name": null,
          "testId": "r8",
          "testAttemptIndex": 0,
          "takenAt": "2018-02-01T20:14:19.323Z",
          "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- afterEach hooks -- runs this -- after each hook (failed).png",
          "height": 720,
          "width": 1280
        },
        {
          "screenshotId": "some-random-id",
          "name": null,
          "testId": "r8",
          "testAttemptIndex": 1,
          "takenAt": "2018-02-01T20:14:19.323Z",
          "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- afterEach hooks -- runs this -- after each hook (failed) (attempt 2).png",
          "height": 720,
          "width": 1280
        },
        {
          "screenshotId": "some-random-id",
          "name": null,
          "testId": "r12",
          "testAttemptIndex": 0,
          "takenAt": "2018-02-01T20:14:19.323Z",
          "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- after hooks -- fails on this -- after all hook (failed).png",
          "height": 720,
          "width": 1280
        }
      ],
      "spec": {
        "name": "simple_failing_hook_spec.coffee",
        "relative": "cypress/integration/simple_failing_hook_spec.coffee",
        "absolute": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_hook_spec.coffee",
        "specType": "integration"
      },
      "shouldUploadVideo": true
    }
  ],
  "browserPath": "path/to/browser",
  "browserName": "FooBrowser",
  "browserVersion": "88",
  "osName": "FooOS",
  "osVersion": "1234",
  "cypressVersion": "9.9.9",
  "config": {}
}
