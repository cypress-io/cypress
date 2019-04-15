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
    "test:before:run",
    "{Test}"
  ],
  [
    "hook",
    "{Object 51}"
  ],
  [
    "fail",
    "{Object 51}",
    "{Object 6}"
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

exports['fail in [afterEach] stdout'] = `


  suite 1
    1) "after each" hook for "test 1"


  0 passing 
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
    "tests": 1,
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
    "{Object 50}"
  ],
  [
    "test:before:run",
    "{Test}"
  ],
  [
    "fail",
    "{Object 51}",
    "{Object 6}"
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

exports['fail in [beforeEach] stdout'] = `


  suite 1
    1) "before each" hook for "test 1"


  0 passing 
  1 failing

  1) suite 1 "before each" hook for "test 1":
     
  




`

exports['retry [afterEach] reporter results'] = {
  "stats": {
    "suites": 3,
    "tests": 5,
    "passes": 5,
    "pending": 0,
    "skipped": 0,
    "failures": 0,
    "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
    "wallClockEndedAt": "1970-01-01T00:00:00.000Z",
    "wallClockDuration": 0
  },
  "reporter": "spec",
  "reporterStats": {
    "suites": 3,
    "tests": 5,
    "passes": 5,
    "pending": 0,
    "failures": 0,
    "start": "match.date",
    "end": "match.date",
    "duration": "match.number"
  },
  "hooks": [
    {
      "hookId": "h1",
      "hookName": "before all",
      "title": [
        "\"before all\" hook"
      ],
      "body": "[body]"
    },
    {
      "hookId": "h2",
      "hookName": "before each",
      "title": [
        "\"before each\" hook"
      ],
      "body": "[body]"
    },
    {
      "hookId": "h3",
      "hookName": "before each",
      "title": [
        "\"before each\" hook"
      ],
      "body": "[body]"
    },
    {
      "hookId": "h4",
      "hookName": "after each",
      "title": [
        "\"after each\" hook"
      ],
      "body": "[body]"
    },
    {
      "hookId": "h5",
      "hookName": "after each",
      "title": [
        "\"after each\" hook"
      ],
      "body": "[body]"
    },
    {
      "hookId": "h6",
      "hookName": "after all",
      "title": [
        "\"after all\" hook"
      ],
      "body": "[body]"
    },
    {
      "hookId": "h7",
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
      "state": "passed",
      "body": "[body]",
      "stack": null,
      "error": null,
      "timings": {
        "lifecycle": 1,
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": 1,
            "afterFnDuration": 1
          },
          {
            "hookId": "h3",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ],
        "test": {
          "fnDuration": 1,
          "afterFnDuration": 1
        },
        "after each": [
          {
            "hookId": "h4",
            "fnDuration": 1,
            "afterFnDuration": 1
          },
          {
            "hookId": "h5",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ]
      },
      "failedFromHookId": null,
      "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
      "wallClockDuration": 1,
      "videoTimestamp": null,
      "prevAttempts": [
        {
          "state": "failed",
          "stack": null,
          "error": null,
          "timings": {
            "lifecycle": 1,
            "before all": [
              {
                "hookId": "h1",
                "fnDuration": 1,
                "afterFnDuration": 1
              }
            ],
            "before each": [
              {
                "hookId": "h2",
                "fnDuration": 1,
                "afterFnDuration": 1
              },
              {
                "hookId": "h3",
                "fnDuration": 1,
                "afterFnDuration": 1
              }
            ],
            "test": {
              "fnDuration": 1,
              "afterFnDuration": 1
            },
            "after each": [
              {
                "hookId": "h4",
                "fnDuration": 1,
                "afterFnDuration": 1
              },
              {
                "hookId": "h5",
                "fnDuration": 1,
                "afterFnDuration": 1
              }
            ]
          },
          "failedFromHookId": "h5",
          "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
          "wallClockDuration": 1,
          "videoTimestamp": null
        }
      ]
    },
    {
      "testId": "r4",
      "title": [
        "suite 1",
        "test 2"
      ],
      "state": "passed",
      "body": "[body]",
      "stack": null,
      "error": null,
      "timings": {
        "lifecycle": 1,
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": 1,
            "afterFnDuration": 1
          },
          {
            "hookId": "h3",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ],
        "test": {
          "fnDuration": 1,
          "afterFnDuration": 1
        },
        "after each": [
          {
            "hookId": "h4",
            "fnDuration": 1,
            "afterFnDuration": 1
          },
          {
            "hookId": "h5",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ]
      },
      "failedFromHookId": null,
      "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
      "wallClockDuration": 1,
      "videoTimestamp": null
    },
    {
      "testId": "r5",
      "title": [
        "suite 1",
        "test 3"
      ],
      "state": "passed",
      "body": "[body]",
      "stack": null,
      "error": null,
      "timings": {
        "lifecycle": 1,
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": 1,
            "afterFnDuration": 1
          },
          {
            "hookId": "h3",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ],
        "test": {
          "fnDuration": 1,
          "afterFnDuration": 1
        },
        "after each": [
          {
            "hookId": "h4",
            "fnDuration": 1,
            "afterFnDuration": 1
          },
          {
            "hookId": "h5",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ],
        "after all": [
          {
            "hookId": "h6",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ]
      },
      "failedFromHookId": null,
      "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
      "wallClockDuration": 1,
      "videoTimestamp": null
    },
    {
      "testId": "r7",
      "title": [
        "suite 2",
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
        },
        "after each": [
          {
            "hookId": "h7",
            "fnDuration": 1,
            "afterFnDuration": 1
          },
          {
            "hookId": "h5",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ]
      },
      "failedFromHookId": null,
      "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
      "wallClockDuration": 1,
      "videoTimestamp": null,
      "prevAttempts": [
        {
          "state": "failed",
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
                "hookId": "h7",
                "fnDuration": 1,
                "afterFnDuration": 1
              },
              {
                "hookId": "h5",
                "fnDuration": 1,
                "afterFnDuration": 1
              }
            ]
          },
          "failedFromHookId": "h7",
          "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
          "wallClockDuration": 1,
          "videoTimestamp": null
        },
        {
          "state": "failed",
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
                "hookId": "h7",
                "fnDuration": 1,
                "afterFnDuration": 1
              },
              {
                "hookId": "h5",
                "fnDuration": 1,
                "afterFnDuration": 1
              }
            ]
          },
          "failedFromHookId": "h7",
          "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
          "wallClockDuration": 1,
          "videoTimestamp": null
        }
      ]
    },
    {
      "testId": "r9",
      "title": [
        "suite 3",
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
        },
        "after each": [
          {
            "hookId": "h5",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ]
      },
      "failedFromHookId": null,
      "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
      "wallClockDuration": 1,
      "videoTimestamp": null
    }
  ]
}

exports['retry [afterEach] runner emit'] = [
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
    "hook",
    "{Object 50}"
  ],
  [
    "test:before:run",
    "{Test}"
  ],
  [
    "hook end",
    "{Object 51}"
  ],
  [
    "test",
    "{Test}"
  ],
  [
    "hook",
    "{Object 52}"
  ],
  [
    "hook end",
    "{Object 52}"
  ],
  [
    "hook",
    "{Object 52}"
  ],
  [
    "hook end",
    "{Object 52}"
  ],
  [
    "hook",
    "{Object 52}"
  ],
  [
    "hook end",
    "{Object 52}"
  ],
  [
    "hook",
    "{Object 52}"
  ],
  [
    "hook end",
    "{Object 53}"
  ],
  [
    "test:after:run",
    "{Test}"
  ],
  [
    "hook",
    "{Object 56}"
  ],
  [
    "test:before:run",
    "{Test}"
  ],
  [
    "hook end",
    "{Object 55}"
  ],
  [
    "hook",
    "{Object 55}"
  ],
  [
    "hook end",
    "{Object 55}"
  ],
  [
    "hook",
    "{Object 55}"
  ],
  [
    "hook end",
    "{Object 55}"
  ],
  [
    "hook",
    "{Object 56}"
  ],
  [
    "hook end",
    "{Object 56}"
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
    "test",
    "{Test}"
  ],
  [
    "hook",
    "{Object 50}"
  ],
  [
    "test:before:run",
    "{Test}"
  ],
  [
    "hook end",
    "{Object 51}"
  ],
  [
    "hook",
    "{Object 51}"
  ],
  [
    "hook end",
    "{Object 51}"
  ],
  [
    "hook",
    "{Object 51}"
  ],
  [
    "hook end",
    "{Object 51}"
  ],
  [
    "hook",
    "{Object 52}"
  ],
  [
    "hook end",
    "{Object 52}"
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
    "test",
    "{Test}"
  ],
  [
    "hook",
    "{Object 50}"
  ],
  [
    "test:before:run",
    "{Test}"
  ],
  [
    "hook end",
    "{Object 51}"
  ],
  [
    "hook",
    "{Object 51}"
  ],
  [
    "hook end",
    "{Object 51}"
  ],
  [
    "hook",
    "{Object 51}"
  ],
  [
    "hook end",
    "{Object 51}"
  ],
  [
    "hook",
    "{Object 52}"
  ],
  [
    "hook end",
    "{Object 52}"
  ],
  [
    "hook",
    "{Object 51}"
  ],
  [
    "hook end",
    "{Object 51}"
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
    "suite",
    "{Suite}"
  ],
  [
    "test",
    "{Test}"
  ],
  [
    "test:before:run",
    "{Test}"
  ],
  [
    "hook",
    "{Object 51}"
  ],
  [
    "hook end",
    "{Object 52}"
  ],
  [
    "hook",
    "{Object 52}"
  ],
  [
    "hook end",
    "{Object 52}"
  ],
  [
    "test:after:run",
    "{Test}"
  ],
  [
    "test:before:run",
    "{Test}"
  ],
  [
    "hook",
    "{Object 56}"
  ],
  [
    "hook end",
    "{Object 56}"
  ],
  [
    "hook",
    "{Object 56}"
  ],
  [
    "hook end",
    "{Object 56}"
  ],
  [
    "test:after:run",
    "{Test}"
  ],
  [
    "test:before:run",
    "{Test}"
  ],
  [
    "hook",
    "{Object 56}"
  ],
  [
    "hook end",
    "{Object 56}"
  ],
  [
    "hook",
    "{Object 56}"
  ],
  [
    "hook end",
    "{Object 56}"
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
    "suite",
    "{Suite}"
  ],
  [
    "test",
    "{Test}"
  ],
  [
    "test:before:run",
    "{Test}"
  ],
  [
    "hook",
    "{Object 52}"
  ],
  [
    "hook end",
    "{Object 52}"
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

exports['retry [afterEach] stdout'] = `


  suite 1
    \u2713 test 1
    \u2713 test 2
    \u2713 test 3

  suite 2
    \u2713 test 1

  suite 3
    \u2713 test 1


  5 passing 


