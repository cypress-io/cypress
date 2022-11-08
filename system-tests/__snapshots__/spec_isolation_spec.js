exports['e2e spec_isolation / failing with retries enabled'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      2 found (simple_failing_hook.cy.js, simple_retrying.cy.js)                         │
  │ Searched:   cypress/e2e/simple_failing_hook.cy.js, cypress/e2e/simple_retrying.cy.js           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  simple_failing_hook.cy.js                                                       (1 of 2)


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
  │ Spec Ran:     simple_failing_hook.cy.js                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook s     (1280x720)
     pec -- beforeEach hooks -- never gets here (failed).png                                        
  -  /XXX/XXX/XXX/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook s     (1280x720)
     pec -- beforeEach hooks -- never gets here -- before each hook (failed) (attempt               
      2).png                                                                                        
  -  /XXX/XXX/XXX/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook s     (1280x720)
     pec -- afterEach hooks -- runs this -- after each hook (failed).png                            
  -  /XXX/XXX/XXX/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook s     (1280x720)
     pec -- afterEach hooks -- runs this -- after each hook (failed) (attempt 2).png                
  -  /XXX/XXX/XXX/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook s     (1280x720)
     pec -- after hooks -- fails on this -- after all hook (failed).png                             


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  simple_retrying.cy.js                                                           (2 of 2)


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
  │ Spec Ran:     simple_retrying.cy.js                                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/simple_retrying.cy.js/simple retrying spec -- t     (1280x720)
     1 (failed).png                                                                                 
  -  /XXX/XXX/XXX/cypress/screenshots/simple_retrying.cy.js/simple retrying spec -- t     (1280x720)
     1 (failed) (attempt 2).png                                                                     


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  simple_failing_hook.cy.js                XX:XX        6        1        3        1        1 │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  simple_retrying.cy.js                    XX:XX        2        1        1        -        - │
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
          "body": "() => {\n    cy.wait(1000);\n  }"
        }
      ],
      "tests": [
        {
          "title": [
            "simple passing spec",
            "passes"
          ],
          "state": "passed",
          "body": "() => {\n    cy.wrap(true).should('be.true');\n  }",
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
        "fileExtension": ".js",
        "baseName": "simple_passing.cy.js",
        "fileName": "simple_passing",
        "specFileExtension": ".cy.js",
        "relativeToCommonRoot": "simple_passing.cy.js",
        "specType": "integration",
        "name": "cypress/e2e/simple_passing.cy.js",
        "relative": "cypress/e2e/simple_passing.cy.js",
        "absolute": "/foo/bar/.projects/e2e/cypress/e2e/simple_passing.cy.js"
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
          "body": "() => {\n    cy.wait(100);\n  }"
        },
        {
          "hookName": "before each",
          "title": [
            "\"before each\" hook"
          ],
          "body": "() => {\n    cy.wait(200);\n  }"
        },
        {
          "hookName": "after each",
          "title": [
            "\"after each\" hook"
          ],
          "body": "() => {\n    cy.wait(200);\n  }"
        },
        {
          "hookName": "after all",
          "title": [
            "\"after all\" hook"
          ],
          "body": "() => {\n    cy.wait(100);\n  }"
        }
      ],
      "tests": [
        {
          "title": [
            "simple hooks spec",
            "t1"
          ],
          "state": "passed",
          "body": "() => {\n    cy.wrap('t1').should('eq', 't1');\n  }",
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
          "body": "() => {\n    cy.wrap('t2').should('eq', 't2');\n  }",
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
          "body": "() => {\n    cy.wrap('t3').should('eq', 't3');\n  }",
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
        "fileExtension": ".js",
        "baseName": "simple_hooks.cy.js",
        "fileName": "simple_hooks",
        "specFileExtension": ".cy.js",
        "relativeToCommonRoot": "simple_hooks.cy.js",
        "specType": "integration",
        "name": "cypress/e2e/simple_hooks.cy.js",
        "relative": "cypress/e2e/simple_hooks.cy.js",
        "absolute": "/foo/bar/.projects/e2e/cypress/e2e/simple_hooks.cy.js"
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
          "body": "() => {\n    cy.wrap(true, {\n      timeout: 100\n    }).should('be.false');\n  }",
          "displayError": "AssertionError: Timed out retrying after 100ms: expected true to be false\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "AssertionError",
                "message": "Timed out retrying after 100ms: expected true to be false",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 4,
                  "column": 37,
                  "originalFile": "cypress/e2e/simple_failing.cy.js",
                  "relativeFile": "cypress/e2e/simple_failing.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing.cy.js",
                  "frame": "  2 | describe('simple failing spec', () => {\n  3 |   it('fails1', () => {\n> 4 |     cy.wrap(true, { timeout: 100 }).should('be.false')\n    |                                     ^\n  5 |   })\n  6 | \n  7 |   it('fails2', () => {",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing.cy.js/simple failing spec -- fails1 (failed).png",
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
          "body": "() => {\n    throw new Error('fails2');\n  }",
          "displayError": "Error: fails2\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fails2",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 8,
                  "column": 11,
                  "originalFile": "cypress/e2e/simple_failing.cy.js",
                  "relativeFile": "cypress/e2e/simple_failing.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing.cy.js",
                  "frame": "   6 | \n   7 |   it('fails2', () => {\n>  8 |     throw new Error('fails2')\n     |           ^\n   9 |   })\n  10 | })\n  11 | ",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing.cy.js/simple failing spec -- fails2 (failed).png",
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
        "fileExtension": ".js",
        "baseName": "simple_failing.cy.js",
        "fileName": "simple_failing",
        "specFileExtension": ".cy.js",
        "relativeToCommonRoot": "simple_failing.cy.js",
        "specType": "integration",
        "name": "cypress/e2e/simple_failing.cy.js",
        "relative": "cypress/e2e/simple_failing.cy.js",
        "absolute": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing.cy.js"
      },
      "shouldUploadVideo": true
    },
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
          "body": "() => {\n      throw new Error('fail1');\n    }"
        },
        {
          "hookName": "after each",
          "title": [
            "\"after each\" hook"
          ],
          "body": "() => {\n      throw new Error('fail2');\n    }"
        },
        {
          "hookName": "after all",
          "title": [
            "\"after all\" hook"
          ],
          "body": "() => {\n      throw new Error('fail3');\n    }"
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
          "body": "() => {}",
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
                  "originalFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "relativeFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js",
                  "frame": "  2 |   context('beforeEach hooks', () => {\n  3 |     beforeEach(() => {\n> 4 |       throw new Error('fail1')\n    |             ^\n  5 |     })\n  6 | \n  7 |     it('never gets here', () => {})",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- beforeEach hooks -- never gets here -- before each hook (failed).png",
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
          "body": "() => {}",
          "displayError": "Error: fail2\n\nBecause this error occurred during a `after each` hook we are skipping the remaining tests in the current suite: `afterEach hooks`\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fail2\n\nBecause this error occurred during a `after each` hook we are skipping the remaining tests in the current suite: `afterEach hooks`",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 16,
                  "column": 13,
                  "originalFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "relativeFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js",
                  "frame": "  14 |   context('afterEach hooks', () => {\n  15 |     afterEach(() => {\n> 16 |       throw new Error('fail2')\n     |             ^\n  17 |     })\n  18 | \n  19 |     it('runs this', () => {})",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- afterEach hooks -- runs this -- after each hook (failed).png",
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
          "body": "() => {}",
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
          "body": "() => {}",
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
          "body": "() => {}",
          "displayError": "Error: fail3\n\nBecause this error occurred during a `after all` hook we are skipping the remaining tests in the current suite: `after hooks`\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fail3\n\nBecause this error occurred during a `after all` hook we are skipping the remaining tests in the current suite: `after hooks`",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 26,
                  "column": 13,
                  "originalFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "relativeFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js",
                  "frame": "  24 |   context('after hooks', () => {\n  25 |     after(() => {\n> 26 |       throw new Error('fail3')\n     |             ^\n  27 |     })\n  28 | \n  29 |     it('runs this', () => {})",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- after hooks -- fails on this -- after all hook (failed).png",
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
        "fileExtension": ".js",
        "baseName": "simple_failing_hook.cy.js",
        "fileName": "simple_failing_hook",
        "specFileExtension": ".cy.js",
        "relativeToCommonRoot": "simple_failing_hook.cy.js",
        "specType": "integration",
        "name": "cypress/e2e/simple_failing_hook.cy.js",
        "relative": "cypress/e2e/simple_failing_hook.cy.js",
        "absolute": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js"
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
          "body": "() => {\n    cy.wait(1000);\n  }"
        }
      ],
      "tests": [
        {
          "title": [
            "simple passing spec",
            "passes"
          ],
          "state": "passed",
          "body": "() => {\n    cy.wrap(true).should('be.true');\n  }",
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
        "fileExtension": ".js",
        "baseName": "simple_passing.cy.js",
        "fileName": "simple_passing",
        "specFileExtension": ".cy.js",
        "relativeToCommonRoot": "simple_passing.cy.js",
        "specType": "integration",
        "name": "cypress/e2e/simple_passing.cy.js",
        "relative": "cypress/e2e/simple_passing.cy.js",
        "absolute": "/foo/bar/.projects/e2e/cypress/e2e/simple_passing.cy.js"
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
          "body": "() => {\n    cy.wait(100);\n  }"
        },
        {
          "hookName": "before each",
          "title": [
            "\"before each\" hook"
          ],
          "body": "() => {\n    cy.wait(200);\n  }"
        },
        {
          "hookName": "after each",
          "title": [
            "\"after each\" hook"
          ],
          "body": "() => {\n    cy.wait(200);\n  }"
        },
        {
          "hookName": "after all",
          "title": [
            "\"after all\" hook"
          ],
          "body": "() => {\n    cy.wait(100);\n  }"
        }
      ],
      "tests": [
        {
          "title": [
            "simple hooks spec",
            "t1"
          ],
          "state": "passed",
          "body": "() => {\n    cy.wrap('t1').should('eq', 't1');\n  }",
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
          "body": "() => {\n    cy.wrap('t2').should('eq', 't2');\n  }",
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
          "body": "() => {\n    cy.wrap('t3').should('eq', 't3');\n  }",
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
        "fileExtension": ".js",
        "baseName": "simple_hooks.cy.js",
        "fileName": "simple_hooks",
        "specFileExtension": ".cy.js",
        "relativeToCommonRoot": "simple_hooks.cy.js",
        "specType": "integration",
        "name": "cypress/e2e/simple_hooks.cy.js",
        "relative": "cypress/e2e/simple_hooks.cy.js",
        "absolute": "/foo/bar/.projects/e2e/cypress/e2e/simple_hooks.cy.js"
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
          "body": "() => {\n    cy.wrap(true, {\n      timeout: 100\n    }).should('be.false');\n  }",
          "displayError": "AssertionError: Timed out retrying after 100ms: expected true to be false\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "AssertionError",
                "message": "Timed out retrying after 100ms: expected true to be false",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 4,
                  "column": 37,
                  "originalFile": "cypress/e2e/simple_failing.cy.js",
                  "relativeFile": "cypress/e2e/simple_failing.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing.cy.js",
                  "frame": "  2 | describe('simple failing spec', () => {\n  3 |   it('fails1', () => {\n> 4 |     cy.wrap(true, { timeout: 100 }).should('be.false')\n    |                                     ^\n  5 |   })\n  6 | \n  7 |   it('fails2', () => {",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing.cy.js/simple failing spec -- fails1 (failed).png",
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
          "body": "() => {\n    throw new Error('fails2');\n  }",
          "displayError": "Error: fails2\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fails2",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 8,
                  "column": 11,
                  "originalFile": "cypress/e2e/simple_failing.cy.js",
                  "relativeFile": "cypress/e2e/simple_failing.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing.cy.js",
                  "frame": "   6 | \n   7 |   it('fails2', () => {\n>  8 |     throw new Error('fails2')\n     |           ^\n   9 |   })\n  10 | })\n  11 | ",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing.cy.js/simple failing spec -- fails2 (failed).png",
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
        "fileExtension": ".js",
        "baseName": "simple_failing.cy.js",
        "fileName": "simple_failing",
        "specFileExtension": ".cy.js",
        "relativeToCommonRoot": "simple_failing.cy.js",
        "specType": "integration",
        "name": "cypress/e2e/simple_failing.cy.js",
        "relative": "cypress/e2e/simple_failing.cy.js",
        "absolute": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing.cy.js"
      },
      "shouldUploadVideo": true
    },
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
          "body": "() => {\n      throw new Error('fail1');\n    }"
        },
        {
          "hookName": "after each",
          "title": [
            "\"after each\" hook"
          ],
          "body": "() => {\n      throw new Error('fail2');\n    }"
        },
        {
          "hookName": "after all",
          "title": [
            "\"after all\" hook"
          ],
          "body": "() => {\n      throw new Error('fail3');\n    }"
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
          "body": "() => {}",
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
                  "originalFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "relativeFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js",
                  "frame": "  2 |   context('beforeEach hooks', () => {\n  3 |     beforeEach(() => {\n> 4 |       throw new Error('fail1')\n    |             ^\n  5 |     })\n  6 | \n  7 |     it('never gets here', () => {})",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- beforeEach hooks -- never gets here -- before each hook (failed).png",
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
          "body": "() => {}",
          "displayError": "Error: fail2\n\nBecause this error occurred during a `after each` hook we are skipping the remaining tests in the current suite: `afterEach hooks`\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fail2\n\nBecause this error occurred during a `after each` hook we are skipping the remaining tests in the current suite: `afterEach hooks`",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 16,
                  "column": 13,
                  "originalFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "relativeFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js",
                  "frame": "  14 |   context('afterEach hooks', () => {\n  15 |     afterEach(() => {\n> 16 |       throw new Error('fail2')\n     |             ^\n  17 |     })\n  18 | \n  19 |     it('runs this', () => {})",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- afterEach hooks -- runs this -- after each hook (failed).png",
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
          "body": "() => {}",
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
          "body": "() => {}",
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
          "body": "() => {}",
          "displayError": "Error: fail3\n\nBecause this error occurred during a `after all` hook we are skipping the remaining tests in the current suite: `after hooks`\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fail3\n\nBecause this error occurred during a `after all` hook we are skipping the remaining tests in the current suite: `after hooks`",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 26,
                  "column": 13,
                  "originalFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "relativeFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js",
                  "frame": "  24 |   context('after hooks', () => {\n  25 |     after(() => {\n> 26 |       throw new Error('fail3')\n     |             ^\n  27 |     })\n  28 | \n  29 |     it('runs this', () => {})",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- after hooks -- fails on this -- after all hook (failed).png",
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
        "fileExtension": ".js",
        "baseName": "simple_failing_hook.cy.js",
        "fileName": "simple_failing_hook",
        "specFileExtension": ".cy.js",
        "relativeToCommonRoot": "simple_failing_hook.cy.js",
        "specType": "integration",
        "name": "cypress/e2e/simple_failing_hook.cy.js",
        "relative": "cypress/e2e/simple_failing_hook.cy.js",
        "absolute": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js"
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
          "body": "() => {\n    cy.wait(1000);\n  }"
        }
      ],
      "tests": [
        {
          "title": [
            "simple passing spec",
            "passes"
          ],
          "state": "passed",
          "body": "() => {\n    cy.wrap(true).should('be.true');\n  }",
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
        "fileExtension": ".js",
        "baseName": "simple_passing.cy.js",
        "fileName": "simple_passing",
        "specFileExtension": ".cy.js",
        "relativeToCommonRoot": "simple_passing.cy.js",
        "specType": "integration",
        "name": "cypress/e2e/simple_passing.cy.js",
        "relative": "cypress/e2e/simple_passing.cy.js",
        "absolute": "/foo/bar/.projects/e2e/cypress/e2e/simple_passing.cy.js"
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
          "body": "() => {\n    cy.wait(100);\n  }"
        },
        {
          "hookName": "before each",
          "title": [
            "\"before each\" hook"
          ],
          "body": "() => {\n    cy.wait(200);\n  }"
        },
        {
          "hookName": "after each",
          "title": [
            "\"after each\" hook"
          ],
          "body": "() => {\n    cy.wait(200);\n  }"
        },
        {
          "hookName": "after all",
          "title": [
            "\"after all\" hook"
          ],
          "body": "() => {\n    cy.wait(100);\n  }"
        }
      ],
      "tests": [
        {
          "title": [
            "simple hooks spec",
            "t1"
          ],
          "state": "passed",
          "body": "() => {\n    cy.wrap('t1').should('eq', 't1');\n  }",
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
          "body": "() => {\n    cy.wrap('t2').should('eq', 't2');\n  }",
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
          "body": "() => {\n    cy.wrap('t3').should('eq', 't3');\n  }",
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
        "fileExtension": ".js",
        "baseName": "simple_hooks.cy.js",
        "fileName": "simple_hooks",
        "specFileExtension": ".cy.js",
        "relativeToCommonRoot": "simple_hooks.cy.js",
        "specType": "integration",
        "name": "cypress/e2e/simple_hooks.cy.js",
        "relative": "cypress/e2e/simple_hooks.cy.js",
        "absolute": "/foo/bar/.projects/e2e/cypress/e2e/simple_hooks.cy.js"
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
          "body": "() => {\n    cy.wrap(true, {\n      timeout: 100\n    }).should('be.false');\n  }",
          "displayError": "AssertionError: Timed out retrying after 100ms: expected true to be false\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "AssertionError",
                "message": "Timed out retrying after 100ms: expected true to be false",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 4,
                  "column": 37,
                  "originalFile": "cypress/e2e/simple_failing.cy.js",
                  "relativeFile": "cypress/e2e/simple_failing.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing.cy.js",
                  "frame": "  2 | describe('simple failing spec', () => {\n  3 |   it('fails1', () => {\n> 4 |     cy.wrap(true, { timeout: 100 }).should('be.false')\n    |                                     ^\n  5 |   })\n  6 | \n  7 |   it('fails2', () => {",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing.cy.js/simple failing spec -- fails1 (failed).png",
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
          "body": "() => {\n    throw new Error('fails2');\n  }",
          "displayError": "Error: fails2\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fails2",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 8,
                  "column": 11,
                  "originalFile": "cypress/e2e/simple_failing.cy.js",
                  "relativeFile": "cypress/e2e/simple_failing.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing.cy.js",
                  "frame": "   6 | \n   7 |   it('fails2', () => {\n>  8 |     throw new Error('fails2')\n     |           ^\n   9 |   })\n  10 | })\n  11 | ",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing.cy.js/simple failing spec -- fails2 (failed).png",
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
        "fileExtension": ".js",
        "baseName": "simple_failing.cy.js",
        "fileName": "simple_failing",
        "specFileExtension": ".cy.js",
        "relativeToCommonRoot": "simple_failing.cy.js",
        "specType": "integration",
        "name": "cypress/e2e/simple_failing.cy.js",
        "relative": "cypress/e2e/simple_failing.cy.js",
        "absolute": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing.cy.js"
      },
      "shouldUploadVideo": true
    },
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
          "body": "() => {\n      throw new Error('fail1');\n    }"
        },
        {
          "hookName": "after each",
          "title": [
            "\"after each\" hook"
          ],
          "body": "() => {\n      throw new Error('fail2');\n    }"
        },
        {
          "hookName": "after all",
          "title": [
            "\"after all\" hook"
          ],
          "body": "() => {\n      throw new Error('fail3');\n    }"
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
          "body": "() => {}",
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
                  "originalFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "relativeFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js",
                  "frame": "  2 |   context('beforeEach hooks', () => {\n  3 |     beforeEach(() => {\n> 4 |       throw new Error('fail1')\n    |             ^\n  5 |     })\n  6 | \n  7 |     it('never gets here', () => {})",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- beforeEach hooks -- never gets here -- before each hook (failed).png",
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
          "body": "() => {}",
          "displayError": "Error: fail2\n\nBecause this error occurred during a `after each` hook we are skipping the remaining tests in the current suite: `afterEach hooks`\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fail2\n\nBecause this error occurred during a `after each` hook we are skipping the remaining tests in the current suite: `afterEach hooks`",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 16,
                  "column": 13,
                  "originalFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "relativeFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js",
                  "frame": "  14 |   context('afterEach hooks', () => {\n  15 |     afterEach(() => {\n> 16 |       throw new Error('fail2')\n     |             ^\n  17 |     })\n  18 | \n  19 |     it('runs this', () => {})",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- afterEach hooks -- runs this -- after each hook (failed).png",
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
          "body": "() => {}",
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
          "body": "() => {}",
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
          "body": "() => {}",
          "displayError": "Error: fail3\n\nBecause this error occurred during a `after all` hook we are skipping the remaining tests in the current suite: `after hooks`\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fail3\n\nBecause this error occurred during a `after all` hook we are skipping the remaining tests in the current suite: `after hooks`",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 26,
                  "column": 13,
                  "originalFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "relativeFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js",
                  "frame": "  24 |   context('after hooks', () => {\n  25 |     after(() => {\n> 26 |       throw new Error('fail3')\n     |             ^\n  27 |     })\n  28 | \n  29 |     it('runs this', () => {})",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- after hooks -- fails on this -- after all hook (failed).png",
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
        "fileExtension": ".js",
        "baseName": "simple_failing_hook.cy.js",
        "fileName": "simple_failing_hook",
        "specFileExtension": ".cy.js",
        "relativeToCommonRoot": "simple_failing_hook.cy.js",
        "specType": "integration",
        "name": "cypress/e2e/simple_failing_hook.cy.js",
        "relative": "cypress/e2e/simple_failing_hook.cy.js",
        "absolute": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js"
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
          "body": "() => {\n      throw new Error('fail1');\n    }"
        },
        {
          "hookName": "after each",
          "title": [
            "\"after each\" hook"
          ],
          "body": "() => {\n      throw new Error('fail2');\n    }"
        },
        {
          "hookName": "after all",
          "title": [
            "\"after all\" hook"
          ],
          "body": "() => {\n      throw new Error('fail3');\n    }"
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
          "body": "() => {}",
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
                  "originalFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "relativeFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js",
                  "frame": "  2 |   context('beforeEach hooks', () => {\n  3 |     beforeEach(() => {\n> 4 |       throw new Error('fail1')\n    |             ^\n  5 |     })\n  6 | \n  7 |     it('never gets here', () => {})",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- beforeEach hooks -- never gets here (failed).png",
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
                  "originalFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "relativeFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js",
                  "frame": "  2 |   context('beforeEach hooks', () => {\n  3 |     beforeEach(() => {\n> 4 |       throw new Error('fail1')\n    |             ^\n  5 |     })\n  6 | \n  7 |     it('never gets here', () => {})",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- beforeEach hooks -- never gets here -- before each hook (failed) (attempt 2).png",
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
          "body": "() => {}",
          "displayError": "Error: fail2\n\nBecause this error occurred during a `after each` hook we are skipping the remaining tests in the current suite: `afterEach hooks`\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fail2",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 16,
                  "column": 13,
                  "originalFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "relativeFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js",
                  "frame": "  14 |   context('afterEach hooks', () => {\n  15 |     afterEach(() => {\n> 16 |       throw new Error('fail2')\n     |             ^\n  17 |     })\n  18 | \n  19 |     it('runs this', () => {})",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- afterEach hooks -- runs this -- after each hook (failed).png",
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
                  "line": 16,
                  "column": 13,
                  "originalFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "relativeFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js",
                  "frame": "  14 |   context('afterEach hooks', () => {\n  15 |     afterEach(() => {\n> 16 |       throw new Error('fail2')\n     |             ^\n  17 |     })\n  18 | \n  19 |     it('runs this', () => {})",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- afterEach hooks -- runs this -- after each hook (failed) (attempt 2).png",
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
          "body": "() => {}",
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
          "body": "() => {}",
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
          "body": "() => {}",
          "displayError": "Error: fail3\n\nBecause this error occurred during a `after all` hook we are skipping the remaining tests in the current suite: `after hooks`\n\nAlthough you have test retries enabled, we do not retry tests when `before all` or `after all` hooks fail\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fail3\n\nBecause this error occurred during a `after all` hook we are skipping the remaining tests in the current suite: `after hooks`\n\nAlthough you have test retries enabled, we do not retry tests when `before all` or `after all` hooks fail",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 26,
                  "column": 13,
                  "originalFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "relativeFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js",
                  "frame": "  24 |   context('after hooks', () => {\n  25 |     after(() => {\n> 26 |       throw new Error('fail3')\n     |             ^\n  27 |     })\n  28 | \n  29 |     it('runs this', () => {})",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- after hooks -- fails on this -- after all hook (failed).png",
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
        "fileExtension": ".js",
        "baseName": "simple_failing_hook.cy.js",
        "fileName": "simple_failing_hook",
        "specFileExtension": ".cy.js",
        "relativeToCommonRoot": "simple_failing_hook.cy.js",
        "specType": "integration",
        "name": "cypress/e2e/simple_failing_hook.cy.js",
        "relative": "cypress/e2e/simple_failing_hook.cy.js",
        "absolute": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js"
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
          "body": "() => {\n    const test = cy.state('test');\n    throw new Error(`${test.title} attempt #${cy.state('test').currentRetry()}`);\n  }",
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
                  "originalFile": "cypress/e2e/simple_retrying.cy.js",
                  "relativeFile": "cypress/e2e/simple_retrying.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_retrying.cy.js",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_retrying.cy.js/simple retrying spec -- t1 (failed).png",
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
                  "originalFile": "cypress/e2e/simple_retrying.cy.js",
                  "relativeFile": "cypress/e2e/simple_retrying.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_retrying.cy.js",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_retrying.cy.js/simple retrying spec -- t1 (failed) (attempt 2).png",
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
          "body": "() => {// pass\n  }",
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
        "fileExtension": ".js",
        "baseName": "simple_retrying.cy.js",
        "fileName": "simple_retrying",
        "specFileExtension": ".cy.js",
        "relativeToCommonRoot": "simple_retrying.cy.js",
        "specType": "integration",
        "name": "cypress/e2e/simple_retrying.cy.js",
        "relative": "cypress/e2e/simple_retrying.cy.js",
        "absolute": "/foo/bar/.projects/e2e/cypress/e2e/simple_retrying.cy.js"
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
          "body": "() => {\n      throw new Error('fail1');\n    }"
        },
        {
          "hookName": "after each",
          "title": [
            "\"after each\" hook"
          ],
          "body": "() => {\n      throw new Error('fail2');\n    }"
        },
        {
          "hookName": "after all",
          "title": [
            "\"after all\" hook"
          ],
          "body": "() => {\n      throw new Error('fail3');\n    }"
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
          "body": "() => {}",
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
                  "originalFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "relativeFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js",
                  "frame": "  2 |   context('beforeEach hooks', () => {\n  3 |     beforeEach(() => {\n> 4 |       throw new Error('fail1')\n    |             ^\n  5 |     })\n  6 | \n  7 |     it('never gets here', () => {})",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- beforeEach hooks -- never gets here (failed).png",
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
                  "originalFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "relativeFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js",
                  "frame": "  2 |   context('beforeEach hooks', () => {\n  3 |     beforeEach(() => {\n> 4 |       throw new Error('fail1')\n    |             ^\n  5 |     })\n  6 | \n  7 |     it('never gets here', () => {})",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- beforeEach hooks -- never gets here -- before each hook (failed) (attempt 2).png",
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
          "body": "() => {}",
          "displayError": "Error: fail2\n\nBecause this error occurred during a `after each` hook we are skipping the remaining tests in the current suite: `afterEach hooks`\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fail2",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 16,
                  "column": 13,
                  "originalFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "relativeFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js",
                  "frame": "  14 |   context('afterEach hooks', () => {\n  15 |     afterEach(() => {\n> 16 |       throw new Error('fail2')\n     |             ^\n  17 |     })\n  18 | \n  19 |     it('runs this', () => {})",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- afterEach hooks -- runs this -- after each hook (failed).png",
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
                  "line": 16,
                  "column": 13,
                  "originalFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "relativeFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js",
                  "frame": "  14 |   context('afterEach hooks', () => {\n  15 |     afterEach(() => {\n> 16 |       throw new Error('fail2')\n     |             ^\n  17 |     })\n  18 | \n  19 |     it('runs this', () => {})",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- afterEach hooks -- runs this -- after each hook (failed) (attempt 2).png",
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
          "body": "() => {}",
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
          "body": "() => {}",
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
          "body": "() => {}",
          "displayError": "Error: fail3\n\nBecause this error occurred during a `after all` hook we are skipping the remaining tests in the current suite: `after hooks`\n\nAlthough you have test retries enabled, we do not retry tests when `before all` or `after all` hooks fail\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fail3\n\nBecause this error occurred during a `after all` hook we are skipping the remaining tests in the current suite: `after hooks`\n\nAlthough you have test retries enabled, we do not retry tests when `before all` or `after all` hooks fail",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 26,
                  "column": 13,
                  "originalFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "relativeFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js",
                  "frame": "  24 |   context('after hooks', () => {\n  25 |     after(() => {\n> 26 |       throw new Error('fail3')\n     |             ^\n  27 |     })\n  28 | \n  29 |     it('runs this', () => {})",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- after hooks -- fails on this -- after all hook (failed).png",
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
        "fileExtension": ".js",
        "baseName": "simple_failing_hook.cy.js",
        "fileName": "simple_failing_hook",
        "specFileExtension": ".cy.js",
        "relativeToCommonRoot": "simple_failing_hook.cy.js",
        "specType": "integration",
        "name": "cypress/e2e/simple_failing_hook.cy.js",
        "relative": "cypress/e2e/simple_failing_hook.cy.js",
        "absolute": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js"
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
          "body": "() => {\n    const test = cy.state('test');\n    throw new Error(`${test.title} attempt #${cy.state('test').currentRetry()}`);\n  }",
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
                  "originalFile": "cypress/e2e/simple_retrying.cy.js",
                  "relativeFile": "cypress/e2e/simple_retrying.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_retrying.cy.js",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_retrying.cy.js/simple retrying spec -- t1 (failed).png",
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
                  "originalFile": "cypress/e2e/simple_retrying.cy.js",
                  "relativeFile": "cypress/e2e/simple_retrying.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_retrying.cy.js",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_retrying.cy.js/simple retrying spec -- t1 (failed) (attempt 2).png",
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
          "body": "() => {// pass\n  }",
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
        "fileExtension": ".js",
        "baseName": "simple_retrying.cy.js",
        "fileName": "simple_retrying",
        "specFileExtension": ".cy.js",
        "relativeToCommonRoot": "simple_retrying.cy.js",
        "specType": "integration",
        "name": "cypress/e2e/simple_retrying.cy.js",
        "relative": "cypress/e2e/simple_retrying.cy.js",
        "absolute": "/foo/bar/.projects/e2e/cypress/e2e/simple_retrying.cy.js"
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
          "body": "() => {\n      throw new Error('fail1');\n    }"
        },
        {
          "hookName": "after each",
          "title": [
            "\"after each\" hook"
          ],
          "body": "() => {\n      throw new Error('fail2');\n    }"
        },
        {
          "hookName": "after all",
          "title": [
            "\"after all\" hook"
          ],
          "body": "() => {\n      throw new Error('fail3');\n    }"
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
          "body": "() => {}",
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
                  "originalFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "relativeFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js",
                  "frame": "  2 |   context('beforeEach hooks', () => {\n  3 |     beforeEach(() => {\n> 4 |       throw new Error('fail1')\n    |             ^\n  5 |     })\n  6 | \n  7 |     it('never gets here', () => {})",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- beforeEach hooks -- never gets here (failed).png",
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
                  "originalFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "relativeFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js",
                  "frame": "  2 |   context('beforeEach hooks', () => {\n  3 |     beforeEach(() => {\n> 4 |       throw new Error('fail1')\n    |             ^\n  5 |     })\n  6 | \n  7 |     it('never gets here', () => {})",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- beforeEach hooks -- never gets here -- before each hook (failed) (attempt 2).png",
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
          "body": "() => {}",
          "displayError": "Error: fail2\n\nBecause this error occurred during a `after each` hook we are skipping the remaining tests in the current suite: `afterEach hooks`\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fail2",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 16,
                  "column": 13,
                  "originalFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "relativeFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js",
                  "frame": "  14 |   context('afterEach hooks', () => {\n  15 |     afterEach(() => {\n> 16 |       throw new Error('fail2')\n     |             ^\n  17 |     })\n  18 | \n  19 |     it('runs this', () => {})",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- afterEach hooks -- runs this -- after each hook (failed).png",
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
                  "line": 16,
                  "column": 13,
                  "originalFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "relativeFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js",
                  "frame": "  14 |   context('afterEach hooks', () => {\n  15 |     afterEach(() => {\n> 16 |       throw new Error('fail2')\n     |             ^\n  17 |     })\n  18 | \n  19 |     it('runs this', () => {})",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- afterEach hooks -- runs this -- after each hook (failed) (attempt 2).png",
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
          "body": "() => {}",
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
          "body": "() => {}",
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
          "body": "() => {}",
          "displayError": "Error: fail3\n\nBecause this error occurred during a `after all` hook we are skipping the remaining tests in the current suite: `after hooks`\n\nAlthough you have test retries enabled, we do not retry tests when `before all` or `after all` hooks fail\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fail3\n\nBecause this error occurred during a `after all` hook we are skipping the remaining tests in the current suite: `after hooks`\n\nAlthough you have test retries enabled, we do not retry tests when `before all` or `after all` hooks fail",
                "stack": "[stack trace lines]",
                "codeFrame": {
                  "line": 26,
                  "column": 13,
                  "originalFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "relativeFile": "cypress/e2e/simple_failing_hook.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js",
                  "frame": "  24 |   context('after hooks', () => {\n  25 |     after(() => {\n> 26 |       throw new Error('fail3')\n     |             ^\n  27 |     })\n  28 | \n  29 |     it('runs this', () => {})",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- after hooks -- fails on this -- after all hook (failed).png",
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
        "fileExtension": ".js",
        "baseName": "simple_failing_hook.cy.js",
        "fileName": "simple_failing_hook",
        "specFileExtension": ".cy.js",
        "relativeToCommonRoot": "simple_failing_hook.cy.js",
        "specType": "integration",
        "name": "cypress/e2e/simple_failing_hook.cy.js",
        "relative": "cypress/e2e/simple_failing_hook.cy.js",
        "absolute": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js"
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
          "body": "() => {\n    const test = cy.state('test');\n    throw new Error(`${test.title} attempt #${cy.state('test').currentRetry()}`);\n  }",
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
                  "originalFile": "cypress/e2e/simple_retrying.cy.js",
                  "relativeFile": "cypress/e2e/simple_retrying.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_retrying.cy.js",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_retrying.cy.js/simple retrying spec -- t1 (failed).png",
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
                  "originalFile": "cypress/e2e/simple_retrying.cy.js",
                  "relativeFile": "cypress/e2e/simple_retrying.cy.js",
                  "absoluteFile": "/foo/bar/.projects/e2e/cypress/e2e/simple_retrying.cy.js",
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
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_retrying.cy.js/simple retrying spec -- t1 (failed) (attempt 2).png",
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
          "body": "() => {// pass\n  }",
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
        "fileExtension": ".js",
        "baseName": "simple_retrying.cy.js",
        "fileName": "simple_retrying",
        "specFileExtension": ".cy.js",
        "relativeToCommonRoot": "simple_retrying.cy.js",
        "specType": "integration",
        "name": "cypress/e2e/simple_retrying.cy.js",
        "relative": "cypress/e2e/simple_retrying.cy.js",
        "absolute": "/foo/bar/.projects/e2e/cypress/e2e/simple_retrying.cy.js"
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

exports['e2e spec_isolation failing with retries enabled [webkit] 1'] = {
  "status": "finished",
  "startedTestsAt": "2018-02-01T20:14:19.323Z",
  "endedTestsAt": "2018-02-01T20:14:19.323Z",
  "totalDuration": 5555,
  "totalSuites": 6,
  "totalTests": 8,
  "totalPassed": 2,
  "totalPending": 1,
  "totalFailed": 4,
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
          "body": "() => {\n      throw new Error('fail1');\n    }"
        },
        {
          "hookName": "after each",
          "title": [
            "\"after each\" hook"
          ],
          "body": "() => {\n      throw new Error('fail2');\n    }"
        },
        {
          "hookName": "after all",
          "title": [
            "\"after all\" hook"
          ],
          "body": "() => {\n      throw new Error('fail3');\n    }"
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
          "body": "() => {}",
          "displayError": "Error: fail1\n\nBecause this error occurred during a `before each` hook we are skipping the remaining tests in the current suite: `beforeEach hooks`\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fail1",
                "stack": "[stack trace lines]"
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- beforeEach hooks -- never gets here (failed).png",
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
                "stack": "[stack trace lines]"
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- beforeEach hooks -- never gets here -- before each hook (failed) (attempt 2).png",
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
          "body": "() => {}",
          "displayError": "Error: fail2\n\nBecause this error occurred during a `after each` hook we are skipping the remaining tests in the current suite: `afterEach hooks`\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fail2",
                "stack": "[stack trace lines]"
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- afterEach hooks -- runs this -- after each hook (failed).png",
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
                "stack": "[stack trace lines]"
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- afterEach hooks -- runs this -- after each hook (failed) (attempt 2).png",
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
          "body": "() => {}",
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
          "body": "() => {}",
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
          "body": "() => {}",
          "displayError": "Error: fail3\n\nBecause this error occurred during a `after all` hook we are skipping the remaining tests in the current suite: `after hooks`\n\nAlthough you have test retries enabled, we do not retry tests when `before all` or `after all` hooks fail\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fail3\n\nBecause this error occurred during a `after all` hook we are skipping the remaining tests in the current suite: `after hooks`\n\nAlthough you have test retries enabled, we do not retry tests when `before all` or `after all` hooks fail",
                "stack": "[stack trace lines]"
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- after hooks -- fails on this -- after all hook (failed).png",
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
        "fileExtension": ".js",
        "baseName": "simple_failing_hook.cy.js",
        "fileName": "simple_failing_hook",
        "specFileExtension": ".cy.js",
        "relativeToCommonRoot": "simple_failing_hook.cy.js",
        "specType": "integration",
        "name": "cypress/e2e/simple_failing_hook.cy.js",
        "relative": "cypress/e2e/simple_failing_hook.cy.js",
        "absolute": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js"
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
          "body": "() => {\n    const test = cy.state('test');\n    throw new Error(`${test.title} attempt #${cy.state('test').currentRetry()}`);\n  }",
          "displayError": "Error: t1 attempt #1\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "t1 attempt #0",
                "stack": "[stack trace lines]"
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_retrying.cy.js/simple retrying spec -- t1 (failed).png",
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
                "stack": "[stack trace lines]"
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_retrying.cy.js/simple retrying spec -- t1 (failed) (attempt 2).png",
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
          "body": "() => {// pass\n  }",
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
        "fileExtension": ".js",
        "baseName": "simple_retrying.cy.js",
        "fileName": "simple_retrying",
        "specFileExtension": ".cy.js",
        "relativeToCommonRoot": "simple_retrying.cy.js",
        "specType": "integration",
        "name": "cypress/e2e/simple_retrying.cy.js",
        "relative": "cypress/e2e/simple_retrying.cy.js",
        "absolute": "/foo/bar/.projects/e2e/cypress/e2e/simple_retrying.cy.js"
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

exports['e2e spec_isolation fails [webkit] 1'] = {
  "status": "finished",
  "startedTestsAt": "2018-02-01T20:14:19.323Z",
  "endedTestsAt": "2018-02-01T20:14:19.323Z",
  "totalDuration": 5555,
  "totalSuites": 8,
  "totalTests": 12,
  "totalPassed": 5,
  "totalPending": 1,
  "totalFailed": 5,
  "totalSkipped": 1,
  "runs": [
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
          "body": "() => {\n    cy.wait(1000);\n  }"
        }
      ],
      "tests": [
        {
          "title": [
            "simple passing spec",
            "passes"
          ],
          "state": "passed",
          "body": "() => {\n    cy.wrap(true).should('be.true');\n  }",
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
        "fileExtension": ".js",
        "baseName": "simple_passing.cy.js",
        "fileName": "simple_passing",
        "specFileExtension": ".cy.js",
        "relativeToCommonRoot": "simple_passing.cy.js",
        "specType": "integration",
        "name": "cypress/e2e/simple_passing.cy.js",
        "relative": "cypress/e2e/simple_passing.cy.js",
        "absolute": "/foo/bar/.projects/e2e/cypress/e2e/simple_passing.cy.js"
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
          "body": "() => {\n    cy.wait(100);\n  }"
        },
        {
          "hookName": "before each",
          "title": [
            "\"before each\" hook"
          ],
          "body": "() => {\n    cy.wait(200);\n  }"
        },
        {
          "hookName": "after each",
          "title": [
            "\"after each\" hook"
          ],
          "body": "() => {\n    cy.wait(200);\n  }"
        },
        {
          "hookName": "after all",
          "title": [
            "\"after all\" hook"
          ],
          "body": "() => {\n    cy.wait(100);\n  }"
        }
      ],
      "tests": [
        {
          "title": [
            "simple hooks spec",
            "t1"
          ],
          "state": "passed",
          "body": "() => {\n    cy.wrap('t1').should('eq', 't1');\n  }",
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
          "body": "() => {\n    cy.wrap('t2').should('eq', 't2');\n  }",
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
          "body": "() => {\n    cy.wrap('t3').should('eq', 't3');\n  }",
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
        "fileExtension": ".js",
        "baseName": "simple_hooks.cy.js",
        "fileName": "simple_hooks",
        "specFileExtension": ".cy.js",
        "relativeToCommonRoot": "simple_hooks.cy.js",
        "specType": "integration",
        "name": "cypress/e2e/simple_hooks.cy.js",
        "relative": "cypress/e2e/simple_hooks.cy.js",
        "absolute": "/foo/bar/.projects/e2e/cypress/e2e/simple_hooks.cy.js"
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
          "body": "() => {\n    cy.wrap(true, {\n      timeout: 100\n    }).should('be.false');\n  }",
          "displayError": "AssertionError: Timed out retrying after 100ms: expected true to be false\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "AssertionError",
                "message": "Timed out retrying after 100ms: expected true to be false",
                "stack": "[stack trace lines]"
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing.cy.js/simple failing spec -- fails1 (failed).png",
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
          "body": "() => {\n    throw new Error('fails2');\n  }",
          "displayError": "Error: fails2\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fails2",
                "stack": "[stack trace lines]"
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing.cy.js/simple failing spec -- fails2 (failed).png",
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
        "fileExtension": ".js",
        "baseName": "simple_failing.cy.js",
        "fileName": "simple_failing",
        "specFileExtension": ".cy.js",
        "relativeToCommonRoot": "simple_failing.cy.js",
        "specType": "integration",
        "name": "cypress/e2e/simple_failing.cy.js",
        "relative": "cypress/e2e/simple_failing.cy.js",
        "absolute": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing.cy.js"
      },
      "shouldUploadVideo": true
    },
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
          "body": "() => {\n      throw new Error('fail1');\n    }"
        },
        {
          "hookName": "after each",
          "title": [
            "\"after each\" hook"
          ],
          "body": "() => {\n      throw new Error('fail2');\n    }"
        },
        {
          "hookName": "after all",
          "title": [
            "\"after all\" hook"
          ],
          "body": "() => {\n      throw new Error('fail3');\n    }"
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
          "body": "() => {}",
          "displayError": "Error: fail1\n\nBecause this error occurred during a `before each` hook we are skipping the remaining tests in the current suite: `beforeEach hooks`\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fail1\n\nBecause this error occurred during a `before each` hook we are skipping the remaining tests in the current suite: `beforeEach hooks`",
                "stack": "[stack trace lines]"
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- beforeEach hooks -- never gets here -- before each hook (failed).png",
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
          "body": "() => {}",
          "displayError": "Error: fail2\n\nBecause this error occurred during a `after each` hook we are skipping the remaining tests in the current suite: `afterEach hooks`\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fail2\n\nBecause this error occurred during a `after each` hook we are skipping the remaining tests in the current suite: `afterEach hooks`",
                "stack": "[stack trace lines]"
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- afterEach hooks -- runs this -- after each hook (failed).png",
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
          "body": "() => {}",
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
          "body": "() => {}",
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
          "body": "() => {}",
          "displayError": "Error: fail3\n\nBecause this error occurred during a `after all` hook we are skipping the remaining tests in the current suite: `after hooks`\n      [stack trace lines]",
          "attempts": [
            {
              "state": "failed",
              "error": {
                "name": "Error",
                "message": "fail3\n\nBecause this error occurred during a `after all` hook we are skipping the remaining tests in the current suite: `after hooks`",
                "stack": "[stack trace lines]"
              },
              "videoTimestamp": null,
              "duration": 1234,
              "startedAt": "2018-02-01T20:14:19.323Z",
              "screenshots": [
                {
                  "name": null,
                  "takenAt": "2018-02-01T20:14:19.323Z",
                  "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- after hooks -- fails on this -- after all hook (failed).png",
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
        "fileExtension": ".js",
        "baseName": "simple_failing_hook.cy.js",
        "fileName": "simple_failing_hook",
        "specFileExtension": ".cy.js",
        "relativeToCommonRoot": "simple_failing_hook.cy.js",
        "specType": "integration",
        "name": "cypress/e2e/simple_failing_hook.cy.js",
        "relative": "cypress/e2e/simple_failing_hook.cy.js",
        "absolute": "/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js"
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
