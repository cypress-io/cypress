exports['e2e timings simple_passing_spec.coffee 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  simple passing spec
    ✓ passes


  1 passing


  (Tests Finished)

  - Tests:           1
  - Passes:          1
  - Failures:        0
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     0
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

exports['e2e timings simple_passing_spec.coffee 2'] = {
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
      "clientId": "r3",
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
      "wallClockStart": "2018-03-04T22:22:19.601Z",
      "wallClockDuration": 1234,
      "videoTimestamp": 1666
    }
  ],
  "video": "/foo/bar/.projects/e2e/cypress/videos/abc123.mp4",
  "screenshots": [],
  "shouldUploadVideo": true
}

exports['e2e timings simple_hooks_spec.coffee 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  simple hooks spec
    ✓ t1
    ✓ t2
    ✓ t3


  3 passing


  (Tests Finished)

  - Tests:           3
  - Passes:          3
  - Failures:        0
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     0
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

exports['e2e timings simple_hooks_spec.coffee 2'] = {
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
      "clientId": "r3",
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
      "wallClockStart": "2018-03-04T22:22:28.689Z",
      "wallClockDuration": 1234,
      "videoTimestamp": 1656
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
      "wallClockStart": "2018-03-04T22:22:29.266Z",
      "wallClockDuration": 1234,
      "videoTimestamp": 2233
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
      "wallClockStart": "2018-03-04T22:22:29.697Z",
      "wallClockDuration": 1234,
      "videoTimestamp": 2664
    }
  ],
  "video": "/foo/bar/.projects/e2e/cypress/videos/abc123.mp4",
  "screenshots": [],
  "shouldUploadVideo": true
}

exports['e2e timings simple_failing_spec.coffee 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  simple failing spec
    1) fails1
    2) fails2


  0 passing
  2 failing

  1) simple failing spec fails1:
     CypressError: Timed out retrying: expected true to be false
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line

  2) simple failing spec fails2:
     Error: fails2
      at stack trace line




  (Tests Finished)

  - Tests:           2
  - Passes:          0
  - Failures:        2
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     2
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/simple failing spec -- fails1.png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/simple failing spec -- fails2.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

exports['e2e timings simple_failing_spec.coffee 2'] = {
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
      "clientId": "r3",
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
      "wallClockStart": "2018-03-04T22:22:38.244Z",
      "wallClockDuration": 1234,
      "videoTimestamp": 1721
    },
    {
      "clientId": "r4",
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
      "wallClockStart": "2018-03-04T22:22:38.484Z",
      "wallClockDuration": 1234,
      "videoTimestamp": 1961
    }
  ],
  "video": "/foo/bar/.projects/e2e/cypress/videos/abc123.mp4",
  "screenshots": [
    {
      "clientId": "some-random-guid-number",
      "testId": "r3",
      "testTitle": "simple failing spec /// fails1",
      "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple failing spec -- fails1.png",
      "height": 720,
      "width": 1280
    },
    {
      "clientId": "some-random-guid-number",
      "testId": "r4",
      "testTitle": "simple failing spec /// fails2",
      "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple failing spec -- fails2.png",
      "height": 720,
      "width": 1280
    }
  ],
  "failingTests": [
    {
      "clientId": "r3",
      "title": [
        "simple failing spec",
        "fails1"
      ],
      "state": "failed",
      "body": "function () {\n    return cy.wrap(true, {\n      timeout: 100\n    }).should(\"be.false\");\n  }",
      "stack": "CypressError: Timed out retrying: expected true to be false\n    at Object.cypressErr (http://localhost:54476/__cypress/runner/cypress_runner.js:66833:11)\n    at Object.throwErr (http://localhost:54476/__cypress/runner/cypress_runner.js:66798:18)\n    at Object.throwErrByPath (http://localhost:54476/__cypress/runner/cypress_runner.js:66825:17)\n    at retry (http://localhost:54476/__cypress/runner/cypress_runner.js:60757:16)\n    at http://localhost:54476/__cypress/runner/cypress_runner.js:53260:18\n    at tryCatcher (http://localhost:54476/__cypress/runner/cypress_runner.js:6846:23)\n    at Promise._settlePromiseFromHandler (http://localhost:54476/__cypress/runner/cypress_runner.js:4868:31)\n    at Promise._settlePromise (http://localhost:54476/__cypress/runner/cypress_runner.js:4925:18)\n    at Promise._settlePromise0 (http://localhost:54476/__cypress/runner/cypress_runner.js:4970:10)\n    at Promise._settlePromises (http://localhost:54476/__cypress/runner/cypress_runner.js:5045:18)\n    at Async._drainQueue (http://localhost:54476/__cypress/runner/cypress_runner.js:1778:16)\n    at Async._drainQueues (http://localhost:54476/__cypress/runner/cypress_runner.js:1788:10)\n    at Async.drainQueues (http://localhost:54476/__cypress/runner/cypress_runner.js:1662:14)\n    at <anonymous>",
      "error": "Timed out retrying: expected true to be false",
      "timings": {
        "lifecycle": 35,
        "test": {
          "fnDuration": 99,
          "afterFnDuration": 100
        }
      },
      "wallClockStart": "2018-03-04T22:22:38.244Z",
      "wallClockDuration": 236,
      "videoTimestamp": 1721
    },
    {
      "clientId": "r4",
      "title": [
        "simple failing spec",
        "fails2"
      ],
      "state": "failed",
      "body": "function () {\n    throw new Error(\"fails2\");\n  }",
      "stack": "Error: fails2\n    at Context.<anonymous> (http://localhost:54476/__cypress/tests?p=cypress/integration/simple_failing_spec.coffee-422:9:11)",
      "error": "fails2",
      "timings": {
        "lifecycle": 12,
        "test": {
          "fnDuration": 0,
          "afterFnDuration": 92
        }
      },
      "wallClockStart": "2018-03-04T22:22:38.484Z",
      "wallClockDuration": 106,
      "videoTimestamp": 1961
    }
  ],
  "shouldUploadVideo": true
}