`

exports['retry [beforeEach] reporter results'] = {
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
  "hooks": [
    {
      "hookId": "h1",
      "hookName": "before all",
      "title": [
        "\"before all\" hook"
      ],
      "body": "[body]"
    },
    {
      "hookId": "h2",
      "hookName": "before each",
      "title": [
        "\"before each\" hook"
      ],
      "body": "[body]"
    },
    {
      "hookId": "h3",
      "hookName": "before each",
      "title": [
        "\"before each\" hook"
      ],
      "body": "[body]"
    },
    {
      "hookId": "h4",
      "hookName": "before each",
      "title": [
        "\"before each\" hook"
      ],
      "body": "[body]"
    },
    {
      "hookId": "h5",
      "hookName": "after each",
      "title": [
        "\"after each\" hook"
      ],
      "body": "[body]"
    },
    {
      "hookId": "h6",
      "hookName": "after all",
      "title": [
        "\"after all\" hook"
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
      "state": "passed",
      "body": "[body]",
      "stack": null,
      "error": null,
      "timings": {
        "lifecycle": 1,
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": 1,
            "afterFnDuration": 1
          },
          {
            "hookId": "h3",
            "fnDuration": 1,
            "afterFnDuration": 1
          },
          {
            "hookId": "h4",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ],
        "test": {
          "fnDuration": 1,
          "afterFnDuration": 1
        },
        "after each": [
          {
            "hookId": "h5",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ],
        "after all": [
          {
            "hookId": "h6",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ]
      },
      "failedFromHookId": null,
      "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
      "wallClockDuration": 1,
      "videoTimestamp": null,
      "prevAttempts": [
        {
          "state": "failed",
          "stack": null,
          "error": null,
          "timings": {
            "lifecycle": 1,
            "before all": [
              {
                "hookId": "h1",
                "fnDuration": 1,
                "afterFnDuration": 1
              }
            ],
            "before each": [
              {
                "hookId": "h2",
                "fnDuration": 1,
                "afterFnDuration": 1
              },
              {
                "hookId": "h3",
                "fnDuration": 1,
                "afterFnDuration": 1
              }
            ],
            "test": {
              "fnDuration": 1,
              "afterFnDuration": 1
            }
          },
          "failedFromHookId": "h3",
          "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
          "wallClockDuration": 1,
          "videoTimestamp": null
        }
      ]
    }
  ]
}

exports['retry [beforeEach] runner emit'] = [
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
    "hook",
    "{Object 50}"
  ],
  [
    "test:before:run",
    "{Test}"
  ],
  [
    "hook end",
    "{Object 51}"
  ],
  [
    "test",
    "{Test}"
  ],
  [
    "hook",
    "{Object 52}"
  ],
  [
    "hook end",
    "{Object 52}"
  ],
  [
    "hook",
    "{Object 52}"
  ],
  [
    "hook end",
    "{Object 53}"
  ],
  [
    "hook",
    "{Object 52}"
  ],
  [
    "hook end",
    "{Object 52}"
  ],
  [
    "hook",
    "{Object 52}"
  ],
  [
    "hook end",
    "{Object 52}"
  ],
  [
    "test:after:run",
    "{Test}"
  ],
  [
    "hook",
    "{Object 56}"
  ],
  [
    "test:before:run",
    "{Test}"
  ],
  [
    "hook end",
    "{Object 55}"
  ],
  [
    "hook",
    "{Object 56}"
  ],
  [
    "hook end",
    "{Object 56}"
  ],
  [
    "hook",
    "{Object 55}"
  ],
  [
    "hook end",
    "{Object 55}"
  ],
  [
    "hook",
    "{Object 55}"
  ],
  [
    "hook end",
    "{Object 55}"
  ],
  [
    "hook",
    "{Object 55}"
  ],
  [
    "hook end",
    "{Object 55}"
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

exports['retry [beforeEach] stdout'] = `


  suite 1
    \u2713 test 1


  1 passing 


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
    "test:before:run",
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

