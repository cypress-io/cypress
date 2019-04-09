exports['e2e spec_isolation failing 1'] = {
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
        "wallClockDuration": 1234,
        "retried": []
      },
      "reporter": "spec",
      "reporterStats": {
        "suites": 5,
        "tests": 4,
        "passes": 3,
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
          "body": "function () {\n      throw new Error(\"fail1\");\n    }"
        },
        {
          "hookId": "h2",
          "hookName": "after each",
          "title": [
            "\"after each\" hook"
          ],
          "body": "function () {\n      throw new Error(\"fail2\");\n    }"
        },
        {
          "hookId": "h3",
          "hookName": "after all",
          "title": [
            "\"after all\" hook"
          ],
          "body": "function () {\n      throw new Error(\"fail3\");\n    }"
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
          "body": "function () {}",
          "stack": "Error: fail1\n\nBecause this error occurred during a 'before each' hook we are skipping the remaining tests in the current suite: 'beforeEach hooks'\n    at stack trace line",
          "error": "fail1\n\nBecause this error occurred during a 'before each' hook we are skipping the remaining tests in the current suite: 'beforeEach hooks'",
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
          "videoTimestamp": 9999,
          "attemptIndex": 0
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
          "stack": null,
          "error": null,
          "timings": null,
          "failedFromHookId": null,
          "wallClockStartedAt": null,
          "wallClockDuration": null,
          "videoTimestamp": null,
          "attemptIndex": 0
        },
        {
          "testId": "r8",
          "title": [
            "simple failing hook spec",
            "afterEach hooks",
            "runs this"
          ],
          "state": "failed",
          "body": "function () {}",
          "stack": "Error: fail2\n\nBecause this error occurred during a 'after each' hook we are skipping the remaining tests in the current suite: 'afterEach hooks'\n    at stack trace line",
          "error": "fail2\n\nBecause this error occurred during a 'after each' hook we are skipping the remaining tests in the current suite: 'afterEach hooks'",
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
          "videoTimestamp": 9999,
          "attemptIndex": 0
        },
        {
          "testId": "r9",
          "title": [
            "simple failing hook spec",
            "afterEach hooks",
            "does not run this"
          ],
          "state": "skipped",
          "body": "function () {}",
          "stack": null,
          "error": null,
          "timings": null,
          "failedFromHookId": null,
          "wallClockStartedAt": null,
          "wallClockDuration": null,
          "videoTimestamp": null,
          "attemptIndex": 0
        },
        {
          "testId": "r11",
          "title": [
            "simple failing hook spec",
            "after hooks",
            "runs this"
          ],
          "state": "passed",
          "body": "function () {}",
          "stack": null,
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
          "videoTimestamp": 9999,
          "attemptIndex": 0
        },
        {
          "testId": "r12",
          "title": [
            "simple failing hook spec",
            "after hooks",
            "fails on this"
          ],
          "state": "failed",
          "body": "function () {}",
          "stack": "Error: fail3\n\nBecause this error occurred during a 'after all' hook we are skipping the remaining tests in the current suite: 'after hooks'\n    at stack trace line",
          "error": "fail3\n\nBecause this error occurred during a 'after all' hook we are skipping the remaining tests in the current suite: 'after hooks'",
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
          "videoTimestamp": 9999,
          "attemptIndex": 0
        }
      ],
      "error": null,
      "video": "/foo/bar/.projects/e2e/cypress/videos/abc123.mp4",
      "screenshots": [
        {
          "screenshotId": "some-random-id",
          "name": null,
          "testId": "r4",
          "takenAt": "2018-02-01T20:14:19.323Z",
          "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- beforeEach hooks -- never gets here -- before each hook (failed).png",
          "height": 720,
          "width": 1280
        },
        {
          "screenshotId": "some-random-id",
          "name": null,
          "testId": "r8",
          "takenAt": "2018-02-01T20:14:19.323Z",
          "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- afterEach hooks -- runs this -- after each hook (failed).png",
          "height": 720,
          "width": 1280
        },
        {
          "screenshotId": "some-random-id",
          "name": null,
          "testId": "r12",
          "takenAt": "2018-02-01T20:14:19.323Z",
          "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- after hooks -- fails on this -- after all hook (failed).png",
          "height": 720,
          "width": 1280
        }
      ],
      "spec": {
        "name": "simple_failing_hook_spec.coffee",
        "relative": "cypress/integration/simple_failing_hook_spec.coffee",
        "absolute": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_hook_spec.coffee"
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
        "wallClockDuration": 1234,
        "retried": []
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
          "body": "function () {\n    return cy.wrap(true, {\n      timeout: 100\n    }).should(\"be.false\");\n  }",
          "stack": "CypressError: Timed out retrying: expected true to be false\n    at stack trace line\n    at stack trace line\n    at stack trace line\n    at stack trace line\n    at stack trace line\n    at stack trace line\n    at stack trace line\n    at stack trace line\n    at stack trace line\n    at stack trace line\n    at stack trace line\n    at stack trace line\n    at stack trace line\n    at stack trace line",
          "error": "Timed out retrying: expected true to be false",
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
          "videoTimestamp": 9999,
          "attemptIndex": 0
        },
        {
          "testId": "r4",
          "title": [
            "simple failing spec",
            "fails2"
          ],
          "state": "failed",
          "body": "function () {\n    throw new Error(\"fails2\");\n  }",
          "stack": "Error: fails2\n    at stack trace line",
          "error": "fails2",
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
          "videoTimestamp": 9999,
          "attemptIndex": 0
        }
      ],
      "error": null,
      "video": "/foo/bar/.projects/e2e/cypress/videos/abc123.mp4",
      "screenshots": [
        {
          "screenshotId": "some-random-id",
          "name": null,
          "testId": "r3",
          "takenAt": "2018-02-01T20:14:19.323Z",
          "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_spec.coffee/simple failing spec -- fails1 (failed).png",
          "height": 720,
          "width": 1280
        },
        {
          "screenshotId": "some-random-id",
          "name": null,
          "testId": "r4",
          "takenAt": "2018-02-01T20:14:19.323Z",
          "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_spec.coffee/simple failing spec -- fails2 (failed).png",
          "height": 720,
          "width": 1280
        }
      ],
      "spec": {
        "name": "simple_failing_spec.coffee",
        "relative": "cypress/integration/simple_failing_spec.coffee",
        "absolute": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_spec.coffee"
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
        "wallClockDuration": 1234,
        "retried": []
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
          "body": "function () {\n    return cy.wait(100);\n  }"
        },
        {
          "hookId": "h2",
          "hookName": "before each",
          "title": [
            "\"before each\" hook"
          ],
          "body": "function () {\n    return cy.wait(200);\n  }"
        },
        {
          "hookId": "h3",
          "hookName": "after each",
          "title": [
            "\"after each\" hook"
          ],
          "body": "function () {\n    return cy.wait(200);\n  }"
        },
        {
          "hookId": "h4",
          "hookName": "after all",
          "title": [
            "\"after all\" hook"
          ],
          "body": "function () {\n    return cy.wait(100);\n  }"
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
          "body": "function () {\n    return cy.wrap(\"t1\").should(\"eq\", \"t1\");\n  }",
          "stack": null,
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
                "hookId": "h3",
                "fnDuration": 400,
                "afterFnDuration": 200
              }
            ]
          },
          "failedFromHookId": null,
          "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
          "wallClockDuration": 1234,
          "videoTimestamp": 9999,
          "attemptIndex": 0
        },
        {
          "testId": "r4",
          "title": [
            "simple hooks spec",
            "t2"
          ],
          "state": "passed",
          "body": "function () {\n    return cy.wrap(\"t2\").should(\"eq\", \"t2\");\n  }",
          "stack": null,
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
                "hookId": "h3",
                "fnDuration": 400,
                "afterFnDuration": 200
              }
            ]
          },
          "failedFromHookId": null,
          "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
          "wallClockDuration": 1234,
          "videoTimestamp": 9999,
          "attemptIndex": 0
        },
        {
          "testId": "r5",
          "title": [
            "simple hooks spec",
            "t3"
          ],
          "state": "passed",
          "body": "function () {\n    return cy.wrap(\"t3\").should(\"eq\", \"t3\");\n  }",
          "stack": null,
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
                "hookId": "h3",
                "fnDuration": 400,
                "afterFnDuration": 200
              }
            ],
            "after all": [
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
          "videoTimestamp": 9999,
          "attemptIndex": 0
        }
      ],
      "error": null,
      "video": "/foo/bar/.projects/e2e/cypress/videos/abc123.mp4",
      "screenshots": [],
      "spec": {
        "name": "simple_hooks_spec.coffee",
        "relative": "cypress/integration/simple_hooks_spec.coffee",
        "absolute": "/foo/bar/.projects/e2e/cypress/integration/simple_hooks_spec.coffee"
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
        "wallClockDuration": 1234,
        "retried": []
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
          "body": "function () {\n    return cy.wait(1000);\n  }"
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
          "body": "function () {\n    return cy.wrap(true).should(\"be.true\");\n  }",
          "stack": null,
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
          "videoTimestamp": 9999,
          "attemptIndex": 0
        }
      ],
      "error": null,
      "video": "/foo/bar/.projects/e2e/cypress/videos/abc123.mp4",
      "screenshots": [],
      "spec": {
        "name": "simple_passing_spec.coffee",
        "relative": "cypress/integration/simple_passing_spec.coffee",
        "absolute": "/foo/bar/.projects/e2e/cypress/integration/simple_passing_spec.coffee"
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

exports['e2e spec_isolation failing with retries 1'] = {
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
        "tests": 4,
        "passes": 3,
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
          "body": "function () {\n      throw new Error(\"fail1\");\n    }"
        },
        {
          "hookId": "h2",
          "hookName": "after each",
          "title": [
            "\"after each\" hook"
          ],
          "body": "function () {\n      throw new Error(\"fail2\");\n    }"
        },
        {
          "hookId": "h3",
          "hookName": "after all",
          "title": [
            "\"after all\" hook"
          ],
          "body": "function () {\n      throw new Error(\"fail3\");\n    }"
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
          "body": "function () {}",
          "stack": "Error: fail1\n\nBecause this error occurred during a 'before each' hook we are skipping the remaining tests in the current suite: 'beforeEach hooks'\n    at stack trace line",
          "error": "fail1\n\nBecause this error occurred during a 'before each' hook we are skipping the remaining tests in the current suite: 'beforeEach hooks'",
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
          "videoTimestamp": 9999,
          "attemptIndex": 0
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
          "stack": null,
          "error": null,
          "timings": null,
          "failedFromHookId": null,
          "wallClockStartedAt": null,
          "wallClockDuration": null,
          "videoTimestamp": null,
          "attemptIndex": 0
        },
        {
          "testId": "r8",
          "title": [
            "simple failing hook spec",
            "afterEach hooks",
            "runs this"
          ],
          "state": "failed",
          "body": "function () {}",
          "stack": "Error: fail2\n\nBecause this error occurred during a 'after each' hook we are skipping the remaining tests in the current suite: 'afterEach hooks'\n    at stack trace line",
          "error": "fail2\n\nBecause this error occurred during a 'after each' hook we are skipping the remaining tests in the current suite: 'afterEach hooks'",
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
          "videoTimestamp": 9999,
          "attemptIndex": 0
        },
        {
          "testId": "r9",
          "title": [
            "simple failing hook spec",
            "afterEach hooks",
            "does not run this"
          ],
          "state": "skipped",
          "body": "function () {}",
          "stack": null,
          "error": null,
          "timings": null,
          "failedFromHookId": null,
          "wallClockStartedAt": null,
          "wallClockDuration": null,
          "videoTimestamp": null,
          "attemptIndex": 0
        },
        {
          "testId": "r11",
          "title": [
            "simple failing hook spec",
            "after hooks",
            "runs this"
          ],
          "state": "passed",
          "body": "function () {}",
          "stack": null,
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
          "videoTimestamp": 9999,
          "attemptIndex": 0
        },
        {
          "testId": "r12",
          "title": [
            "simple failing hook spec",
            "after hooks",
            "fails on this"
          ],
          "state": "failed",
          "body": "function () {}",
          "stack": "Error: fail3\n\nBecause this error occurred during a 'after all' hook we are skipping the remaining tests in the current suite: 'after hooks'\n    at stack trace line",
          "error": "fail3\n\nBecause this error occurred during a 'after all' hook we are skipping the remaining tests in the current suite: 'after hooks'",
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
          "videoTimestamp": 9999,
          "attemptIndex": 0
        }
      ],
      "error": null,
      "video": "/foo/bar/.projects/e2e/cypress/videos/abc123.mp4",
      "screenshots": [
        {
          "screenshotId": "some-random-id",
          "name": null,
          "testId": "r4",
          "takenAt": "2018-02-01T20:14:19.323Z",
          "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- beforeEach hooks -- never gets here -- before each hook (failed).png",
          "height": 720,
          "width": 1280
        },
        {
          "screenshotId": "some-random-id",
          "name": null,
          "testId": "r8",
          "takenAt": "2018-02-01T20:14:19.323Z",
          "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- afterEach hooks -- runs this -- after each hook (failed).png",
          "height": 720,
          "width": 1280
        },
        {
          "screenshotId": "some-random-id",
          "name": null,
          "testId": "r12",
          "takenAt": "2018-02-01T20:14:19.323Z",
          "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- after hooks -- fails on this -- after all hook (failed).png",
          "height": 720,
          "width": 1280
        }
      ],
      "spec": {
        "name": "simple_failing_hook_spec.coffee",
        "relative": "cypress/integration/simple_failing_hook_spec.coffee",
        "absolute": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_hook_spec.coffee"
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
          "body": "function () {\n    return cy.wrap(true, {\n      timeout: 100\n    }).should(\"be.false\");\n  }",
          "stack": "CypressError: Timed out retrying: expected true to be false\n    at stack trace line\n    at stack trace line\n    at stack trace line\n    at stack trace line\n    at stack trace line\n    at stack trace line\n    at stack trace line\n    at stack trace line\n    at stack trace line\n    at stack trace line\n    at stack trace line\n    at stack trace line\n    at stack trace line\n    at stack trace line",
          "error": "Timed out retrying: expected true to be false",
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
          "videoTimestamp": 9999,
          "attemptIndex": 0
        },
        {
          "testId": "r4",
          "title": [
            "simple failing spec",
            "fails2"
          ],
          "state": "failed",
          "body": "function () {\n    throw new Error(\"fails2\");\n  }",
          "stack": "Error: fails2\n    at stack trace line",
          "error": "fails2",
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
          "videoTimestamp": 9999,
          "attemptIndex": 0
        }
      ],
      "error": null,
      "video": "/foo/bar/.projects/e2e/cypress/videos/abc123.mp4",
      "screenshots": [
        {
          "screenshotId": "some-random-id",
          "name": null,
          "testId": "r3",
          "takenAt": "2018-02-01T20:14:19.323Z",
          "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_spec.coffee/simple failing spec -- fails1 (failed).png",
          "height": 720,
          "width": 1280
        },
        {
          "screenshotId": "some-random-id",
          "name": null,
          "testId": "r4",
          "takenAt": "2018-02-01T20:14:19.323Z",
          "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_spec.coffee/simple failing spec -- fails2 (failed).png",
          "height": 720,
          "width": 1280
        }
      ],
      "spec": {
        "name": "simple_failing_spec.coffee",
        "relative": "cypress/integration/simple_failing_spec.coffee",
        "absolute": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_spec.coffee"
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
          "body": "function () {\n    return cy.wait(100);\n  }"
        },
        {
          "hookId": "h2",
          "hookName": "before each",
          "title": [
            "\"before each\" hook"
          ],
          "body": "function () {\n    return cy.wait(200);\n  }"
        },
        {
          "hookId": "h3",
          "hookName": "after each",
          "title": [
            "\"after each\" hook"
          ],
          "body": "function () {\n    return cy.wait(200);\n  }"
        },
        {
          "hookId": "h4",
          "hookName": "after all",
          "title": [
            "\"after all\" hook"
          ],
          "body": "function () {\n    return cy.wait(100);\n  }"
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
          "body": "function () {\n    return cy.wrap(\"t1\").should(\"eq\", \"t1\");\n  }",
          "stack": null,
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
                "hookId": "h3",
                "fnDuration": 400,
                "afterFnDuration": 200
              }
            ]
          },
          "failedFromHookId": null,
          "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
          "wallClockDuration": 1234,
          "videoTimestamp": 9999,
          "attemptIndex": 0
        },
        {
          "testId": "r4",
          "title": [
            "simple hooks spec",
            "t2"
          ],
          "state": "passed",
          "body": "function () {\n    return cy.wrap(\"t2\").should(\"eq\", \"t2\");\n  }",
          "stack": null,
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
                "hookId": "h3",
                "fnDuration": 400,
                "afterFnDuration": 200
              }
            ]
          },
          "failedFromHookId": null,
          "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
          "wallClockDuration": 1234,
          "videoTimestamp": 9999,
          "attemptIndex": 0
        },
        {
          "testId": "r5",
          "title": [
            "simple hooks spec",
            "t3"
          ],
          "state": "passed",
          "body": "function () {\n    return cy.wrap(\"t3\").should(\"eq\", \"t3\");\n  }",
          "stack": null,
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
                "hookId": "h3",
                "fnDuration": 400,
                "afterFnDuration": 200
              }
            ],
            "after all": [
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
          "videoTimestamp": 9999,
          "attemptIndex": 0
        }
      ],
      "error": null,
      "video": "/foo/bar/.projects/e2e/cypress/videos/abc123.mp4",
      "screenshots": [],
      "spec": {
        "name": "simple_hooks_spec.coffee",
        "relative": "cypress/integration/simple_hooks_spec.coffee",
        "absolute": "/foo/bar/.projects/e2e/cypress/integration/simple_hooks_spec.coffee"
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
          "body": "function () {\n    return cy.wait(1000);\n  }"
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
          "body": "function () {\n    return cy.wrap(true).should(\"be.true\");\n  }",
          "stack": null,
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
          "videoTimestamp": 9999,
          "attemptIndex": 0
        }
      ],
      "error": null,
      "video": "/foo/bar/.projects/e2e/cypress/videos/abc123.mp4",
      "screenshots": [],
      "spec": {
        "name": "simple_passing_spec.coffee",
        "relative": "cypress/integration/simple_passing_spec.coffee",
        "absolute": "/foo/bar/.projects/e2e/cypress/integration/simple_passing_spec.coffee"
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