exports['e2e timings simple_failing_hook_spec.coffee 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  simple failing hook spec
    beforeEach hooks
      1) "before each" hook for "never gets here"
    pending
      - is pending
    afterEach hooks
      ✓ runs this
      2) "after each" hook for "runs this"
    after hooks
      ✓ runs this
      ✓ fails on this
      3) "after all" hook for "fails on this"


  3 passing
  1 pending
  3 failing

  1) simple failing hook spec beforeEach hooks "before each" hook for "never gets here":
     Error: fail1

Because this error occurred during a 'before each' hook we are skipping the remaining tests in the current suite: 'beforeEach hooks'
      at stack trace line

  2) simple failing hook spec afterEach hooks "after each" hook for "runs this":
     Error: fail2

Because this error occurred during a 'after each' hook we are skipping the remaining tests in the current suite: 'afterEach hooks'
      at stack trace line

  3) simple failing hook spec after hooks "after all" hook for "fails on this":
     Error: fail3

Because this error occurred during a 'after all' hook we are skipping the remaining tests in the current suite: 'after hooks'
      at stack trace line




  (Tests Finished)

  - Tests:           6
  - Passes:          1
  - Failures:        3
  - Pending:         1
  - Duration:        10 seconds
  - Screenshots:     3
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/simple failing hook spec -- beforeEach hooks -- never gets here -- before each hook.png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/simple failing hook spec -- afterEach hooks -- runs this -- after each hook.png (1280x720)
  - /foo/bar/.projects/e2e/cypress/screenshots/simple failing hook spec -- after hooks -- fails on this -- after all hook.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

