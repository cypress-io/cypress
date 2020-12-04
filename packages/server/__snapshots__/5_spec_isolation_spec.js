exports['e2e spec_isolation / failing with retries enabled'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      2 found (simple_failing_hook_spec.coffee, simple_retrying_spec.js)                 │
  │ Searched:   cypress/integration/simple_failing_hook_spec.coffee, cypress/integration/simple_re │
  │             trying_spec.js                                                                     │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  simple_failing_hook_spec.coffee                                                 (1 of 2)


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
  │ Video:        false                                                                            │
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


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  simple_retrying_spec.js                                                         (2 of 2)


  simple retrying spec
    (Attempt 1 of 2) t1
    1) t1
    ✓ t2


  1 passing
  1 failing

  1) simple retrying spec
       t1:
     Error: t1 attempt #1
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  2                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     simple_retrying_spec.js                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/simple_retrying_spec.js/simple retrying spec --     (1280x720)
      t1 (failed).png                                                                               
  -  /XXX/XXX/XXX/cypress/screenshots/simple_retrying_spec.js/simple retrying spec --     (1280x720)
      t1 (failed) (attempt 2).png                                                                   


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  simple_failing_hook_spec.coffee          XX:XX        6        1        3        1        1 │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  simple_retrying_spec.js                  XX:XX        2        1        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  2 of 2 failed (100%)                     XX:XX        8        2        4        1        1  


