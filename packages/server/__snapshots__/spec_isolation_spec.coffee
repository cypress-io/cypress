exports['e2e spec_isolation failing 1'] = {
  "startedTestsAt": "2018-02-01T20:14:19.323Z",
  "endedTestsAt": "2018-02-01T20:14:19.323Z",
  "totalDuration": 5555,
  "totalSuites": 8,
  "totalTests": 12,
  "totalFailures": 5,
  "totalPasses": 5,
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
        "start": "2018-02-01T20:14:19.323Z",
        "end": "2018-02-01T20:14:19.323Z",
        "duration": 1234
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
          "wallClockStart": "2018-02-01T20:14:19.323Z",
          "wallClockDuration": 1234,
          "videoTimestamp": 9999
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
          "wallClockStart": null,
          "wallClockDuration": null
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
          "wallClockStart": "2018-02-01T20:14:19.323Z",
          "wallClockDuration": 1234,
          "videoTimestamp": 9999
        },
        {
          "title": [
            "simple failing hook spec",
            "afterEach hooks",
            "does not run this"
          ],
          "state": "skipped",
          "body": "function () {}",
          "wallClockStart": null
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
          "timings": {
            "lifecycle": 100,
            "test": {
              "fnDuration": 400,
              "afterFnDuration": 200
            }
          },
          "wallClockStart": "2018-02-01T20:14:19.323Z",
          "wallClockDuration": 1234,
          "videoTimestamp": 9999
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
          "wallClockStart": "2018-02-01T20:14:19.323Z",
          "wallClockDuration": 1234,
          "videoTimestamp": 9999
        }
      ],
      "video": "/foo/bar/.projects/e2e/cypress/videos/abc123.mp4",
      "screenshots": [
        {
          "clientId": "some-random-guid-number",
          "testId": "r4",
          "testTitle": [
            "simple failing hook spec",
            "beforeEach hooks",
            "never gets here",
            "\"before each\" hook"
          ],
          "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple failing hook spec -- beforeEach hooks -- never gets here -- before each hook.png",
          "height": 720,
          "width": 1280
        },
        {
          "clientId": "some-random-guid-number",
          "testId": "r8",
          "testTitle": [
            "simple failing hook spec",
            "afterEach hooks",
            "runs this",
            "\"after each\" hook"
          ],
          "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple failing hook spec -- afterEach hooks -- runs this -- after each hook.png",
          "height": 720,
          "width": 1280
        },
        {
          "clientId": "some-random-guid-number",
          "testId": "r12",
          "testTitle": [
            "simple failing hook spec",
            "after hooks",
            "fails on this",
            "\"after all\" hook"
          ],
          "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple failing hook spec -- after hooks -- fails on this -- after all hook.png",
          "height": 720,
          "width": 1280
        }
      ],
      "spec": "cypress/integration/simple_failing_hook_spec.coffee",
      "failingTests": [],
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
        "start": "2018-02-01T20:14:19.323Z",
        "end": "2018-02-01T20:14:19.323Z",
        "duration": 1234
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
          "wallClockStart": "2018-02-01T20:14:19.323Z",
          "wallClockDuration": 1234,
          "videoTimestamp": 9999
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
          "wallClockStart": "2018-02-01T20:14:19.323Z",
          "wallClockDuration": 1234,
          "videoTimestamp": 9999
        }
      ],
      "video": "/foo/bar/.projects/e2e/cypress/videos/abc123.mp4",
      "screenshots": [
        {
          "clientId": "some-random-guid-number",
          "testId": "r3",
          "testTitle": [
            "simple failing spec",
            "fails1"
          ],
          "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple failing spec -- fails1.png",
          "height": 720,
          "width": 1280
        },
        {
          "clientId": "some-random-guid-number",
          "testId": "r4",
          "testTitle": [
            "simple failing spec",
            "fails2"
          ],
          "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple failing spec -- fails2.png",
          "height": 720,
          "width": 1280
        }
      ],
      "spec": "cypress/integration/simple_failing_spec.coffee",
      "failingTests": [],
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
        "start": "2018-02-01T20:14:19.323Z",
        "end": "2018-02-01T20:14:19.323Z",
        "duration": 1234
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
          "wallClockStart": "2018-02-01T20:14:19.323Z",
          "wallClockDuration": 1234,
          "videoTimestamp": 9999
        },
        {
          "testId": "r4",
          "title": [
            "simple hooks spec",
            "t2"
          ],
          "state": "passed",
          "body": "function () {\n    return cy.wrap(\"t2\").should(\"eq\", \"t2\");\n  }",
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
          "wallClockStart": "2018-02-01T20:14:19.323Z",
          "wallClockDuration": 1234,
          "videoTimestamp": 9999
        },
        {
          "testId": "r5",
          "title": [
            "simple hooks spec",
            "t3"
          ],
          "state": "passed",
          "body": "function () {\n    return cy.wrap(\"t3\").should(\"eq\", \"t3\");\n  }",
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
          "wallClockStart": "2018-02-01T20:14:19.323Z",
          "wallClockDuration": 1234,
          "videoTimestamp": 9999
        }
      ],
      "video": "/foo/bar/.projects/e2e/cypress/videos/abc123.mp4",
      "screenshots": [],
      "spec": "cypress/integration/simple_hooks_spec.coffee",
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
        "start": "2018-02-01T20:14:19.323Z",
        "end": "2018-02-01T20:14:19.323Z",
        "duration": 1234
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
          "wallClockStart": "2018-02-01T20:14:19.323Z",
          "wallClockDuration": 1234,
          "videoTimestamp": 9999
        }
      ],
      "video": "/foo/bar/.projects/e2e/cypress/videos/abc123.mp4",
      "screenshots": [],
      "spec": "cypress/integration/simple_passing_spec.coffee",
      "shouldUploadVideo": true
    }
  ],
  "browserName": "chrome",
  "browserVersion": "41.2.3.4",
  "osName": "darwin",
  "osVersion": "1.2.3.4",
  "cypressVersion": "2.0.0",
  "config": {}
}