exports['e2e timings simple_failing_hook_spec.coffee 2'] = {
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
      "clientId": "r4",
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
      "wallClockStart": "2018-03-04T22:22:46.837Z",
      "wallClockDuration": 1234,
      "videoTimestamp": 1852
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
      "wallClockStart": null,
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
      "wallClockStart": "2018-03-04T22:22:47.050Z",
      "wallClockDuration": 1234,
      "videoTimestamp": 2065
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
      "clientId": "r11",
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
      "wallClockStart": "2018-03-04T22:22:47.239Z",
      "wallClockDuration": 1234,
      "videoTimestamp": 2254
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
      "wallClockStart": "2018-03-04T22:22:47.245Z",
      "wallClockDuration": 1234,
      "videoTimestamp": 2260
    }
  ],
  "video": "/foo/bar/.projects/e2e/cypress/videos/abc123.mp4",
  "screenshots": [
    {
      "clientId": "some-random-guid-number",
      "testId": "r4",
      "testTitle": "simple failing hook spec /// beforeEach hooks /// never gets here /// \"before each\" hook",
      "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple failing hook spec -- beforeEach hooks -- never gets here -- before each hook.png",
      "height": 720,
      "width": 1280
    },
    {
      "clientId": "some-random-guid-number",
      "testId": "r8",
      "testTitle": "simple failing hook spec /// afterEach hooks /// runs this /// \"after each\" hook",
      "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple failing hook spec -- afterEach hooks -- runs this -- after each hook.png",
      "height": 720,
      "width": 1280
    },
    {
      "clientId": "some-random-guid-number",
      "testId": "r12",
      "testTitle": "simple failing hook spec /// after hooks /// fails on this /// \"after all\" hook",
      "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple failing hook spec -- after hooks -- fails on this -- after all hook.png",
      "height": 720,
      "width": 1280
    }
  ],
  "failingTests": [
    {
      "clientId": "r4",
      "title": [
        "simple failing hook spec",
        "beforeEach hooks",
        "never gets here"
      ],
      "state": "failed",
      "body": "function () {}",
      "stack": "Error: fail1\n\nBecause this error occurred during a 'before each' hook we are skipping the remaining tests in the current suite: 'beforeEach hooks'\n    at Context.<anonymous> (http://localhost:54516/__cypress/tests?p=cypress/integration/simple_failing_hook_spec.coffee-226:5:13)",
      "error": "fail1\n\nBecause this error occurred during a 'before each' hook we are skipping the remaining tests in the current suite: 'beforeEach hooks'",
      "timings": {
        "lifecycle": 37,
        "before each": [
          {
            "hookId": "h1",
            "fnDuration": 1,
            "afterFnDuration": 162
          }
        ]
      },
      "failedFromHookId": "h1",
      "wallClockStart": "2018-03-04T22:22:46.837Z",
      "wallClockDuration": 204,
      "videoTimestamp": 1852
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
      "stack": "Error: fail2\n\nBecause this error occurred during a 'after each' hook we are skipping the remaining tests in the current suite: 'afterEach hooks'\n    at Context.<anonymous> (http://localhost:54516/__cypress/tests?p=cypress/integration/simple_failing_hook_spec.coffee-226:14:13)",
      "error": "fail2\n\nBecause this error occurred during a 'after each' hook we are skipping the remaining tests in the current suite: 'afterEach hooks'",
      "timings": {
        "lifecycle": 9,
        "test": {
          "fnDuration": 1,
          "afterFnDuration": 0
        },
        "after each": [
          {
            "hookId": "h2",
            "fnDuration": 0,
            "afterFnDuration": 172
          }
        ]
      },
      "failedFromHookId": "h2",
      "wallClockStart": "2018-03-04T22:22:47.050Z",
      "wallClockDuration": 186,
      "videoTimestamp": 2065
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
      "stack": "Error: fail3\n\nBecause this error occurred during a 'after all' hook we are skipping the remaining tests in the current suite: 'after hooks'\n    at Context.<anonymous> (http://localhost:54516/__cypress/tests?p=cypress/integration/simple_failing_hook_spec.coffee-226:21:13)",
      "error": "fail3\n\nBecause this error occurred during a 'after all' hook we are skipping the remaining tests in the current suite: 'after hooks'",
      "timings": {
        "lifecycle": 3,
        "test": {
          "fnDuration": 0,
          "afterFnDuration": 0
        },
        "after all": [
          {
            "hookId": "h3",
            "fnDuration": 0,
            "afterFnDuration": 204
          }
        ]
      },
      "failedFromHookId": "h3",
      "wallClockStart": "2018-03-04T22:22:47.245Z",
      "wallClockDuration": 211,
      "videoTimestamp": 2260
    }
  ],
  "shouldUploadVideo": true
}