`

exports['e2e spec_isolation fails [electron] 1'] = {
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
        "duration": 1234,
        "startedAt": "2018-02-01T20:14:19.323Z",
        "endedAt": "2018-02-01T20:14:19.323Z"
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
          "hookName": "before each",
          "title": [
            "\"before each\" hook"
          ],
          "body": "function() {\n      throw new Error(\"fail1\");\n    }"
        },
        {
          "hookName": "after each",
          "title": [
            "\"after each\" hook"
          ],
          "body": "function() {\n      throw new Error(\"fail2\");\n    }"
        },
        {
          "hookName": "after all",
          "title": [
            "\"after all\" hook"
          ],
          "body": "function() {\n      throw new Error(\"fail3\");\n    }"
        }
      ],
      "tests": [
        {
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
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 4,
                  "column": 13,
                  "originalFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "relativeFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_hook_spec.coffee",
                  "frame": "  2 |   context \"beforeEach hooks\", ->\n  3 |     beforeEach ->\n> 4 |       throw new Error(\"fail1\")\n    |             ^\n  5 | \n  6 |     it \"never gets here\", ->\n  7 | ",
                  "language": "coffee"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- beforeEach hooks -- never gets here -- before each hook (failed).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            }
          ]
        },
        {
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
              "videoTimestamp": null,
              "duration": null,
              "startedAt": null,
              "screenshots": []
            }
          ]
        },
        {
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
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 13,
                  "column": 13,
                  "originalFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "relativeFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_hook_spec.coffee",
                  "frame": "  11 |   context \"afterEach hooks\", ->\n  12 |     afterEach ->\n> 13 |       throw new Error(\"fail2\")\n     |             ^\n  14 | \n  15 |     it \"runs this\", ->\n  16 | ",
                  "language": "coffee"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- afterEach hooks -- runs this -- after each hook (failed).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            }
          ]
        },
        {
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
              "videoTimestamp": null,
              "duration": null,
              "startedAt": null,
              "screenshots": []
            }
          ]
        },
        {
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
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": []
            }
          ]
        },
        {
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
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 21,
                  "column": 13,
                  "originalFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "relativeFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_hook_spec.coffee",
                  "frame": "  19 |   context \"after hooks\", ->\n  20 |     after ->\n> 21 |       throw new Error(\"fail3\")\n     |             ^\n  22 | \n  23 |     it \"runs this\", ->\n  24 | ",
                  "language": "coffee"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- after hooks -- fails on this -- after all hook (failed).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            }
          ]
        }
      ],
      "error": null,
      "video": null,
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
        "duration": 1234,
        "startedAt": "2018-02-01T20:14:19.323Z",
        "endedAt": "2018-02-01T20:14:19.323Z"
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
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 3,
                  "column": 35,
                  "originalFile": "cypress/integration/simple_failing_spec.coffee",
                  "relativeFile": "cypress/integration/simple_failing_spec.coffee",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_spec.coffee",
                  "frame": "  1 | describe \"simple failing spec\", ->\n  2 |   it \"fails1\", ->\n> 3 |     cy.wrap(true, {timeout: 100}).should(\"be.false\")\n    |                                   ^\n  4 | \n  5 |   it \"fails2\", ->\n  6 |     throw new Error(\"fails2\")",
                  "language": "coffee"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_spec.coffee/simple failing spec -- fails1 (failed).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            }
          ]
        },
        {
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
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 6,
                  "column": 11,
                  "originalFile": "cypress/integration/simple_failing_spec.coffee",
                  "relativeFile": "cypress/integration/simple_failing_spec.coffee",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_spec.coffee",
                  "frame": "  4 | \n  5 |   it \"fails2\", ->\n> 6 |     throw new Error(\"fails2\")\n    |           ^",
                  "language": "coffee"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_spec.coffee/simple failing spec -- fails2 (failed).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            }
          ]
        }
      ],
      "error": null,
      "video": null,
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
        "duration": 1234,
        "startedAt": "2018-02-01T20:14:19.323Z",
        "endedAt": "2018-02-01T20:14:19.323Z"
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
          "hookName": "before all",
          "title": [
            "\"before all\" hook"
          ],
          "body": "function() {\n    return cy.wait(100);\n  }"
        },
        {
          "hookName": "before each",
          "title": [
            "\"before each\" hook"
          ],
          "body": "function() {\n    return cy.wait(200);\n  }"
        },
        {
          "hookName": "after each",
          "title": [
            "\"after each\" hook"
          ],
          "body": "function() {\n    return cy.wait(200);\n  }"
        },
        {
          "hookName": "after all",
          "title": [
            "\"after all\" hook"
          ],
          "body": "function() {\n    return cy.wait(100);\n  }"
        }
      ],
      "tests": [
        {
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
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": []
            }
          ]
        },
        {
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
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": []
            }
          ]
        },
        {
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
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": []
            }
          ]
        }
      ],
      "error": null,
      "video": null,
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
        "duration": 1234,
        "startedAt": "2018-02-01T20:14:19.323Z",
        "endedAt": "2018-02-01T20:14:19.323Z"
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
          "hookName": "before each",
          "title": [
            "\"before each\" hook"
          ],
          "body": "function() {\n    return cy.wait(1000);\n  }"
        }
      ],
      "tests": [
        {
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
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": []
            }
          ]
        }
      ],
      "error": null,
      "video": null,
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
  "config": {},
  "status": "finished"
}

exports['e2e spec_isolation fails [chrome] 1'] = {
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
        "duration": 1234,
        "startedAt": "2018-02-01T20:14:19.323Z",
        "endedAt": "2018-02-01T20:14:19.323Z"
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
          "hookName": "before each",
          "title": [
            "\"before each\" hook"
          ],
          "body": "function() {\n      throw new Error(\"fail1\");\n    }"
        },
        {
          "hookName": "after each",
          "title": [
            "\"after each\" hook"
          ],
          "body": "function() {\n      throw new Error(\"fail2\");\n    }"
        },
        {
          "hookName": "after all",
          "title": [
            "\"after all\" hook"
          ],
          "body": "function() {\n      throw new Error(\"fail3\");\n    }"
        }
      ],
      "tests": [
        {
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
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 4,
                  "column": 13,
                  "originalFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "relativeFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_hook_spec.coffee",
                  "frame": "  2 |   context \"beforeEach hooks\", ->\n  3 |     beforeEach ->\n> 4 |       throw new Error(\"fail1\")\n    |             ^\n  5 | \n  6 |     it \"never gets here\", ->\n  7 | ",
                  "language": "coffee"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- beforeEach hooks -- never gets here -- before each hook (failed).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            }
          ]
        },
        {
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
              "videoTimestamp": null,
              "duration": null,
              "startedAt": null,
              "screenshots": []
            }
          ]
        },
        {
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
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 13,
                  "column": 13,
                  "originalFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "relativeFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_hook_spec.coffee",
                  "frame": "  11 |   context \"afterEach hooks\", ->\n  12 |     afterEach ->\n> 13 |       throw new Error(\"fail2\")\n     |             ^\n  14 | \n  15 |     it \"runs this\", ->\n  16 | ",
                  "language": "coffee"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- afterEach hooks -- runs this -- after each hook (failed).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            }
          ]
        },
        {
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
              "videoTimestamp": null,
              "duration": null,
              "startedAt": null,
              "screenshots": []
            }
          ]
        },
        {
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
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": []
            }
          ]
        },
        {
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
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 21,
                  "column": 13,
                  "originalFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "relativeFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_hook_spec.coffee",
                  "frame": "  19 |   context \"after hooks\", ->\n  20 |     after ->\n> 21 |       throw new Error(\"fail3\")\n     |             ^\n  22 | \n  23 |     it \"runs this\", ->\n  24 | ",
                  "language": "coffee"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- after hooks -- fails on this -- after all hook (failed).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            }
          ]
        }
      ],
      "error": null,
      "video": null,
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
        "duration": 1234,
        "startedAt": "2018-02-01T20:14:19.323Z",
        "endedAt": "2018-02-01T20:14:19.323Z"
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
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 3,
                  "column": 35,
                  "originalFile": "cypress/integration/simple_failing_spec.coffee",
                  "relativeFile": "cypress/integration/simple_failing_spec.coffee",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_spec.coffee",
                  "frame": "  1 | describe \"simple failing spec\", ->\n  2 |   it \"fails1\", ->\n> 3 |     cy.wrap(true, {timeout: 100}).should(\"be.false\")\n    |                                   ^\n  4 | \n  5 |   it \"fails2\", ->\n  6 |     throw new Error(\"fails2\")",
                  "language": "coffee"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_spec.coffee/simple failing spec -- fails1 (failed).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            }
          ]
        },
        {
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
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 6,
                  "column": 11,
                  "originalFile": "cypress/integration/simple_failing_spec.coffee",
                  "relativeFile": "cypress/integration/simple_failing_spec.coffee",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_spec.coffee",
                  "frame": "  4 | \n  5 |   it \"fails2\", ->\n> 6 |     throw new Error(\"fails2\")\n    |           ^",
                  "language": "coffee"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_spec.coffee/simple failing spec -- fails2 (failed).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            }
          ]
        }
      ],
      "error": null,
      "video": null,
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
        "duration": 1234,
        "startedAt": "2018-02-01T20:14:19.323Z",
        "endedAt": "2018-02-01T20:14:19.323Z"
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
          "hookName": "before all",
          "title": [
            "\"before all\" hook"
          ],
          "body": "function() {\n    return cy.wait(100);\n  }"
        },
        {
          "hookName": "before each",
          "title": [
            "\"before each\" hook"
          ],
          "body": "function() {\n    return cy.wait(200);\n  }"
        },
        {
          "hookName": "after each",
          "title": [
            "\"after each\" hook"
          ],
          "body": "function() {\n    return cy.wait(200);\n  }"
        },
        {
          "hookName": "after all",
          "title": [
            "\"after all\" hook"
          ],
          "body": "function() {\n    return cy.wait(100);\n  }"
        }
      ],
      "tests": [
        {
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
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": []
            }
          ]
        },
        {
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
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": []
            }
          ]
        },
        {
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
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": []
            }
          ]
        }
      ],
      "error": null,
      "video": null,
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
        "duration": 1234,
        "startedAt": "2018-02-01T20:14:19.323Z",
        "endedAt": "2018-02-01T20:14:19.323Z"
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
          "hookName": "before each",
          "title": [
            "\"before each\" hook"
          ],
          "body": "function() {\n    return cy.wait(1000);\n  }"
        }
      ],
      "tests": [
        {
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
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": []
            }
          ]
        }
      ],
      "error": null,
      "video": null,
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
  "config": {},
  "status": "finished"
}

exports['e2e spec_isolation fails [firefox] 1'] = {
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
        "duration": 1234,
        "startedAt": "2018-02-01T20:14:19.323Z",
        "endedAt": "2018-02-01T20:14:19.323Z"
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
          "hookName": "before each",
          "title": [
            "\"before each\" hook"
          ],
          "body": "function() {\n      throw new Error(\"fail1\");\n    }"
        },
        {
          "hookName": "after each",
          "title": [
            "\"after each\" hook"
          ],
          "body": "function() {\n      throw new Error(\"fail2\");\n    }"
        },
        {
          "hookName": "after all",
          "title": [
            "\"after all\" hook"
          ],
          "body": "function() {\n      throw new Error(\"fail3\");\n    }"
        }
      ],
      "tests": [
        {
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
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 4,
                  "column": 13,
                  "originalFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "relativeFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_hook_spec.coffee",
                  "frame": "  2 |   context \"beforeEach hooks\", ->\n  3 |     beforeEach ->\n> 4 |       throw new Error(\"fail1\")\n    |             ^\n  5 | \n  6 |     it \"never gets here\", ->\n  7 | ",
                  "language": "coffee"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- beforeEach hooks -- never gets here -- before each hook (failed).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            }
          ]
        },
        {
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
              "videoTimestamp": null,
              "duration": null,
              "startedAt": null,
              "screenshots": []
            }
          ]
        },
        {
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
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 13,
                  "column": 13,
                  "originalFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "relativeFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_hook_spec.coffee",
                  "frame": "  11 |   context \"afterEach hooks\", ->\n  12 |     afterEach ->\n> 13 |       throw new Error(\"fail2\")\n     |             ^\n  14 | \n  15 |     it \"runs this\", ->\n  16 | ",
                  "language": "coffee"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- afterEach hooks -- runs this -- after each hook (failed).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            }
          ]
        },
        {
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
              "videoTimestamp": null,
              "duration": null,
              "startedAt": null,
              "screenshots": []
            }
          ]
        },
        {
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
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": []
            }
          ]
        },
        {
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
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 21,
                  "column": 13,
                  "originalFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "relativeFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_hook_spec.coffee",
                  "frame": "  19 |   context \"after hooks\", ->\n  20 |     after ->\n> 21 |       throw new Error(\"fail3\")\n     |             ^\n  22 | \n  23 |     it \"runs this\", ->\n  24 | ",
                  "language": "coffee"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- after hooks -- fails on this -- after all hook (failed).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            }
          ]
        }
      ],
      "error": null,
      "video": null,
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
        "duration": 1234,
        "startedAt": "2018-02-01T20:14:19.323Z",
        "endedAt": "2018-02-01T20:14:19.323Z"
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
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 3,
                  "column": 35,
                  "originalFile": "cypress/integration/simple_failing_spec.coffee",
                  "relativeFile": "cypress/integration/simple_failing_spec.coffee",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_spec.coffee",
                  "frame": "  1 | describe \"simple failing spec\", ->\n  2 |   it \"fails1\", ->\n> 3 |     cy.wrap(true, {timeout: 100}).should(\"be.false\")\n    |                                   ^\n  4 | \n  5 |   it \"fails2\", ->\n  6 |     throw new Error(\"fails2\")",
                  "language": "coffee"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_spec.coffee/simple failing spec -- fails1 (failed).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            }
          ]
        },
        {
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
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 6,
                  "column": 11,
                  "originalFile": "cypress/integration/simple_failing_spec.coffee",
                  "relativeFile": "cypress/integration/simple_failing_spec.coffee",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_spec.coffee",
                  "frame": "  4 | \n  5 |   it \"fails2\", ->\n> 6 |     throw new Error(\"fails2\")\n    |           ^",
                  "language": "coffee"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_spec.coffee/simple failing spec -- fails2 (failed).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            }
          ]
        }
      ],
      "error": null,
      "video": null,
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
        "duration": 1234,
        "startedAt": "2018-02-01T20:14:19.323Z",
        "endedAt": "2018-02-01T20:14:19.323Z"
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
          "hookName": "before all",
          "title": [
            "\"before all\" hook"
          ],
          "body": "function() {\n    return cy.wait(100);\n  }"
        },
        {
          "hookName": "before each",
          "title": [
            "\"before each\" hook"
          ],
          "body": "function() {\n    return cy.wait(200);\n  }"
        },
        {
          "hookName": "after each",
          "title": [
            "\"after each\" hook"
          ],
          "body": "function() {\n    return cy.wait(200);\n  }"
        },
        {
          "hookName": "after all",
          "title": [
            "\"after all\" hook"
          ],
          "body": "function() {\n    return cy.wait(100);\n  }"
        }
      ],
      "tests": [
        {
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
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": []
            }
          ]
        },
        {
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
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": []
            }
          ]
        },
        {
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
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": []
            }
          ]
        }
      ],
      "error": null,
      "video": null,
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
        "duration": 1234,
        "startedAt": "2018-02-01T20:14:19.323Z",
        "endedAt": "2018-02-01T20:14:19.323Z"
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
          "hookName": "before each",
          "title": [
            "\"before each\" hook"
          ],
          "body": "function() {\n    return cy.wait(1000);\n  }"
        }
      ],
      "tests": [
        {
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
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": []
            }
          ]
        }
      ],
      "error": null,
      "video": null,
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
  "config": {},
  "status": "finished"
}

exports['e2e spec_isolation failing with retries enabled [electron] 1'] = {
  "startedTestsAt": "2018-02-01T20:14:19.323Z",
  "endedTestsAt": "2018-02-01T20:14:19.323Z",
  "totalDuration": 5555,
  "totalSuites": 6,
  "totalTests": 8,
  "totalFailed": 4,
  "totalPassed": 2,
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
        "duration": 1234,
        "startedAt": "2018-02-01T20:14:19.323Z",
        "endedAt": "2018-02-01T20:14:19.323Z"
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
          "hookName": "before each",
          "title": [
            "\"before each\" hook"
          ],
          "body": "function() {\n      throw new Error(\"fail1\");\n    }"
        },
        {
          "hookName": "after each",
          "title": [
            "\"after each\" hook"
          ],
          "body": "function() {\n      throw new Error(\"fail2\");\n    }"
        },
        {
          "hookName": "after all",
          "title": [
            "\"after all\" hook"
          ],
          "body": "function() {\n      throw new Error(\"fail3\");\n    }"
        }
      ],
      "tests": [
        {
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
                "message": "fail1",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 4,
                  "column": 13,
                  "originalFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "relativeFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_hook_spec.coffee",
                  "frame": "  2 |   context \"beforeEach hooks\", ->\n  3 |     beforeEach ->\n> 4 |       throw new Error(\"fail1\")\n    |             ^\n  5 | \n  6 |     it \"never gets here\", ->\n  7 | ",
                  "language": "coffee"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- beforeEach hooks -- never gets here (failed).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            },
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fail1\n\nBecause this error occurred during a `before each` hook we are skipping the remaining tests in the current suite: `beforeEach hooks`",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 4,
                  "column": 13,
                  "originalFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "relativeFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_hook_spec.coffee",
                  "frame": "  2 |   context \"beforeEach hooks\", ->\n  3 |     beforeEach ->\n> 4 |       throw new Error(\"fail1\")\n    |             ^\n  5 | \n  6 |     it \"never gets here\", ->\n  7 | ",
                  "language": "coffee"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- beforeEach hooks -- never gets here -- before each hook (failed) (attempt 2).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            }
          ]
        },
        {
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
              "videoTimestamp": null,
              "duration": null,
              "startedAt": null,
              "screenshots": []
            }
          ]
        },
        {
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
                "message": "fail2",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 13,
                  "column": 13,
                  "originalFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "relativeFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_hook_spec.coffee",
                  "frame": "  11 |   context \"afterEach hooks\", ->\n  12 |     afterEach ->\n> 13 |       throw new Error(\"fail2\")\n     |             ^\n  14 | \n  15 |     it \"runs this\", ->\n  16 | ",
                  "language": "coffee"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- afterEach hooks -- runs this -- after each hook (failed).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            },
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fail2\n\nBecause this error occurred during a `after each` hook we are skipping the remaining tests in the current suite: `afterEach hooks`",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 13,
                  "column": 13,
                  "originalFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "relativeFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_hook_spec.coffee",
                  "frame": "  11 |   context \"afterEach hooks\", ->\n  12 |     afterEach ->\n> 13 |       throw new Error(\"fail2\")\n     |             ^\n  14 | \n  15 |     it \"runs this\", ->\n  16 | ",
                  "language": "coffee"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- afterEach hooks -- runs this -- after each hook (failed) (attempt 2).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            }
          ]
        },
        {
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
              "videoTimestamp": null,
              "duration": null,
              "startedAt": null,
              "screenshots": []
            }
          ]
        },
        {
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
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": []
            }
          ]
        },
        {
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
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 21,
                  "column": 13,
                  "originalFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "relativeFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_hook_spec.coffee",
                  "frame": "  19 |   context \"after hooks\", ->\n  20 |     after ->\n> 21 |       throw new Error(\"fail3\")\n     |             ^\n  22 | \n  23 |     it \"runs this\", ->\n  24 | ",
                  "language": "coffee"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- after hooks -- fails on this -- after all hook (failed).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            }
          ]
        }
      ],
      "error": null,
      "video": null,
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
        "passes": 1,
        "pending": 0,
        "skipped": 0,
        "failures": 1,
        "duration": 1234,
        "startedAt": "2018-02-01T20:14:19.323Z",
        "endedAt": "2018-02-01T20:14:19.323Z"
      },
      "reporter": "spec",
      "reporterStats": {
        "suites": 1,
        "tests": 2,
        "passes": 1,
        "pending": 0,
        "failures": 1,
        "start": "2018-02-01T20:14:19.323Z",
        "end": "2018-02-01T20:14:19.323Z",
        "duration": 1234
      },
      "hooks": [],
      "tests": [
        {
          "title": [
            "simple retrying spec",
            "t1"
          ],
          "state": "failed",
          "body": "function () {\n    var test = cy.state('test');\n    throw new Error(\"\".concat(test.title, \" attempt #\").concat(cy.state('test').currentRetry()));\n  }",
          "displayError": "Error: t1 attempt #1\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "t1 attempt #0",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 5,
                  "column": 11,
                  "originalFile": "cypress/integration/simple_retrying_spec.js",
                  "relativeFile": "cypress/integration/simple_retrying_spec.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_retrying_spec.js",
                  "frame": "  3 |     const test = cy.state('test')\n  4 | \n> 5 |     throw new Error(`${test.title} attempt #${cy.state('test').currentRetry()}`)\n    |           ^\n  6 |   })\n  7 | \n  8 |   it('t2', () => {",
                  "language": "js"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_retrying_spec.js/simple retrying spec -- t1 (failed).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            },
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "t1 attempt #1",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 5,
                  "column": 11,
                  "originalFile": "cypress/integration/simple_retrying_spec.js",
                  "relativeFile": "cypress/integration/simple_retrying_spec.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_retrying_spec.js",
                  "frame": "  3 |     const test = cy.state('test')\n  4 | \n> 5 |     throw new Error(`${test.title} attempt #${cy.state('test').currentRetry()}`)\n    |           ^\n  6 |   })\n  7 | \n  8 |   it('t2', () => {",
                  "language": "js"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_retrying_spec.js/simple retrying spec -- t1 (failed) (attempt 2).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            }
          ]
        },
        {
          "title": [
            "simple retrying spec",
            "t2"
          ],
          "state": "passed",
          "body": "function () {// pass\n  }",
          "displayError": null,
          "attempts": [
            {
              "state": "passed",
              "error": null,
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": []
            }
          ]
        }
      ],
      "error": null,
      "video": null,
      "spec": {
        "name": "simple_retrying_spec.js",
        "relative": "cypress/integration/simple_retrying_spec.js",
        "absolute": "/foo/bar/.projects/e2e/cypress/integration/simple_retrying_spec.js",
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
  "config": {},
  "status": "finished"
}

