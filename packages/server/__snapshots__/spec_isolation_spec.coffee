exports['e2e spec_isolation failing 1'] = {
  "schemaVersion": 1
  "start": "2018-01-08T23:01:51.953Z",
  "end": "2018-01-08T23:01:54.682Z",
  "duration": 2729,
  "totalTests": 4,
  "totalFailures": 3,
  "totalPasses": 2,
  "totalPending": 0,
  "runs": [
    {
      "stats": {
        "suites": 1,
        "tests": 1,
        "passes": 1,
        "pending": 0,
        "failures": 1,
        "start": "2018-01-08T23:01:51.953Z",
        "end": "2018-01-08T23:01:52.172Z",
        "duration": 219
      },
      "reporter": "spec",
      "reporterStats": {
        "suites": 1,
        "tests": 1,
        "passes": 1,
        "pending": 0,
        "failures": 1,
        "start": "2018-01-08T23:01:51.968Z",
        "end": "2018-01-08T23:01:52.180Z",
        "duration": 212
      },
      "hooks": [
        {
          "hookId": "h1",
          "title": [
            "\"after each\" hook"
          ],
          "body": "function () {\n    throw new Error('fail');\n  }"
        }
      ],
      "tests": [
        {
          "clientId": "r3",
          "title": [
            "simple failing hook spec",
            "never gets here"
          ],
          "state": "failed",
          "duration": 0,
          "start": "2018-01-08T23:01:51.968Z",
          "end": "2018-01-08T23:01:51.991Z",
          "body": "function () {}",
          "stack": "Error: fail\n\nBecause this error occurred during a 'after each' hook we are skipping the remaining tests in the current suite: 'simple failing hook spec'\n    at Context.<anonymous> (http://localhost:54113/__cypress/tests?p=cypress/integration/simple_fail\n\nBecause this error occurred during a 'after each' hook we are skipping the remaining tests in the current suite: 'simple failing hook spec'ing_hook_spec.coffee-393:4:11)",
          "error": "fail\n\nBecause this error occurred during a 'after each' hook we are skipping the remaining tests in the current suite: 'simple failing hook spec'",
          "failedFromHookId": "h1"
        },
        {
          "title": [
            "simple failing hook spec",
            "asdfasdf"
          ],
          "state": "skipped",
          "body": "function () {}"
        }
      ],
      "video": "/Users/bmann/Dev/cypress/packages/server/.projects/e2e/cypress/videos/simple_failing_hook_spec.coffee.mp4",
      "screenshots": [
        {
          "clientId": "99dbb522-d710-4794-96da-75cf7a54306a",
          "testId": "r3",
          "testTitle": "simple failing hook spec /// never gets here /// \"after each\" hook",
          "path": "/Users/bmann/Dev/cypress/packages/server/.projects/e2e/cypress/screenshots/simple failing hook spec -- never gets here -- after each hook.png",
          "height": 720,
          "width": 1280
        }
      ],
      "spec": "cypress/integration/simple_failing_hook_spec.coffee",
      "shouldUploadVideo": true
    },
    {
      "stats": {
        "suites": 1,
        "tests": 2,
        "passes": 0,
        "pending": 0,
        "failures": 2,
        "start": "2018-01-08T23:01:56.112Z",
        "end": "2018-01-08T23:01:56.495Z",
        "duration": 383
      },
      "reporter": "spec",
      "reporterStats": {
        "suites": 1,
        "tests": 2,
        "passes": 0,
        "pending": 0,
        "failures": 2,
        "start": "2018-01-08T23:01:56.118Z",
        "end": "2018-01-08T23:01:56.506Z",
        "duration": 388
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
          "duration": 125,
          "start": "2018-01-08T23:01:56.128Z",
          "end": "2018-01-08T23:01:56.401Z",
          "body": "function () {\n    return cy.wrap(true, {\n      timeout: 100\n    }).should(\"be.false\");\n  }",
          "stack": "CypressError: Timed out retrying: expected true to be false\n    at Object.cypressErr (http://localhost:54113/__cypress/runner/cypress_runner.js:65873:11)\n    at Object.throwErr (http://localhost:54113/__cypress/runner/cypress_runner.js:65838:18)\n    at Object.throwErrByPath (http://localhost:54113/__cypress/runner/cypress_runner.js:65865:17)\n    at retry (http://localhost:54113/__cypress/runner/cypress_runner.js:59938:16)\n    at http://localhost:54113/__cypress/runner/cypress_runner.js:52456:18\n    at tryCatcher (http://localhost:54113/__cypress/runner/cypress_runner.js:6268:23)\n    at Promise._settlePromiseFromHandler (http://localhost:54113/__cypress/runner/cypress_runner.js:4290:31)\n    at Promise._settlePromise (http://localhost:54113/__cypress/runner/cypress_runner.js:4347:18)\n    at Promise._settlePromise0 (http://localhost:54113/__cypress/runner/cypress_runner.js:4392:10)\n    at Promise._settlePromises (http://localhost:54113/__cypress/runner/cypress_runner.js:4467:18)\n    at Async._drainQueue (http://localhost:54113/__cypress/runner/cypress_runner.js:1200:16)\n    at Async._drainQueues (http://localhost:54113/__cypress/runner/cypress_runner.js:1210:10)\n    at Async.drainQueues (http://localhost:54113/__cypress/runner/cypress_runner.js:1084:14)",
          "error": "Timed out retrying: expected true to be false"
        },
        {
          "clientId": "r4",
          "title": [
            "simple failing spec",
            "fails2"
          ],
          "state": "failed",
          "duration": 0,
          "start": "2018-01-08T23:01:56.409Z",
          "end": "2018-01-08T23:01:56.490Z",
          "body": "function () {\n    throw new Error(\"fails2\");\n  }",
          "stack": "Error: fails2\n    at Context.<anonymous> (http://localhost:54113/__cypress/tests?p=cypress/integration/simple_failing_spec.coffee-557:9:11)",
          "error": "fails2"
        }
      ],
      "video": "/Users/bmann/Dev/cypress/packages/server/.projects/e2e/cypress/videos/simple_failing_spec.coffee.mp4",
      "screenshots": [
        {
          "clientId": "6e35023c-937b-47da-add7-8ccf257a6f50",
          "testId": "r3",
          "testTitle": "simple failing spec /// fails1",
          "path": "/Users/bmann/Dev/cypress/packages/server/.projects/e2e/cypress/screenshots/simple failing spec -- fails1.png",
          "height": 720,
          "width": 1280
        },
        {
          "clientId": "48e4bf71-4251-41ef-9760-a58d0a526e6b",
          "testId": "r4",
          "testTitle": "simple failing spec /// fails2",
          "path": "/Users/bmann/Dev/cypress/packages/server/.projects/e2e/cypress/screenshots/simple failing spec -- fails2.png",
          "height": 720,
          "width": 1280
        }
      ],
      "spec": "cypress/integration/simple_failing_spec.coffee",
      "shouldUploadVideo": true
    },
    {
      "stats": {
        "suites": 1,
        "tests": 1,
        "passes": 1,
        "pending": 0,
        "failures": 0,
        "start": "2018-01-08T23:01:53.592Z",
        "end": "2018-01-08T23:01:54.682Z",
        "duration": 1090
      },
      "reporter": "spec",
      "reporterStats": {
        "suites": 1,
        "tests": 1,
        "passes": 1,
        "pending": 0,
        "failures": 0,
        "start": "2018-01-08T23:01:53.603Z",
        "end": "2018-01-08T23:01:54.689Z",
        "duration": 1086
      },
      "hooks": [
        {
          "hookId": "h1",
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
          "duration": 1062,
          "fnDuration": 28,
          "start": "2018-01-08T23:01:54.639Z",
          "end": "2018-01-08T23:01:54.667Z",
          "body": "function () {\n    return cy.wrap(true).should(\"be.true\");\n  }",
          "timings": {
            "before each": [
              {
                "hookId": "h1",
                "duration": 1013
              }
            ]
          }
        }
      ],
      "video": "/Users/bmann/Dev/cypress/packages/server/.projects/e2e/cypress/videos/simple_passing_spec.coffee.mp4",
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
  "config": {},
  "totalSuites": 3
}
