exports['e2e spec_isolation failing 1'] = {
  "startedTestsAt": "2018-01-12T22:20:33.075Z",
  "endedTestsAt": "2018-01-12T22:20:35.946Z",
  "totalDuration": 1835,
  "totalTests": 6,
  "totalFailures": 4,
  "totalPasses": 2,
  "totalPending": 1,
  "runs": [
    {
      "stats": {
        "suites": 4,
        "tests": 3,
        "passes": 1,
        "pending": 1,
        "failures": 2,
        "start": "2018-01-12T22:20:33.075Z",
        "end": "2018-01-12T22:20:33.461Z",
        "duration": 386
      },
      "reporter": "spec",
      "reporterStats": {
        "suites": 4,
        "tests": 2,
        "passes": 1,
        "pending": 1,
        "failures": 2,
        "start": "2018-01-12T22:20:33.091Z",
        "end": "2018-01-12T22:20:33.472Z",
        "duration": 381
      },
      "hooks": [
        {
          "hookId": "h1",
          "hookName": "before each",
          "title": [
            "\"before each\" hook"
          ],
          "body": "function () {\n      throw new Error('fail');\n    }"
        },
        {
          "hookId": "h2",
          "hookName": "after each",
          "title": [
            "\"after each\" hook"
          ],
          "body": "function () {\n      throw new Error('fail');\n    }"
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
          "stack": "Error: fail\n\nBecause this error occurred during a 'before each' hook we are skipping the remaining tests in the current suite: 'beforeEach hooks'\n    at Context.<anonymous> (http://localhost:64310/__cypress/tests?p=cypress/integration/simple_fail\n\nBecause this error occurred during a 'before each' hook we are skipping the remaining tests in the current suite: 'beforeEach hooks'ing_hook_spec.coffee-486:5:13)",
          "error": "fail\n\nBecause this error occurred during a 'before each' hook we are skipping the remaining tests in the current suite: 'beforeEach hooks'",
          "timings": {
            "lifecycle": 32,
            "before each": [
              {
                "hookId": "h1",
                "fnDuration": 1,
                "afterFnDuration": 154
              }
            ]
          },
          "failedFromHookId": "h1",
          "wallClockDuration": 191
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
          "stack": "Error: fail\n\nBecause this error occurred during a 'after each' hook we are skipping the remaining tests in the current suite: 'afterEach hooks'\n    at Context.<anonymous> (http://localhost:64310/__cypress/tests?p=cypress/integration/simple_fail\n\nBecause this error occurred during a 'after each' hook we are skipping the remaining tests in the current suite: 'afterEach hooks'ing_hook_spec.coffee-486:14:13)",
          "error": "fail\n\nBecause this error occurred during a 'after each' hook we are skipping the remaining tests in the current suite: 'afterEach hooks'",
          "timings": {
            "lifecycle": 14,
            "test": {
              "fnDuration": 0,
              "afterFnDuration": 1
            },
            "after each": [
              {
                "hookId": "h2",
                "fnDuration": 0,
                "afterFnDuration": 147
              }
            ]
          },
          "failedFromHookId": "h2",
          "wallClockDuration": 166
        },
        {
          "title": [
            "simple failing hook spec",
            "afterEach hooks",
            "does not run this"
          ],
          "state": "skipped",
          "body": "function () {}"
        }
      ],
      "video": "/Users/bmann/Dev/cypress/packages/server/.projects/e2e/cypress/videos/simple_failing_hook_spec.coffee.mp4",
      "screenshots": [
        {
          "clientId": "64788efb-1ece-457a-a781-b0d87bec28ab",
          "testId": "r4",
          "testTitle": "simple failing hook spec /// beforeEach hooks /// never gets here /// \"before each\" hook",
          "path": "/Users/bmann/Dev/cypress/packages/server/.projects/e2e/cypress/screenshots/simple failing hook spec -- beforeEach hooks -- never gets here -- before each hook.png",
          "height": 720,
          "width": 1280
        },
        {
          "clientId": "afda1c7c-3f25-48a7-b99f-914e09ac8bbb",
          "testId": "r8",
          "testTitle": "simple failing hook spec /// afterEach hooks /// runs this /// \"after each\" hook",
          "path": "/Users/bmann/Dev/cypress/packages/server/.projects/e2e/cypress/screenshots/simple failing hook spec -- afterEach hooks -- runs this -- after each hook.png",
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
        "failures": 2,
        "start": "2018-01-12T22:20:37.344Z",
        "end": "2018-01-12T22:20:37.707Z",
        "duration": 363
      },
      "reporter": "spec",
      "reporterStats": {
        "suites": 1,
        "tests": 2,
        "passes": 0,
        "pending": 0,
        "failures": 2,
        "start": "2018-01-12T22:20:37.349Z",
        "end": "2018-01-12T22:20:37.713Z",
        "duration": 364
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
          "stack": "CypressError: Timed out retrying: expected true to be false\n    at Object.cypressErr (http://localhost:64310/__cypress/runner/cypress_runner.js:65911:11)\n    at Object.throwErr (http://localhost:64310/__cypress/runner/cypress_runner.js:65876:18)\n    at Object.throwErrByPath (http://localhost:64310/__cypress/runner/cypress_runner.js:65903:17)\n    at retry (http://localhost:64310/__cypress/runner/cypress_runner.js:59938:16)\n    at http://localhost:64310/__cypress/runner/cypress_runner.js:52456:18\n    at tryCatcher (http://localhost:64310/__cypress/runner/cypress_runner.js:6268:23)\n    at Promise._settlePromiseFromHandler (http://localhost:64310/__cypress/runner/cypress_runner.js:4290:31)\n    at Promise._settlePromise (http://localhost:64310/__cypress/runner/cypress_runner.js:4347:18)\n    at Promise._settlePromise0 (http://localhost:64310/__cypress/runner/cypress_runner.js:4392:10)\n    at Promise._settlePromises (http://localhost:64310/__cypress/runner/cypress_runner.js:4467:18)\n    at Async._drainQueue (http://localhost:64310/__cypress/runner/cypress_runner.js:1200:16)\n    at Async._drainQueues (http://localhost:64310/__cypress/runner/cypress_runner.js:1210:10)\n    at Async.drainQueues (http://localhost:64310/__cypress/runner/cypress_runner.js:1084:14)",
          "error": "Timed out retrying: expected true to be false",
          "timings": {
            "lifecycle": 15,
            "test": {
              "fnDuration": 122,
              "afterFnDuration": 115
            }
          },
          "wallClockDuration": 256
        },
        {
          "clientId": "r4",
          "title": [
            "simple failing spec",
            "fails2"
          ],
          "state": "failed",
          "body": "function () {\n    throw new Error(\"fails2\");\n  }",
          "stack": "Error: fails2\n    at Context.<anonymous> (http://localhost:64310/__cypress/tests?p=cypress/integration/simple_failing_spec.coffee-441:9:11)",
          "error": "fails2",
          "timings": {
            "lifecycle": 8,
            "test": {
              "fnDuration": 0,
              "afterFnDuration": 77
            }
          },
          "wallClockDuration": 87
        }
      ],
      "video": "/Users/bmann/Dev/cypress/packages/server/.projects/e2e/cypress/videos/simple_failing_spec.coffee.mp4",
      "screenshots": [
        {
          "clientId": "6275bb23-7c74-4441-bdbb-697302be03e7",
          "testId": "r3",
          "testTitle": "simple failing spec /// fails1",
          "path": "/Users/bmann/Dev/cypress/packages/server/.projects/e2e/cypress/screenshots/simple failing spec -- fails1.png",
          "height": 720,
          "width": 1280
        },
        {
          "clientId": "e9bd5975-df2e-4552-8bc6-f72508791637",
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
        "tests": 1,
        "passes": 1,
        "pending": 0,
        "failures": 0,
        "start": "2018-01-12T22:20:34.860Z",
        "end": "2018-01-12T22:20:35.946Z",
        "duration": 1086
      },
      "reporter": "spec",
      "reporterStats": {
        "suites": 1,
        "tests": 1,
        "passes": 1,
        "pending": 0,
        "failures": 0,
        "start": "2018-01-12T22:20:34.868Z",
        "end": "2018-01-12T22:20:35.954Z",
        "duration": 1086
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
            "lifecycle": 19,
            "before each": [
              {
                "hookId": "h1",
                "fnDuration": 1013,
                "afterFnDuration": 0
              }
            ],
            "test": {
              "fnDuration": 26,
              "afterFnDuration": 0
            }
          },
          "wallClockDuration": 1070
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
  "config": {},
  "totalSuites": 6
}