exports['e2e spec_isolation failing with retries enabled [chrome] 1'] = {
  "startedTestsAt": "2018-02-01T20:14:19.323Z",
  "endedTestsAt": "2018-02-01T20:14:19.323Z",
  "totalDuration": 5555,
  "totalSuites": 6,
  "totalTests": 8,
  "totalFailed": 4,
  "totalPassed": 2,
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
        "duration": 1234,
        "startedAt": "2018-02-01T20:14:19.323Z",
        "endedAt": "2018-02-01T20:14:19.323Z"
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
          "hookName": "before each",
          "title": [
            "\"before each\" hook"
          ],
          "body": "function() {\n      throw new Error(\"fail1\");\n    }"
        },
        {
          "hookName": "after each",
          "title": [
            "\"after each\" hook"
          ],
          "body": "function() {\n      throw new Error(\"fail2\");\n    }"
        },
        {
          "hookName": "after all",
          "title": [
            "\"after all\" hook"
          ],
          "body": "function() {\n      throw new Error(\"fail3\");\n    }"
        }
      ],
      "tests": [
        {
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
                "message": "fail1",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 4,
                  "column": 13,
                  "originalFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "relativeFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_hook_spec.coffee",
                  "frame": "  2 |   context \"beforeEach hooks\", ->\n  3 |     beforeEach ->\n> 4 |       throw new Error(\"fail1\")\n    |             ^\n  5 | \n  6 |     it \"never gets here\", ->\n  7 | ",
                  "language": "coffee"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- beforeEach hooks -- never gets here (failed).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            },
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fail1\n\nBecause this error occurred during a `before each` hook we are skipping the remaining tests in the current suite: `beforeEach hooks`",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 4,
                  "column": 13,
                  "originalFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "relativeFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_hook_spec.coffee",
                  "frame": "  2 |   context \"beforeEach hooks\", ->\n  3 |     beforeEach ->\n> 4 |       throw new Error(\"fail1\")\n    |             ^\n  5 | \n  6 |     it \"never gets here\", ->\n  7 | ",
                  "language": "coffee"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- beforeEach hooks -- never gets here -- before each hook (failed) (attempt 2).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            }
          ]
        },
        {
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
              "videoTimestamp": null,
              "duration": null,
              "startedAt": null,
              "screenshots": []
            }
          ]
        },
        {
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
                "message": "fail2",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 13,
                  "column": 13,
                  "originalFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "relativeFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_hook_spec.coffee",
                  "frame": "  11 |   context \"afterEach hooks\", ->\n  12 |     afterEach ->\n> 13 |       throw new Error(\"fail2\")\n     |             ^\n  14 | \n  15 |     it \"runs this\", ->\n  16 | ",
                  "language": "coffee"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- afterEach hooks -- runs this -- after each hook (failed).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            },
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fail2\n\nBecause this error occurred during a `after each` hook we are skipping the remaining tests in the current suite: `afterEach hooks`",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 13,
                  "column": 13,
                  "originalFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "relativeFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_hook_spec.coffee",
                  "frame": "  11 |   context \"afterEach hooks\", ->\n  12 |     afterEach ->\n> 13 |       throw new Error(\"fail2\")\n     |             ^\n  14 | \n  15 |     it \"runs this\", ->\n  16 | ",
                  "language": "coffee"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- afterEach hooks -- runs this -- after each hook (failed) (attempt 2).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            }
          ]
        },
        {
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
              "videoTimestamp": null,
              "duration": null,
              "startedAt": null,
              "screenshots": []
            }
          ]
        },
        {
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
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": []
            }
          ]
        },
        {
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
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 21,
                  "column": 13,
                  "originalFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "relativeFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_hook_spec.coffee",
                  "frame": "  19 |   context \"after hooks\", ->\n  20 |     after ->\n> 21 |       throw new Error(\"fail3\")\n     |             ^\n  22 | \n  23 |     it \"runs this\", ->\n  24 | ",
                  "language": "coffee"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- after hooks -- fails on this -- after all hook (failed).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            }
          ]
        }
      ],
      "error": null,
      "video": null,
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
        "passes": 1,
        "pending": 0,
        "skipped": 0,
        "failures": 1,
        "duration": 1234,
        "startedAt": "2018-02-01T20:14:19.323Z",
        "endedAt": "2018-02-01T20:14:19.323Z"
      },
      "reporter": "spec",
      "reporterStats": {
        "suites": 1,
        "tests": 2,
        "passes": 1,
        "pending": 0,
        "failures": 1,
        "start": "2018-02-01T20:14:19.323Z",
        "end": "2018-02-01T20:14:19.323Z",
        "duration": 1234
      },
      "hooks": [],
      "tests": [
        {
          "title": [
            "simple retrying spec",
            "t1"
          ],
          "state": "failed",
          "body": "function () {\n    var test = cy.state('test');\n    throw new Error(\"\".concat(test.title, \" attempt #\").concat(cy.state('test').currentRetry()));\n  }",
          "displayError": "Error: t1 attempt #1\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "t1 attempt #0",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 5,
                  "column": 11,
                  "originalFile": "cypress/integration/simple_retrying_spec.js",
                  "relativeFile": "cypress/integration/simple_retrying_spec.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_retrying_spec.js",
                  "frame": "  3 |     const test = cy.state('test')\n  4 | \n> 5 |     throw new Error(`${test.title} attempt #${cy.state('test').currentRetry()}`)\n    |           ^\n  6 |   })\n  7 | \n  8 |   it('t2', () => {",
                  "language": "js"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_retrying_spec.js/simple retrying spec -- t1 (failed).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            },
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "t1 attempt #1",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 5,
                  "column": 11,
                  "originalFile": "cypress/integration/simple_retrying_spec.js",
                  "relativeFile": "cypress/integration/simple_retrying_spec.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_retrying_spec.js",
                  "frame": "  3 |     const test = cy.state('test')\n  4 | \n> 5 |     throw new Error(`${test.title} attempt #${cy.state('test').currentRetry()}`)\n    |           ^\n  6 |   })\n  7 | \n  8 |   it('t2', () => {",
                  "language": "js"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_retrying_spec.js/simple retrying spec -- t1 (failed) (attempt 2).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            }
          ]
        },
        {
          "title": [
            "simple retrying spec",
            "t2"
          ],
          "state": "passed",
          "body": "function () {// pass\n  }",
          "displayError": null,
          "attempts": [
            {
              "state": "passed",
              "error": null,
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": []
            }
          ]
        }
      ],
      "error": null,
      "video": null,
      "spec": {
        "name": "simple_retrying_spec.js",
        "relative": "cypress/integration/simple_retrying_spec.js",
        "absolute": "/foo/bar/.projects/e2e/cypress/integration/simple_retrying_spec.js",
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
  "config": {},
  "status": "finished"
}