exports['three tests with retry reporter results'] = {
  "stats": {
    "suites": 1,
    "tests": 3,
    "passes": 3,
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
    "tests": 3,
    "passes": 3,
    "pending": 0,
    "failures": 0,
    "start": "match.date",
    "end": "match.date",
    "duration": "match.number"
  },
  "hooks": [
    {
      "hookId": "h1",
      "hookName": "before all",
      "title": [
        "\"before all\" hook"
      ],
      "body": "[body]"
    },
    {
      "hookId": "h2",
      "hookName": "before each",
      "title": [
        "\"before each\" hook"
      ],
      "body": "[body]"
    },
    {
      "hookId": "h3",
      "hookName": "after each",
      "title": [
        "\"after each\" hook"
      ],
      "body": "[body]"
    },
    {
      "hookId": "h4",
      "hookName": "after all",
      "title": [
        "\"after all\" hook"
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
      "state": "passed",
      "body": "[body]",
      "stack": null,
      "error": null,
      "timings": {
        "lifecycle": 1,
        "before all": [
          {
            "hookId": "h1",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ],
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ],
        "test": {
          "fnDuration": 1,
          "afterFnDuration": 1
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ]
      },
      "failedFromHookId": null,
      "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
      "wallClockDuration": 1,
      "videoTimestamp": null
    },
    {
      "testId": "r4",
      "title": [
        "suite 1",
        "test 2"
      ],
      "state": "passed",
      "body": "[body]",
      "stack": null,
      "error": null,
      "timings": {
        "lifecycle": 1,
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ],
        "test": {
          "fnDuration": 1,
          "afterFnDuration": 1
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ]
      },
      "failedFromHookId": null,
      "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
      "wallClockDuration": 1,
      "videoTimestamp": null,
      "prevAttempts": [
        {
          "state": "failed",
          "stack": null,
          "error": null,
          "timings": {
            "lifecycle": 1,
            "before each": [
              {
                "hookId": "h2",
                "fnDuration": 1,
                "afterFnDuration": 1
              }
            ],
            "test": {
              "fnDuration": 1,
              "afterFnDuration": 1
            },
            "after each": [
              {
                "hookId": "h3",
                "fnDuration": 1,
                "afterFnDuration": 1
              }
            ]
          },
          "failedFromHookId": null,
          "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
          "wallClockDuration": 1,
          "videoTimestamp": null
        },
        {
          "state": "failed",
          "stack": null,
          "error": null,
          "timings": {
            "lifecycle": 1,
            "before each": [
              {
                "hookId": "h2",
                "fnDuration": 1,
                "afterFnDuration": 1
              }
            ],
            "test": {
              "fnDuration": 1,
              "afterFnDuration": 1
            },
            "after each": [
              {
                "hookId": "h3",
                "fnDuration": 1,
                "afterFnDuration": 1
              }
            ]
          },
          "failedFromHookId": null,
          "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
          "wallClockDuration": 1,
          "videoTimestamp": null
        }
      ]
    },
    {
      "testId": "r5",
      "title": [
        "suite 1",
        "test 3"
      ],
      "state": "passed",
      "body": "[body]",
      "stack": null,
      "error": null,
      "timings": {
        "lifecycle": 1,
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ],
        "test": {
          "fnDuration": 1,
          "afterFnDuration": 1
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ],
        "after all": [
          {
            "hookId": "h4",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ]
      },
      "failedFromHookId": null,
      "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
      "wallClockDuration": 1,
      "videoTimestamp": null
    }
  ]
}

