exports['fail in [afterEach] reporter results'] = {
  "stats": {
    "suites": 1,
    "tests": 1,
    "passes": 0,
    "pending": 0,
    "skipped": 0,
    "failures": 1,
    "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
    "wallClockEndedAt": "1970-01-01T00:00:00.000Z",
    "wallClockDuration": 0
  },
  "reporter": "spec",
  "reporterStats": {
    "suites": 1,
    "tests": 1,
    "passes": 1,
    "pending": 0,
    "failures": 1,
    "start": "match.date",
    "end": "match.date",
    "duration": "match.number"
  },
  "hooks": [
    {
      "hookId": "h1",
      "hookName": "after each",
      "title": [
        "\"after each\" hook"
      ],
      "body": "[body]"
    }
  ],
  "tests": [
    {
      "testId": "r3",
      "title": [
        "suite 1",
        "test 1"
      ],
      "state": "failed",
      "body": "[body]",
      "stack": null,
      "error": null,
      "timings": {
        "lifecycle": 1,
        "test": {
          "fnDuration": 1,
          "afterFnDuration": 1
        },
        "after each": [
          {
            "hookId": "h1",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ]
      },
      "failedFromHookId": "h1",
      "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
      "wallClockDuration": 1,
      "videoTimestamp": null
    }
  ]
}

exports['fail in [afterEach] runner emit'] = [
  [
    "start",
    null
  ],
  [
    "suite",
    "{Suite}"
  ],
  [
    "suite",
    "{Suite}"
  ],
  [
    "test",
    "{Test}"
  ],
  [
    "pass",
    "{Test}"
  ],
  [
    "test end",
    "{Test}"
  ],
  [
    "hook",
    "{Object 57}"
  ],
  [
    "fail",
    "{Object 57}",
    "{Object 6}"
  ],
  [
    "test:after:run",
    "{Test}"
  ],
  [
    "suite end",
    "{Suite}"
  ],
  [
    "suite end",
    "{Suite}"
  ],
  [
    "end",
    null
  ]
]

exports['fail in [afterEach] stdout'] = `


  suite 1
    \u2713 test 1
    1) "after each" hook for "test 1"


  1 passing 
  1 failing

  1) suite 1 "after each" hook for "test 1":
     
  




`

exports['fail in [beforeEach] reporter results'] = {
  "stats": {
    "suites": 1,
    "tests": 1,
    "passes": 0,
    "pending": 0,
    "skipped": 0,
    "failures": 1,
    "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
    "wallClockEndedAt": "1970-01-01T00:00:00.000Z",
    "wallClockDuration": 0
  },
  "reporter": "spec",
  "reporterStats": {
    "suites": 1,
    "tests": 0,
    "passes": 0,
    "pending": 0,
    "failures": 1,
    "start": "match.date",
    "end": "match.date",
    "duration": "match.number"
  },
  "hooks": [
    {
      "hookId": "h1",
      "hookName": "before each",
      "title": [
        "\"before each\" hook"
      ],
      "body": "[body]"
    }
  ],
  "tests": [
    {
      "testId": "r3",
      "title": [
        "suite 1",
        "test 1"
      ],
      "state": "failed",
      "body": "[body]",
      "stack": null,
      "error": null,
      "timings": {
        "lifecycle": 1,
        "before each": [
          {
            "hookId": "h1",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ]
      },
      "failedFromHookId": "h1",
      "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
      "wallClockDuration": 1,
      "videoTimestamp": null
    }
  ]
}

exports['fail in [beforeEach] runner emit'] = [
  [
    "start",
    null
  ],
  [
    "suite",
    "{Suite}"
  ],
  [
    "suite",
    "{Suite}"
  ],
  [
    "test",
    "{Test}"
  ],
  [
    "hook",
    "{Object 54}"
  ],
  [
    "fail",
    "{Object 54}",
    "{Object 6}"
  ],
  [
    "test:after:run",
    "{Test}"
  ],
  [
    "suite end",
    "{Suite}"
  ],
  [
    "suite end",
    "{Suite}"
  ],
  [
    "end",
    null
  ]
]

exports['fail in [beforeEach] stdout'] = `


  suite 1
    1) "before each" hook for "test 1"


  0 passing 
  1 failing

  1) suite 1 "before each" hook for "test 1":
     
  




`

exports['simple_single_test reporter results'] = {
  "stats": {
    "suites": 1,
    "tests": 1,
    "passes": 1,
    "pending": 0,
    "skipped": 0,
    "failures": 0,
    "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
    "wallClockEndedAt": "1970-01-01T00:00:00.000Z",
    "wallClockDuration": 0
  },
  "reporter": "spec",
  "reporterStats": {
    "suites": 1,
    "tests": 1,
    "passes": 1,
    "pending": 0,
    "failures": 0,
    "start": "match.date",
    "end": "match.date",
    "duration": "match.number"
  },
  "hooks": [],
  "tests": [
    {
      "testId": "r3",
      "title": [
        "suite 1",
        "test 1"
      ],
      "state": "passed",
      "body": "[body]",
      "stack": null,
      "error": null,
      "timings": {
        "lifecycle": 1,
        "test": {
          "fnDuration": 1,
          "afterFnDuration": 1
        }
      },
      "failedFromHookId": null,
      "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
      "wallClockDuration": 1,
      "videoTimestamp": null
    }
  ]
}

exports['simple_single_test runner emit'] = [
  [
    "start",
    null
  ],
  [
    "suite",
    "{Suite}"
  ],
  [
    "suite",
    "{Suite}"
  ],
  [
    "test",
    "{Test}"
  ],
  [
    "pass",
    "{Test}"
  ],
  [
    "test end",
    "{Test}"
  ],
  [
    "test:after:run",
    "{Test}"
  ],
  [
    "suite end",
    "{Suite}"
  ],
  [
    "suite end",
    "{Suite}"
  ],
  [
    "end",
    null
  ]
]

exports['simple_single_test stdout'] = `


  suite 1
    \u2713 test 1


  1 passing 


`