exports['e2e spec_isolation failing with retries enabled [firefox] 1'] = {
  "startedTestsAt": "2018-02-01T20:14:19.323Z",
  "endedTestsAt": "2018-02-01T20:14:19.323Z",
  "totalDuration": 5555,
  "totalSuites": 6,
  "totalTests": 8,
  "totalFailed": 4,
  "totalPassed": 2,
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
        "duration": 1234,
        "startedAt": "2018-02-01T20:14:19.323Z",
        "endedAt": "2018-02-01T20:14:19.323Z"
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
          "hookName": "before each",
          "title": [
            "\"before each\" hook"
          ],
          "body": "function() {\n      throw new Error(\"fail1\");\n    }"
        },
        {
          "hookName": "after each",
          "title": [
            "\"after each\" hook"
          ],
          "body": "function() {\n      throw new Error(\"fail2\");\n    }"
        },
        {
          "hookName": "after all",
          "title": [
            "\"after all\" hook"
          ],
          "body": "function() {\n      throw new Error(\"fail3\");\n    }"
        }
      ],
      "tests": [
        {
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
                "message": "fail1",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 4,
                  "column": 13,
                  "originalFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "relativeFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_hook_spec.coffee",
                  "frame": "  2 |   context \"beforeEach hooks\", ->\n  3 |     beforeEach ->\n> 4 |       throw new Error(\"fail1\")\n    |             ^\n  5 | \n  6 |     it \"never gets here\", ->\n  7 | ",
                  "language": "coffee"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- beforeEach hooks -- never gets here (failed).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            },
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fail1\n\nBecause this error occurred during a `before each` hook we are skipping the remaining tests in the current suite: `beforeEach hooks`",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 4,
                  "column": 13,
                  "originalFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "relativeFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_hook_spec.coffee",
                  "frame": "  2 |   context \"beforeEach hooks\", ->\n  3 |     beforeEach ->\n> 4 |       throw new Error(\"fail1\")\n    |             ^\n  5 | \n  6 |     it \"never gets here\", ->\n  7 | ",
                  "language": "coffee"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- beforeEach hooks -- never gets here -- before each hook (failed) (attempt 2).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            }
          ]
        },
        {
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
              "videoTimestamp": null,
              "duration": null,
              "startedAt": null,
              "screenshots": []
            }
          ]
        },
        {
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
                "message": "fail2",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 13,
                  "column": 13,
                  "originalFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "relativeFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_hook_spec.coffee",
                  "frame": "  11 |   context \"afterEach hooks\", ->\n  12 |     afterEach ->\n> 13 |       throw new Error(\"fail2\")\n     |             ^\n  14 | \n  15 |     it \"runs this\", ->\n  16 | ",
                  "language": "coffee"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- afterEach hooks -- runs this -- after each hook (failed).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            },
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fail2\n\nBecause this error occurred during a `after each` hook we are skipping the remaining tests in the current suite: `afterEach hooks`",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 13,
                  "column": 13,
                  "originalFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "relativeFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_hook_spec.coffee",
                  "frame": "  11 |   context \"afterEach hooks\", ->\n  12 |     afterEach ->\n> 13 |       throw new Error(\"fail2\")\n     |             ^\n  14 | \n  15 |     it \"runs this\", ->\n  16 | ",
                  "language": "coffee"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- afterEach hooks -- runs this -- after each hook (failed) (attempt 2).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            }
          ]
        },
        {
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
              "videoTimestamp": null,
              "duration": null,
              "startedAt": null,
              "screenshots": []
            }
          ]
        },
        {
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
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": []
            }
          ]
        },
        {
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
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 21,
                  "column": 13,
                  "originalFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "relativeFile": "cypress/integration/simple_failing_hook_spec.coffee",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_hook_spec.coffee",
                  "frame": "  19 |   context \"after hooks\", ->\n  20 |     after ->\n> 21 |       throw new Error(\"fail3\")\n     |             ^\n  22 | \n  23 |     it \"runs this\", ->\n  24 | ",
                  "language": "coffee"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- after hooks -- fails on this -- after all hook (failed).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            }
          ]
        }
      ],
      "error": null,
      "video": null,
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
        "passes": 1,
        "pending": 0,
        "skipped": 0,
        "failures": 1,
        "duration": 1234,
        "startedAt": "2018-02-01T20:14:19.323Z",
        "endedAt": "2018-02-01T20:14:19.323Z"
      },
      "reporter": "spec",
      "reporterStats": {
        "suites": 1,
        "tests": 2,
        "passes": 1,
        "pending": 0,
        "failures": 1,
        "start": "2018-02-01T20:14:19.323Z",
        "end": "2018-02-01T20:14:19.323Z",
        "duration": 1234
      },
      "hooks": [],
      "tests": [
        {
          "title": [
            "simple retrying spec",
            "t1"
          ],
          "state": "failed",
          "body": "function () {\n    var test = cy.state('test');\n    throw new Error(\"\".concat(test.title, \" attempt #\").concat(cy.state('test').currentRetry()));\n  }",
          "displayError": "Error: t1 attempt #1\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "t1 attempt #0",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 5,
                  "column": 11,
                  "originalFile": "cypress/integration/simple_retrying_spec.js",
                  "relativeFile": "cypress/integration/simple_retrying_spec.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_retrying_spec.js",
                  "frame": "  3 |     const test = cy.state('test')\n  4 | \n> 5 |     throw new Error(`${test.title} attempt #${cy.state('test').currentRetry()}`)\n    |           ^\n  6 |   })\n  7 | \n  8 |   it('t2', () => {",
                  "language": "js"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_retrying_spec.js/simple retrying spec -- t1 (failed).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            },
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "t1 attempt #1",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 5,
                  "column": 11,
                  "originalFile": "cypress/integration/simple_retrying_spec.js",
                  "relativeFile": "cypress/integration/simple_retrying_spec.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/integration/simple_retrying_spec.js",
                  "frame": "  3 |     const test = cy.state('test')\n  4 | \n> 5 |     throw new Error(`${test.title} attempt #${cy.state('test').currentRetry()}`)\n    |           ^\n  6 |   })\n  7 | \n  8 |   it('t2', () => {",
                  "language": "js"
                }
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_retrying_spec.js/simple retrying spec -- t1 (failed) (attempt 2).png",
                  "height": 720,
                  "width": 1280
                }
              ]
            }
          ]
        },
        {
          "title": [
            "simple retrying spec",
            "t2"
          ],
          "state": "passed",
          "body": "function () {// pass\n  }",
          "displayError": null,
          "attempts": [
            {
              "state": "passed",
              "error": null,
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": []
            }
          ]
        }
      ],
      "error": null,
      "video": null,
      "spec": {
        "name": "simple_retrying_spec.js",
        "relative": "cypress/integration/simple_retrying_spec.js",
        "absolute": "/foo/bar/.projects/e2e/cypress/integration/simple_retrying_spec.js",
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
  "config": {},
  "status": "finished"
}