exports['three tests with retry runner emit'] = [
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
    "hook",
    "{Object 50}"
  ],
  [
    "test:before:run",
    "{Test}"
  ],
  [
    "hook end",
    "{Object 51}"
  ],
  [
    "test",
    "{Test}"
  ],
  [
    "hook",
    "{Object 52}"
  ],
  [
    "hook end",
    "{Object 52}"
  ],
  [
    "hook",
    "{Object 52}"
  ],
  [
    "hook end",
    "{Object 52}"
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
    "test",
    "{Test}"
  ],
  [
    "hook",
    "{Object 50}"
  ],
  [
    "test:before:run",
    "{Test}"
  ],
  [
    "hook end",
    "{Object 51}"
  ],
  [
    "hook",
    "{Object 51}"
  ],
  [
    "hook end",
    "{Object 51}"
  ],
  [
    "test:after:run",
    "{Test}"
  ],
  [
    "hook",
    "{Object 55}"
  ],
  [
    "test:before:run",
    "{Test}"
  ],
  [
    "hook end",
    "{Object 55}"
  ],
  [
    "hook",
    "{Object 55}"
  ],
  [
    "hook end",
    "{Object 55}"
  ],
  [
    "test:after:run",
    "{Test}"
  ],
  [
    "hook",
    "{Object 56}"
  ],
  [
    "test:before:run",
    "{Test}"
  ],
  [
    "hook end",
    "{Object 55}"
  ],
  [
    "hook",
    "{Object 55}"
  ],
  [
    "hook end",
    "{Object 55}"
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
    "test",
    "{Test}"
  ],
  [
    "hook",
    "{Object 50}"
  ],
  [
    "test:before:run",
    "{Test}"
  ],
  [
    "hook end",
    "{Object 51}"
  ],
  [
    "hook",
    "{Object 51}"
  ],
  [
    "hook end",
    "{Object 51}"
  ],
  [
    "hook",
    "{Object 51}"
  ],
  [
    "hook end",
    "{Object 51}"
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

exports['three tests with retry stdout'] = `


  suite 1
    \u2713 test 1
    \u2713 test 2
    \u2713 test 3


  3 passing 


`
