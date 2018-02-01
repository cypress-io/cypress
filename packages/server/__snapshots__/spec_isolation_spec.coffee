exports['e2e spec_isolation failing 1'] = {
  "startedTestsAt": "2018-02-01T20:14:19.323Z",
  "endedTestsAt": "2018-02-01T20:14:22.458Z",
  "totalDuration": 3734,
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
        "end": "2018-02-01T20:14:19.936Z",
        "duration": 613
      },
      "reporter": "spec",
      "reporterStats": {
        "suites": 5,
        "tests": 4,
        "passes": 3,
        "pending": 1,
        "failures": 3,
        "start": "2018-02-01T20:14:19.339Z",
        "end": "2018-02-01T20:14:19.945Z",
        "duration": 606
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
          "clientId": "r4",
          "title": [
            "simple failing hook spec",
            "beforeEach hooks",
            "never gets here"
          ],
          "state": "failed",
          "body": "function () {}",
          "stack": "Error: fail1\n\nBecause this error occurred during a 'before each' hook we are skipping the remaining tests in the current suite: 'beforeEach hooks'\n    at Context.<anonymous> (http://localhost:56624/__cypress/tests?p=cypress/integration/simple_failing_hook_spec.coffee-848:5:13)",
          "error": "fail1\n\nBecause this error occurred during a 'before each' hook we are skipping the remaining tests in the current suite: 'beforeEach hooks'",
          "timings": {
            "lifecycle": 32,
            "before each": [
              {
                "hookId": "h1",
                "fnDuration": 1,
                "afterFnDuration": 167
              }
            ]
          },
          "failedFromHookId": "h1",
          "wallClockDuration": 205
        },
        {
          "clientId": "r6",
          "title": [
            "simple failing hook spec",
            "pending",
            "is pending"
          ],
          "state": "pending",
          "body": "",
          "wallClockDuration": null
        },
        {
          "clientId": "r8",
          "title": [
            "simple failing hook spec",
            "afterEach hooks",
            "runs this"
          ],
          "state": "failed",
          "body": "function () {}",
          "stack": "Error: fail2\n\nBecause this error occurred during a 'after each' hook we are skipping the remaining tests in the current suite: 'afterEach hooks'\n    at Context.<anonymous> (http://localhost:56624/__cypress/tests?p=cypress/integration/simple_failing_hook_spec.coffee-848:14:13)",
          "error": "fail2\n\nBecause this error occurred during a 'after each' hook we are skipping the remaining tests in the current suite: 'afterEach hooks'",
          "timings": {
            "lifecycle": 17,
            "test": {
              "fnDuration": 0,
              "afterFnDuration": 1
            },
            "after each": [
              {
                "hookId": "h2",
                "fnDuration": 1,
                "afterFnDuration": 153
              }
            ]
          },
          "failedFromHookId": "h2",
          "wallClockDuration": 179
        },
        {
          "title": [
            "simple failing hook spec",
            "afterEach hooks",
            "does not run this"
          ],
          "state": "skipped",
          "body": "function () {}"
        },
        {
          "clientId": "r11",
          "title": [
            "simple failing hook spec",
            "after hooks",
            "runs this"
          ],
          "state": "passed",
          "body": "function () {}",
          "timings": {
            "lifecycle": 6,
            "test": {
              "fnDuration": 0,
              "afterFnDuration": 0
            }
          },
          "wallClockDuration": 8
        },
        {
          "clientId": "r12",
          "title": [
            "simple failing hook spec",
            "after hooks",
            "fails on this"
          ],
          "state": "failed",
          "body": "function () {}",
          "stack": "Error: fail3\n\nBecause this error occurred during a 'after all' hook we are skipping the remaining tests in the current suite: 'after hooks'\n    at Context.<anonymous> (http://localhost:56624/__cypress/tests?p=cypress/integration/simple_failing_hook_spec.coffee-848:21:13)",
          "error": "fail3\n\nBecause this error occurred during a 'after all' hook we are skipping the remaining tests in the current suite: 'after hooks'",
          "timings": {
            "lifecycle": 4,
            "test": {
              "fnDuration": 0,
              "afterFnDuration": 0
            },
            "after all": [
              {
                "hookId": "h3",
                "fnDuration": 0,
                "afterFnDuration": 176
              }
            ]
          },
          "failedFromHookId": "h3",
          "wallClockDuration": 184
        }
      ],
      "video": "/Users/bmann/Dev/cypress/packages/server/.projects/e2e/cypress/videos/simple_failing_hook_spec.coffee.mp4",
      "screenshots": [
        {
          "clientId": "c91b34f1-ac7f-4cf1-a7ec-97aff7ba399e",
          "testId": "r4",
          "testTitle": "simple failing hook spec /// beforeEach hooks /// never gets here /// \"before each\" hook",
          "path": "/Users/bmann/Dev/cypress/packages/server/.projects/e2e/cypress/screenshots/simple failing hook spec -- beforeEach hooks -- never gets here -- before each hook.png",
          "height": 720,
          "width": 1280
        },
        {
          "clientId": "556a492e-ac0b-4e92-b96b-7e6bd448312d",
          "testId": "r8",
          "testTitle": "simple failing hook spec /// afterEach hooks /// runs this /// \"after each\" hook",
          "path": "/Users/bmann/Dev/cypress/packages/server/.projects/e2e/cypress/screenshots/simple failing hook spec -- afterEach hooks -- runs this -- after each hook.png",
          "height": 720,
          "width": 1280
        },
        {
          "clientId": "9a17d4f3-57ab-4139-a2dd-6a7a988214f7",
          "testId": "r12",
          "testTitle": "simple failing hook spec /// after hooks /// fails on this /// \"after all\" hook",
          "path": "/Users/bmann/Dev/cypress/packages/server/.projects/e2e/cypress/screenshots/simple failing hook spec -- after hooks -- fails on this -- after all hook.png",
          "height": 720,
          "width": 1280
        }
      ],
      "spec": "cypress/integration/simple_failing_hook_spec.coffee"
    },
    {
      "stats": {
        "suites": 1,
        "tests": 2,
        "passes": 0,
        "pending": 0,
        "skipped": 0,
        "failures": 2,
        "start": "2018-02-01T20:14:27.031Z",
        "end": "2018-02-01T20:14:27.497Z",
        "duration": 466
      },
      "reporter": "spec",
      "reporterStats": {
        "suites": 1,
        "tests": 2,
        "passes": 0,
        "pending": 0,
        "failures": 2,
        "start": "2018-02-01T20:14:27.038Z",
        "end": "2018-02-01T20:14:27.506Z",
        "duration": 468
      },
      "hooks": [],
      "tests": [
        {
          "clientId": "r3",
          "title": [
            "simple failing spec",
            "fails1"
          ],
          "state": "failed",
          "body": "function () {\n    return cy.wrap(true, {\n      timeout: 100\n    }).should(\"be.false\");\n  }",
          "stack": "CypressError: Timed out retrying: expected true to be false\n    at Object.cypressErr (http://localhost:56624/__cypress/runner/cypress_runner.js:65909:11)\n    at Object.throwErr (http://localhost:56624/__cypress/runner/cypress_runner.js:65874:18)\n    at Object.throwErrByPath (http://localhost:56624/__cypress/runner/cypress_runner.js:65901:17)\n    at retry (http://localhost:56624/__cypress/runner/cypress_runner.js:59938:16)\n    at http://localhost:56624/__cypress/runner/cypress_runner.js:52456:18\n    at tryCatcher (http://localhost:56624/__cypress/runner/cypress_runner.js:6268:23)\n    at Promise._settlePromiseFromHandler (http://localhost:56624/__cypress/runner/cypress_runner.js:4290:31)\n    at Promise._settlePromise (http://localhost:56624/__cypress/runner/cypress_runner.js:4347:18)\n    at Promise._settlePromise0 (http://localhost:56624/__cypress/runner/cypress_runner.js:4392:10)\n    at Promise._settlePromises (http://localhost:56624/__cypress/runner/cypress_runner.js:4467:18)\n    at Async._drainQueue (http://localhost:56624/__cypress/runner/cypress_runner.js:1200:16)\n    at Async._drainQueues (http://localhost:56624/__cypress/runner/cypress_runner.js:1210:10)\n    at Async.drainQueues (http://localhost:56624/__cypress/runner/cypress_runner.js:1084:14)",
          "error": "Timed out retrying: expected true to be false",
          "timings": {
            "lifecycle": 19,
            "test": {
              "fnDuration": 114,
              "afterFnDuration": 164
            }
          },
          "wallClockDuration": 301
        },
        {
          "clientId": "r4",
          "title": [
            "simple failing spec",
            "fails2"
          ],
          "state": "failed",
          "body": "function () {\n    throw new Error(\"fails2\");\n  }",
          "stack": "Error: fails2\n    at Context.<anonymous> (http://localhost:56624/__cypress/tests?p=cypress/integration/simple_failing_spec.coffee-768:9:11)",
          "error": "fails2",
          "timings": {
            "lifecycle": 11,
            "test": {
              "fnDuration": 0,
              "afterFnDuration": 131
            }
          },
          "wallClockDuration": 144
        }
      ],
      "video": "/Users/bmann/Dev/cypress/packages/server/.projects/e2e/cypress/videos/simple_failing_spec.coffee.mp4",
      "screenshots": [
        {
          "clientId": "7671fa6e-1b13-49c3-97e7-87a05ade2b89",
          "testId": "r3",
          "testTitle": "simple failing spec /// fails1",
          "path": "/Users/bmann/Dev/cypress/packages/server/.projects/e2e/cypress/screenshots/simple failing spec -- fails1.png",
          "height": 720,
          "width": 1280
        },
        {
          "clientId": "8fb665e1-5cf6-4c88-a81c-c40a0e650c6b",
          "testId": "r4",
          "testTitle": "simple failing spec /// fails2",
          "path": "/Users/bmann/Dev/cypress/packages/server/.projects/e2e/cypress/screenshots/simple failing spec -- fails2.png",
          "height": 720,
          "width": 1280
        }
      ],
      "spec": "cypress/integration/simple_failing_spec.coffee"
    },
    {
      "stats": {
        "suites": 1,
        "tests": 3,
        "passes": 3,
        "pending": 0,
        "skipped": 0,
        "failures": 0,
        "start": "2018-02-01T20:14:23.884Z",
        "end": "2018-02-01T20:14:25.449Z",
        "duration": 1565
      },
      "reporter": "spec",
      "reporterStats": {
        "suites": 1,
        "tests": 3,
        "passes": 3,
        "pending": 0,
        "failures": 0,
        "start": "2018-02-01T20:14:23.894Z",
        "end": "2018-02-01T20:14:25.457Z",
        "duration": 1563
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
          "clientId": "r3",
          "title": [
            "simple hooks spec",
            "t1"
          ],
          "state": "passed",
          "body": "function () {\n    return cy.wrap(\"t1\").should(\"eq\", \"t1\");\n  }",
          "timings": {
            "lifecycle": 23,
            "before all": [
              {
                "hookId": "h1",
                "fnDuration": 113,
                "afterFnDuration": 1
              }
            ],
            "before each": [
              {
                "hookId": "h2",
                "fnDuration": 208,
                "afterFnDuration": 0
              }
            ],
            "test": {
              "fnDuration": 14,
              "afterFnDuration": 0
            },
            "after each": [
              {
                "hookId": "h3",
                "fnDuration": 206,
                "afterFnDuration": 0
              }
            ]
          },
          "wallClockDuration": 576
        },
        {
          "clientId": "r4",
          "title": [
            "simple hooks spec",
            "t2"
          ],
          "state": "passed",
          "body": "function () {\n    return cy.wrap(\"t2\").should(\"eq\", \"t2\");\n  }",
          "timings": {
            "lifecycle": 9,
            "before each": [
              {
                "hookId": "h2",
                "fnDuration": 203,
                "afterFnDuration": 0
              }
            ],
            "test": {
              "fnDuration": 5,
              "afterFnDuration": 0
            },
            "after each": [
              {
                "hookId": "h3",
                "fnDuration": 204,
                "afterFnDuration": 0
              }
            ]
          },
          "wallClockDuration": 427
        },
        {
          "clientId": "r5",
          "title": [
            "simple hooks spec",
            "t3"
          ],
          "state": "passed",
          "body": "function () {\n    return cy.wrap(\"t3\").should(\"eq\", \"t3\");\n  }",
          "timings": {
            "lifecycle": 11,
            "before each": [
              {
                "hookId": "h2",
                "fnDuration": 205,
                "afterFnDuration": 0
              }
            ],
            "test": {
              "fnDuration": 3,
              "afterFnDuration": 1
            },
            "after each": [
              {
                "hookId": "h3",
                "fnDuration": 202,
                "afterFnDuration": 0
              }
            ],
            "after all": [
              {
                "hookId": "h4",
                "fnDuration": 103,
                "afterFnDuration": 1
              }
            ]
          },
          "wallClockDuration": 530
        }
      ],
      "video": "/Users/bmann/Dev/cypress/packages/server/.projects/e2e/cypress/videos/simple_hooks_spec.coffee.mp4",
      "screenshots": [],
      "spec": "cypress/integration/simple_hooks_spec.coffee"
    },
    {
      "stats": {
        "suites": 1,
        "tests": 1,
        "passes": 1,
        "pending": 0,
        "skipped": 0,
        "failures": 0,
        "start": "2018-02-01T20:14:21.368Z",
        "end": "2018-02-01T20:14:22.458Z",
        "duration": 1090
      },
      "reporter": "spec",
      "reporterStats": {
        "suites": 1,
        "tests": 1,
        "passes": 1,
        "pending": 0,
        "failures": 0,
        "start": "2018-02-01T20:14:21.378Z",
        "end": "2018-02-01T20:14:22.469Z",
        "duration": 1091
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
          "clientId": "r3",
          "title": [
            "simple passing spec",
            "passes"
          ],
          "state": "passed",
          "body": "function () {\n    return cy.wrap(true).should(\"be.true\");\n  }",
          "timings": {
            "lifecycle": 18,
            "before each": [
              {
                "hookId": "h1",
                "fnDuration": 1014,
                "afterFnDuration": 1
              }
            ],
            "test": {
              "fnDuration": 29,
              "afterFnDuration": 0
            }
          },
          "wallClockDuration": 1073
        }
      ],
      "video": "/Users/bmann/Dev/cypress/packages/server/.projects/e2e/cypress/videos/simple_passing_spec.coffee.mp4",
      "screenshots": [],
      "spec": "cypress/integration/simple_passing_spec.coffee"
    }
  ],
  "browserName": "chrome",
  "browserVersion": "41.2.3.4",
  "osName": "darwin",
  "osVersion": "1.2.3.4",
  "cypressVersion": "2.0.0",
  "schemaVersion": 1,
  "config": {}
}

