exports['FAIL_IN_AFTER.mocha'] = [
  [
    "mocha",
    "start",
    {
      "start": "match.date"
    }
  ],
  [
    "mocha",
    "suite",
    {
      "id": "r1",
      "title": "",
      "root": true,
      "type": "suite",
      "_retries": 0
    }
  ],
  [
    "mocha",
    "suite",
    {
      "id": "r2",
      "title": "suite 1",
      "root": false,
      "type": "suite",
      "_retries": 0
    }
  ],
  [
    "mocha",
    "test",
    {
      "id": "r3",
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r3",
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "pass",
    {
      "id": "r3",
      "title": "test 1",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        }
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "test end",
    {
      "id": "r3",
      "title": "test 1",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        }
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "id": "r3",
      "title": "test 1",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "wallClockDuration": "match.number",
      "timings": {
        "lifecycle": "match.number",
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        }
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "test",
    {
      "id": "r4",
      "title": "test 2",
      "body": "[body]",
      "type": "test",
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r4",
      "title": "test 2",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r4",
      "title": "\"after all\" hook",
      "hookName": "after all",
      "hookId": "h1",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "fail",
    {
      "id": "r4",
      "title": "\"after all\" hook for \"test 2\"",
      "hookName": "after all",
      "hookId": "h1",
      "err": "{Object 6}",
      "state": "failed",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    },
    {
      "message": "[error message]",
      "name": "AssertionError",
      "stack": "match.string",
      "actual": null,
      "showDiff": false
    }
  ],
  [
    "mocha",
    "test end",
    {
      "id": "r4",
      "title": "test 2",
      "hookName": "after all",
      "err": "{Object 6}",
      "state": "failed",
      "failedFromHookId": "h1",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after all": [
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "id": "r4",
      "title": "test 2",
      "hookName": "after all",
      "err": "{Object 6}",
      "state": "failed",
      "failedFromHookId": "h1",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "wallClockDuration": "match.number",
      "timings": {
        "lifecycle": "match.number",
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after all": [
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r2",
      "title": "suite 1",
      "root": false,
      "type": "suite",
      "_retries": 0
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r1",
      "title": "",
      "root": true,
      "type": "suite",
      "_retries": 0
    }
  ],
  [
    "mocha",
    "end",
    {
      "end": "match.date"
    }
  ]
]

exports['FAIL_IN_AFTER.setRunnables'] = [
  [
    "set:runnables",
    {
      "id": "r1",
      "title": "",
      "root": true,
      "type": "suite",
      "_retries": 0,
      "tests": [],
      "suites": [
        {
          "id": "r2",
          "title": "suite 1",
          "root": false,
          "type": "suite",
          "_retries": 0,
          "tests": [
            {
              "id": "r3",
              "title": "test 1",
              "body": "[body]",
              "type": "test",
              "_currentRetry": 0,
              "_retries": 0
            },
            {
              "id": "r4",
              "title": "test 2",
              "body": "[body]",
              "type": "test",
              "_currentRetry": 0,
              "_retries": 0
            }
          ],
          "suites": []
        }
      ]
    },
    "[Function run]"
  ]
]

exports['FAIL_IN_AFTEREACH.mocha'] = [
  [
    "mocha",
    "start",
    {
      "start": "match.date"
    }
  ],
  [
    "mocha",
    "suite",
    {
      "id": "r1",
      "title": "",
      "root": true,
      "type": "suite",
      "_retries": 0
    }
  ],
  [
    "mocha",
    "suite",
    {
      "id": "r2",
      "title": "suite 1",
      "root": false,
      "type": "suite",
      "_retries": 0
    }
  ],
  [
    "mocha",
    "test",
    {
      "id": "r3",
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r3",
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h1",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "fail",
    {
      "id": "r3",
      "title": "\"after each\" hook for \"test 1\"",
      "hookName": "after each",
      "hookId": "h1",
      "err": "{Object 6}",
      "state": "failed",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    },
    {
      "message": "[error message]",
      "name": "AssertionError",
      "stack": "match.string",
      "actual": null,
      "showDiff": false
    }
  ],
  [
    "mocha",
    "test end",
    {
      "id": "r3",
      "title": "test 1",
      "hookName": "after each",
      "err": "{Object 6}",
      "state": "failed",
      "failedFromHookId": "h1",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "id": "r3",
      "title": "test 1",
      "hookName": "after each",
      "err": "{Object 6}",
      "state": "failed",
      "failedFromHookId": "h1",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "wallClockDuration": "match.number",
      "timings": {
        "lifecycle": "match.number",
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r2",
      "title": "suite 1",
      "root": false,
      "type": "suite",
      "_retries": 0
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r1",
      "title": "",
      "root": true,
      "type": "suite",
      "_retries": 0
    }
  ],
  [
    "mocha",
    "end",
    {
      "end": "match.date"
    }
  ]
]

exports['FAIL_IN_AFTEREACH.setRunnables'] = [
  [
    "set:runnables",
    {
      "id": "r1",
      "title": "",
      "root": true,
      "type": "suite",
      "_retries": 0,
      "tests": [],
      "suites": [
        {
          "id": "r2",
          "title": "suite 1",
          "root": false,
          "type": "suite",
          "_retries": 0,
          "tests": [
            {
              "id": "r3",
              "title": "test 1",
              "body": "[body]",
              "type": "test",
              "_currentRetry": 0,
              "_retries": 0
            }
          ],
          "suites": []
        }
      ]
    },
    "[Function run]"
  ]
]

exports['FAIL_IN_BEFORE.mocha'] = [
  [
    "mocha",
    "start",
    {
      "start": "match.date"
    }
  ],
  [
    "mocha",
    "suite",
    {
      "id": "r1",
      "title": "",
      "root": true,
      "type": "suite",
      "_retries": 0
    }
  ],
  [
    "mocha",
    "suite",
    {
      "id": "r2",
      "title": "suite 1",
      "root": false,
      "type": "suite",
      "_retries": 0
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"before all\" hook",
      "hookName": "before all",
      "hookId": "h1",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r3",
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "fail",
    {
      "id": "r3",
      "title": "\"before all\" hook for \"test 1\"",
      "hookName": "before all",
      "hookId": "h1",
      "err": "{Object 6}",
      "state": "failed",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    },
    {
      "message": "[error message]",
      "name": "AssertionError",
      "stack": "match.string",
      "actual": null,
      "showDiff": false
    }
  ],
  [
    "mocha",
    "test end",
    {
      "id": "r3",
      "title": "test 1",
      "hookName": "before all",
      "err": "{Object 6}",
      "state": "failed",
      "failedFromHookId": "h1",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "before all": [
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "id": "r3",
      "title": "test 1",
      "hookName": "before all",
      "err": "{Object 6}",
      "state": "failed",
      "failedFromHookId": "h1",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "wallClockDuration": "match.number",
      "timings": {
        "lifecycle": "match.number",
        "before all": [
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r2",
      "title": "suite 1",
      "root": false,
      "type": "suite",
      "_retries": 0
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r1",
      "title": "",
      "root": true,
      "type": "suite",
      "_retries": 0
    }
  ],
  [
    "mocha",
    "end",
    {
      "end": "match.date"
    }
  ]
]

exports['FAIL_IN_BEFORE.setRunnables'] = [
  [
    "set:runnables",
    {
      "id": "r1",
      "title": "",
      "root": true,
      "type": "suite",
      "_retries": 0,
      "tests": [],
      "suites": [
        {
          "id": "r2",
          "title": "suite 1",
          "root": false,
          "type": "suite",
          "_retries": 0,
          "tests": [
            {
              "id": "r3",
              "title": "test 1",
              "body": "[body]",
              "type": "test",
              "_currentRetry": 0,
              "_retries": 0
            }
          ],
          "suites": []
        }
      ]
    },
    "[Function run]"
  ]
]

exports['FAIL_IN_BEFOREEACH.mocha'] = [
  [
    "mocha",
    "start",
    {
      "start": "match.date"
    }
  ],
  [
    "mocha",
    "suite",
    {
      "id": "r1",
      "title": "",
      "root": true,
      "type": "suite",
      "_retries": 0
    }
  ],
  [
    "mocha",
    "suite",
    {
      "id": "r2",
      "title": "suite 1",
      "root": false,
      "type": "suite",
      "_retries": 0
    }
  ],
  [
    "mocha",
    "test",
    {
      "id": "r3",
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h1",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r3",
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "fail",
    {
      "id": "r3",
      "title": "\"before each\" hook for \"test 1\"",
      "hookName": "before each",
      "hookId": "h1",
      "err": "{Object 6}",
      "state": "failed",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    },
    {
      "message": "[error message]",
      "name": "AssertionError",
      "stack": "match.string",
      "actual": null,
      "showDiff": false
    }
  ],
  [
    "mocha",
    "test end",
    {
      "id": "r3",
      "title": "test 1",
      "hookName": "before each",
      "err": "{Object 6}",
      "state": "failed",
      "failedFromHookId": "h1",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "before each": [
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "id": "r3",
      "title": "test 1",
      "hookName": "before each",
      "err": "{Object 6}",
      "state": "failed",
      "failedFromHookId": "h1",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "wallClockDuration": "match.number",
      "timings": {
        "lifecycle": "match.number",
        "before each": [
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r2",
      "title": "suite 1",
      "root": false,
      "type": "suite",
      "_retries": 0
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r1",
      "title": "",
      "root": true,
      "type": "suite",
      "_retries": 0
    }
  ],
  [
    "mocha",
    "end",
    {
      "end": "match.date"
    }
  ]
]

exports['FAIL_IN_BEFOREEACH.setRunnables'] = [
  [
    "set:runnables",
    {
      "id": "r1",
      "title": "",
      "root": true,
      "type": "suite",
      "_retries": 0,
      "tests": [],
      "suites": [
        {
          "id": "r2",
          "title": "suite 1",
          "root": false,
          "type": "suite",
          "_retries": 0,
          "tests": [
            {
              "id": "r3",
              "title": "test 1",
              "body": "[body]",
              "type": "test",
              "_currentRetry": 0,
              "_retries": 0
            }
          ],
          "suites": []
        }
      ]
    },
    "[Function run]"
  ]
]

exports['FAIL_WITH_ONLY.mocha'] = [
  [
    "mocha",
    "start",
    {
      "start": "match.date"
    }
  ],
  [
    "mocha",
    "suite",
    {
      "id": "r1",
      "title": "",
      "root": true,
      "type": "suite",
      "_retries": 0
    }
  ],
  [
    "mocha",
    "suite",
    {
      "id": "r2",
      "title": "suite 1",
      "root": false,
      "type": "suite",
      "_retries": 0
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"before all\" hook",
      "hookName": "before all",
      "hookId": "h1",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r3",
      "title": "test 2",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"before all\" hook",
      "hookName": "before all",
      "hookId": "h1",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "test",
    {
      "id": "r3",
      "title": "test 2",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "before all": [
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "after all": [
          {
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "fail",
    {
      "id": "r3",
      "title": "test 2",
      "err": "{Object 6}",
      "state": "failed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "before all": [
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "after all": [
          {
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "_currentRetry": 0,
      "_retries": 0
    },
    {
      "message": "[error message]",
      "name": "AssertionError",
      "stack": "match.string",
      "actual": null,
      "showDiff": false
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"after all\" hook",
      "hookName": "after all",
      "hookId": "h4",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"after all\" hook",
      "hookName": "after all",
      "hookId": "h4",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "test end",
    {
      "id": "r3",
      "title": "test 2",
      "err": "{Object 6}",
      "state": "failed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "before all": [
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "after all": [
          {
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "id": "r3",
      "title": "test 2",
      "err": "{Object 6}",
      "state": "failed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "wallClockDuration": "match.number",
      "timings": {
        "lifecycle": "match.number",
        "before all": [
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "after all": [
          {
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r2",
      "title": "suite 1",
      "root": false,
      "type": "suite",
      "_retries": 0
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r1",
      "title": "",
      "root": true,
      "type": "suite",
      "_retries": 0
    }
  ],
  [
    "mocha",
    "end",
    {
      "end": "match.date"
    }
  ]
]

exports['FAIL_WITH_ONLY.setRunnables'] = [
  [
    "set:runnables",
    {
      "id": "r1",
      "title": "",
      "root": true,
      "type": "suite",
      "_retries": 0,
      "tests": [],
      "suites": [
        {
          "id": "r2",
          "title": "suite 1",
          "root": false,
          "type": "suite",
          "_retries": 0,
          "tests": [
            {
              "id": "r3",
              "title": "test 2",
              "body": "[body]",
              "type": "test",
              "_currentRetry": 0,
              "_retries": 0
            }
          ],
          "suites": []
        }
      ]
    },
    "[Function run]"
  ]
]

exports['PASS_WITH_ONLY.mocha'] = [
  [
    "mocha",
    "start",
    {
      "start": "match.date"
    }
  ],
  [
    "mocha",
    "suite",
    {
      "id": "r1",
      "title": "",
      "root": true,
      "type": "suite",
      "_retries": 0
    }
  ],
  [
    "mocha",
    "suite",
    {
      "id": "r2",
      "title": "suite 1",
      "root": false,
      "type": "suite",
      "_retries": 0
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"before all\" hook",
      "hookName": "before all",
      "hookId": "h1",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r3",
      "title": "test 2",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"before all\" hook",
      "hookName": "before all",
      "hookId": "h1",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "test",
    {
      "id": "r3",
      "title": "test 2",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "before all": [
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "after all": [
          {
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"after all\" hook",
      "hookName": "after all",
      "hookId": "h4",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"after all\" hook",
      "hookName": "after all",
      "hookId": "h4",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "pass",
    {
      "id": "r3",
      "title": "test 2",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "before all": [
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "after all": [
          {
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "test end",
    {
      "id": "r3",
      "title": "test 2",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "before all": [
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "after all": [
          {
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "id": "r3",
      "title": "test 2",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "wallClockDuration": "match.number",
      "timings": {
        "lifecycle": "match.number",
        "before all": [
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "after all": [
          {
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r2",
      "title": "suite 1",
      "root": false,
      "type": "suite",
      "_retries": 0
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r1",
      "title": "",
      "root": true,
      "type": "suite",
      "_retries": 0
    }
  ],
  [
    "mocha",
    "end",
    {
      "end": "match.date"
    }
  ]
]

exports['PASS_WITH_ONLY.setRunnables'] = [
  [
    "set:runnables",
    {
      "id": "r1",
      "title": "",
      "root": true,
      "type": "suite",
      "_retries": 0,
      "tests": [],
      "suites": [
        {
          "id": "r2",
          "title": "suite 1",
          "root": false,
          "type": "suite",
          "_retries": 0,
          "tests": [
            {
              "id": "r3",
              "title": "test 2",
              "body": "[body]",
              "type": "test",
              "_currentRetry": 0,
              "_retries": 0
            }
          ],
          "suites": []
        }
      ]
    },
    "[Function run]"
  ]
]

exports['RETRY_PASS_IN_AFTEREACH.mocha'] = [
  [
    "mocha",
    "start",
    {
      "start": "match.date"
    }
  ],
  [
    "mocha",
    "suite",
    {
      "id": "r1",
      "title": "",
      "root": true,
      "type": "suite",
      "_retries": 2
    }
  ],
  [
    "mocha",
    "suite",
    {
      "id": "r2",
      "title": "suite 1",
      "root": false,
      "type": "suite",
      "_retries": 2
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"before all\" hook",
      "hookName": "before all",
      "hookId": "h1",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r3",
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "_currentRetry": 0,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"before all\" hook",
      "hookName": "before all",
      "hookId": "h1",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "test",
    {
      "id": "r3",
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "before all": [
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h5",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "_currentRetry": 0,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h4",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h4",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h5",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h5",
      "err": "{Object 6}",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "id": "r3",
      "title": "test 1",
      "hookName": "after each",
      "err": "{Object 5}",
      "state": "failed",
      "failedFromHookId": "h5",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "wallClockDuration": "match.number",
      "timings": {
        "lifecycle": "match.number",
        "before all": [
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h5",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": false,
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r3",
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "_currentRetry": 1,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h4",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h4",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h5",
      "err": "{Object 6}",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h5",
      "err": "{Object 6}",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "pass",
    {
      "id": "r3",
      "title": "test 1",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h5",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 1,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "test end",
    {
      "id": "r3",
      "title": "test 1",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h5",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 1,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "id": "r3",
      "title": "test 1",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "wallClockDuration": "match.number",
      "timings": {
        "lifecycle": "match.number",
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h5",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 1,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "test",
    {
      "id": "r4",
      "title": "test 2",
      "body": "[body]",
      "type": "test",
      "_currentRetry": 0,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r4",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r4",
      "title": "test 2",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "_currentRetry": 0,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r4",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r4",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r4",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r4",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h4",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r4",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h4",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r4",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h5",
      "err": "{Object 6}",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r4",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h5",
      "err": "{Object 6}",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "pass",
    {
      "id": "r4",
      "title": "test 2",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h5",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "test end",
    {
      "id": "r4",
      "title": "test 2",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h5",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "id": "r4",
      "title": "test 2",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "wallClockDuration": "match.number",
      "timings": {
        "lifecycle": "match.number",
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h5",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "test",
    {
      "id": "r5",
      "title": "test 3",
      "body": "[body]",
      "type": "test",
      "_currentRetry": 0,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r5",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r5",
      "title": "test 3",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "_currentRetry": 0,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r5",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r5",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r5",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r5",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h4",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r5",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h4",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r5",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h5",
      "err": "{Object 6}",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r5",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h5",
      "err": "{Object 6}",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r5",
      "title": "\"after all\" hook",
      "hookName": "after all",
      "hookId": "h6",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r5",
      "title": "\"after all\" hook",
      "hookName": "after all",
      "hookId": "h6",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "pass",
    {
      "id": "r5",
      "title": "test 3",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h5",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "after all": [
          {
            "hookId": "h6",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "test end",
    {
      "id": "r5",
      "title": "test 3",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h5",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "after all": [
          {
            "hookId": "h6",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "id": "r5",
      "title": "test 3",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "wallClockDuration": "match.number",
      "timings": {
        "lifecycle": "match.number",
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h5",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "after all": [
          {
            "hookId": "h6",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r2",
      "title": "suite 1",
      "root": false,
      "type": "suite",
      "_retries": 2
    }
  ],
  [
    "mocha",
    "suite",
    {
      "id": "r6",
      "title": "suite 2",
      "root": false,
      "type": "suite",
      "_retries": 2
    }
  ],
  [
    "mocha",
    "test",
    {
      "id": "r7",
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "_currentRetry": 0,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r7",
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "_currentRetry": 0,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r7",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h7",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r7",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h7",
      "err": "{Object 6}",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r7",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h5",
      "err": "{Object 6}",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r7",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h5",
      "err": "{Object 6}",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "id": "r7",
      "title": "test 1",
      "hookName": "after each",
      "err": "{Object 5}",
      "state": "failed",
      "failedFromHookId": "h7",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "wallClockDuration": "match.number",
      "timings": {
        "lifecycle": "match.number",
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h7",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h5",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": false,
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r7",
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "_currentRetry": 1,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r7",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h7",
      "err": "{Object 6}",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r7",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h7",
      "err": "{Object 6}",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r7",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h5",
      "err": "{Object 6}",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r7",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h5",
      "err": "{Object 6}",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "id": "r7",
      "title": "test 1",
      "hookName": "after each",
      "err": "{Object 5}",
      "state": "failed",
      "failedFromHookId": "h7",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "wallClockDuration": "match.number",
      "timings": {
        "lifecycle": "match.number",
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h7",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h5",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": false,
      "_currentRetry": 1,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r7",
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "_currentRetry": 2,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r7",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h7",
      "err": "{Object 6}",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r7",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h7",
      "err": "{Object 6}",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r7",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h5",
      "err": "{Object 6}",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r7",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h5",
      "err": "{Object 6}",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "pass",
    {
      "id": "r7",
      "title": "test 1",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h7",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h5",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 2,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "test end",
    {
      "id": "r7",
      "title": "test 1",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h7",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h5",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 2,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "id": "r7",
      "title": "test 1",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "wallClockDuration": "match.number",
      "timings": {
        "lifecycle": "match.number",
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h7",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h5",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 2,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r6",
      "title": "suite 2",
      "root": false,
      "type": "suite",
      "_retries": 2
    }
  ],
  [
    "mocha",
    "suite",
    {
      "id": "r8",
      "title": "suite 3",
      "root": false,
      "type": "suite",
      "_retries": 2
    }
  ],
  [
    "mocha",
    "test",
    {
      "id": "r9",
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "_currentRetry": 0,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r9",
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "_currentRetry": 0,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r9",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h5",
      "err": "{Object 6}",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r9",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h5",
      "err": "{Object 6}",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "pass",
    {
      "id": "r9",
      "title": "test 1",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h5",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "test end",
    {
      "id": "r9",
      "title": "test 1",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h5",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "id": "r9",
      "title": "test 1",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "wallClockDuration": "match.number",
      "timings": {
        "lifecycle": "match.number",
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h5",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r8",
      "title": "suite 3",
      "root": false,
      "type": "suite",
      "_retries": 2
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r1",
      "title": "",
      "root": true,
      "type": "suite",
      "_retries": 2
    }
  ],
  [
    "mocha",
    "end",
    {
      "end": "match.date"
    }
  ]
]

exports['RETRY_PASS_IN_AFTEREACH.setRunnables'] = [
  [
    "set:runnables",
    {
      "id": "r1",
      "title": "",
      "root": true,
      "type": "suite",
      "_retries": 2,
      "tests": [],
      "suites": [
        {
          "id": "r2",
          "title": "suite 1",
          "root": false,
          "type": "suite",
          "_retries": 2,
          "tests": [
            {
              "id": "r3",
              "title": "test 1",
              "body": "[body]",
              "type": "test",
              "_currentRetry": 0,
              "_retries": 2
            },
            {
              "id": "r4",
              "title": "test 2",
              "body": "[body]",
              "type": "test",
              "_currentRetry": 0,
              "_retries": 2
            },
            {
              "id": "r5",
              "title": "test 3",
              "body": "[body]",
              "type": "test",
              "_currentRetry": 0,
              "_retries": 2
            }
          ],
          "suites": []
        },
        {
          "id": "r6",
          "title": "suite 2",
          "root": false,
          "type": "suite",
          "_retries": 2,
          "tests": [
            {
              "id": "r7",
              "title": "test 1",
              "body": "[body]",
              "type": "test",
              "_currentRetry": 0,
              "_retries": 2
            }
          ],
          "suites": []
        },
        {
          "id": "r8",
          "title": "suite 3",
          "root": false,
          "type": "suite",
          "_retries": 2,
          "tests": [
            {
              "id": "r9",
              "title": "test 1",
              "body": "[body]",
              "type": "test",
              "_currentRetry": 0,
              "_retries": 2
            }
          ],
          "suites": []
        }
      ]
    },
    "[Function run]"
  ]
]

exports['RETRY_PASS_IN_BEFOREEACH.mocha'] = [
  [
    "mocha",
    "start",
    {
      "start": "match.date"
    }
  ],
  [
    "mocha",
    "suite",
    {
      "id": "r1",
      "title": "",
      "root": true,
      "type": "suite",
      "_retries": 1
    }
  ],
  [
    "mocha",
    "suite",
    {
      "id": "r2",
      "title": "suite 1",
      "root": false,
      "type": "suite",
      "_retries": 1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"before all\" hook",
      "hookName": "before all",
      "hookId": "h1",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r3",
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "_currentRetry": 0,
      "_retries": 1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"before all\" hook",
      "hookName": "before all",
      "hookId": "h1",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "test",
    {
      "id": "r3",
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "before all": [
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        }
      },
      "_currentRetry": 0,
      "_retries": 1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h4",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h4",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h5",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h5",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "id": "r3",
      "title": "test 1",
      "hookName": "before each",
      "err": "{Object 6}",
      "state": "failed",
      "failedFromHookId": "h3",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "wallClockDuration": "match.number",
      "timings": {
        "lifecycle": "match.number",
        "before all": [
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        }
      },
      "final": false,
      "_currentRetry": 0,
      "_retries": 1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r3",
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "_currentRetry": 1,
      "_retries": 1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h4",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h4",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h5",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h5",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"after all\" hook",
      "hookName": "after all",
      "hookId": "h6",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"after all\" hook",
      "hookName": "after all",
      "hookId": "h6",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "pass",
    {
      "id": "r3",
      "title": "test 1",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h5",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "after all": [
          {
            "hookId": "h6",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 1,
      "_retries": 1
    }
  ],
  [
    "mocha",
    "test end",
    {
      "id": "r3",
      "title": "test 1",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h5",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "after all": [
          {
            "hookId": "h6",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 1,
      "_retries": 1
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "id": "r3",
      "title": "test 1",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "wallClockDuration": "match.number",
      "timings": {
        "lifecycle": "match.number",
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h5",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "after all": [
          {
            "hookId": "h6",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 1,
      "_retries": 1
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r2",
      "title": "suite 1",
      "root": false,
      "type": "suite",
      "_retries": 1
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r1",
      "title": "",
      "root": true,
      "type": "suite",
      "_retries": 1
    }
  ],
  [
    "mocha",
    "end",
    {
      "end": "match.date"
    }
  ]
]

exports['RETRY_PASS_IN_BEFOREEACH.setRunnables'] = [
  [
    "set:runnables",
    {
      "id": "r1",
      "title": "",
      "root": true,
      "type": "suite",
      "_retries": 1,
      "tests": [],
      "suites": [
        {
          "id": "r2",
          "title": "suite 1",
          "root": false,
          "type": "suite",
          "_retries": 1,
          "tests": [
            {
              "id": "r3",
              "title": "test 1",
              "body": "[body]",
              "type": "test",
              "_currentRetry": 0,
              "_retries": 1
            }
          ],
          "suites": []
        }
      ]
    },
    "[Function run]"
  ]
]

exports['SIMPLE_SINGLE_TEST.mocha'] = [
  [
    "mocha",
    "start",
    {
      "start": "match.date"
    }
  ],
  [
    "mocha",
    "suite",
    {
      "id": "r1",
      "title": "",
      "root": true,
      "type": "suite",
      "_retries": 0
    }
  ],
  [
    "mocha",
    "suite",
    {
      "id": "r2",
      "title": "suite 1",
      "root": false,
      "type": "suite",
      "_retries": 0
    }
  ],
  [
    "mocha",
    "test",
    {
      "id": "r3",
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r3",
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "pass",
    {
      "id": "r3",
      "title": "test 1",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        }
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "test end",
    {
      "id": "r3",
      "title": "test 1",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        }
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "id": "r3",
      "title": "test 1",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "wallClockDuration": "match.number",
      "timings": {
        "lifecycle": "match.number",
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        }
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r2",
      "title": "suite 1",
      "root": false,
      "type": "suite",
      "_retries": 0
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r1",
      "title": "",
      "root": true,
      "type": "suite",
      "_retries": 0
    }
  ],
  [
    "mocha",
    "end",
    {
      "end": "match.date"
    }
  ]
]

exports['SIMPLE_SINGLE_TEST.setRunnables'] = [
  [
    "set:runnables",
    {
      "id": "r1",
      "title": "",
      "root": true,
      "type": "suite",
      "_retries": 0,
      "tests": [],
      "suites": [
        {
          "id": "r2",
          "title": "suite 1",
          "root": false,
          "type": "suite",
          "_retries": 0,
          "tests": [
            {
              "id": "r3",
              "title": "test 1",
              "body": "[body]",
              "type": "test",
              "_currentRetry": 0,
              "_retries": 0
            }
          ],
          "suites": []
        }
      ]
    },
    "[Function run]"
  ]
]

exports['THREE_TESTS_WITH_HOOKS.mocha'] = [
  [
    "mocha",
    "start",
    {
      "start": "match.date"
    }
  ],
  [
    "mocha",
    "suite",
    {
      "id": "r1",
      "title": "",
      "root": true,
      "type": "suite",
      "_retries": 0
    }
  ],
  [
    "mocha",
    "suite",
    {
      "id": "r2",
      "title": "suite 1",
      "root": false,
      "type": "suite",
      "_retries": 0
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"before all\" hook",
      "hookName": "before all",
      "hookId": "h1",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r3",
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"before all\" hook",
      "hookName": "before all",
      "hookId": "h1",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "test",
    {
      "id": "r3",
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "before all": [
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "pass",
    {
      "id": "r3",
      "title": "test 1",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "before all": [
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "test end",
    {
      "id": "r3",
      "title": "test 1",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "before all": [
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "id": "r3",
      "title": "test 1",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "wallClockDuration": "match.number",
      "timings": {
        "lifecycle": "match.number",
        "before all": [
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "test",
    {
      "id": "r4",
      "title": "test 2",
      "body": "[body]",
      "type": "test",
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r4",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r4",
      "title": "test 2",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r4",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r4",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r4",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "pass",
    {
      "id": "r4",
      "title": "test 2",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "test end",
    {
      "id": "r4",
      "title": "test 2",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "id": "r4",
      "title": "test 2",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "wallClockDuration": "match.number",
      "timings": {
        "lifecycle": "match.number",
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "test",
    {
      "id": "r5",
      "title": "test 3",
      "body": "[body]",
      "type": "test",
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r5",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r5",
      "title": "test 3",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r5",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r5",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r5",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r5",
      "title": "\"after all\" hook",
      "hookName": "after all",
      "hookId": "h4",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r5",
      "title": "\"after all\" hook",
      "hookName": "after all",
      "hookId": "h4",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "pass",
    {
      "id": "r5",
      "title": "test 3",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "after all": [
          {
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "test end",
    {
      "id": "r5",
      "title": "test 3",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "after all": [
          {
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "id": "r5",
      "title": "test 3",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "wallClockDuration": "match.number",
      "timings": {
        "lifecycle": "match.number",
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "after all": [
          {
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 0
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r2",
      "title": "suite 1",
      "root": false,
      "type": "suite",
      "_retries": 0
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r1",
      "title": "",
      "root": true,
      "type": "suite",
      "_retries": 0
    }
  ],
  [
    "mocha",
    "end",
    {
      "end": "match.date"
    }
  ]
]

exports['THREE_TESTS_WITH_HOOKS.setRunnables'] = [
  [
    "set:runnables",
    {
      "id": "r1",
      "title": "",
      "root": true,
      "type": "suite",
      "_retries": 0,
      "tests": [],
      "suites": [
        {
          "id": "r2",
          "title": "suite 1",
          "root": false,
          "type": "suite",
          "_retries": 0,
          "tests": [
            {
              "id": "r3",
              "title": "test 1",
              "body": "[body]",
              "type": "test",
              "_currentRetry": 0,
              "_retries": 0
            },
            {
              "id": "r4",
              "title": "test 2",
              "body": "[body]",
              "type": "test",
              "_currentRetry": 0,
              "_retries": 0
            },
            {
              "id": "r5",
              "title": "test 3",
              "body": "[body]",
              "type": "test",
              "_currentRetry": 0,
              "_retries": 0
            }
          ],
          "suites": []
        }
      ]
    },
    "[Function run]"
  ]
]

exports['THREE_TESTS_WITH_RETRY.mocha'] = [
  [
    "mocha",
    "start",
    {
      "start": "match.date"
    }
  ],
  [
    "mocha",
    "suite",
    {
      "id": "r1",
      "title": "",
      "root": true,
      "type": "suite",
      "_retries": 2
    }
  ],
  [
    "mocha",
    "suite",
    {
      "id": "r2",
      "title": "suite 1",
      "root": false,
      "type": "suite",
      "_retries": 2
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"before all\" hook",
      "hookName": "before all",
      "hookId": "h1",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r3",
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "_currentRetry": 0,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"before all\" hook",
      "hookName": "before all",
      "hookId": "h1",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "test",
    {
      "id": "r3",
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "before all": [
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "_currentRetry": 0,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "pass",
    {
      "id": "r3",
      "title": "test 1",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "before all": [
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "test end",
    {
      "id": "r3",
      "title": "test 1",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "before all": [
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "id": "r3",
      "title": "test 1",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "wallClockDuration": "match.number",
      "timings": {
        "lifecycle": "match.number",
        "before all": [
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "test",
    {
      "id": "r4",
      "title": "test 2",
      "body": "[body]",
      "type": "test",
      "_currentRetry": 0,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r4",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r4",
      "title": "test 2",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "_currentRetry": 0,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r4",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r4",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r4",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "id": "r4",
      "title": "test 2",
      "err": "{Object 6}",
      "state": "failed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "wallClockDuration": "match.number",
      "timings": {
        "lifecycle": "match.number",
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": false,
      "_currentRetry": 0,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r4",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r4",
      "title": "test 2",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "_currentRetry": 1,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r4",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r4",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r4",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "id": "r4",
      "title": "test 2",
      "err": "{Object 6}",
      "state": "failed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "wallClockDuration": "match.number",
      "timings": {
        "lifecycle": "match.number",
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": false,
      "_currentRetry": 1,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r4",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r4",
      "title": "test 2",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "_currentRetry": 2,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r4",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r4",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r4",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "pass",
    {
      "id": "r4",
      "title": "test 2",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 2,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "test end",
    {
      "id": "r4",
      "title": "test 2",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 2,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "id": "r4",
      "title": "test 2",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "wallClockDuration": "match.number",
      "timings": {
        "lifecycle": "match.number",
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 2,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "test",
    {
      "id": "r5",
      "title": "test 3",
      "body": "[body]",
      "type": "test",
      "_currentRetry": 0,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r5",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r5",
      "title": "test 3",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "_currentRetry": 0,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r5",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r5",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r5",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r5",
      "title": "\"after all\" hook",
      "hookName": "after all",
      "hookId": "h4",
      "body": "[body]",
      "type": "hook",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r5",
      "title": "\"after all\" hook",
      "hookName": "after all",
      "hookId": "h4",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "_currentRetry": 0,
      "_retries": -1
    }
  ],
  [
    "mocha",
    "pass",
    {
      "id": "r5",
      "title": "test 3",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "after all": [
          {
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "test end",
    {
      "id": "r5",
      "title": "test 3",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "after all": [
          {
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "id": "r5",
      "title": "test 3",
      "state": "passed",
      "body": "[body]",
      "type": "test",
      "duration": "match.number",
      "wallClockStartedAt": "match.date",
      "wallClockDuration": "match.number",
      "timings": {
        "lifecycle": "match.number",
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "after all": [
          {
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 2
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r2",
      "title": "suite 1",
      "root": false,
      "type": "suite",
      "_retries": 2
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r1",
      "title": "",
      "root": true,
      "type": "suite",
      "_retries": 2
    }
  ],
  [
    "mocha",
    "end",
    {
      "end": "match.date"
    }
  ]
]

exports['THREE_TESTS_WITH_RETRY.setRunnables'] = [
  [
    "set:runnables",
    {
      "id": "r1",
      "title": "",
      "root": true,
      "type": "suite",
      "_retries": 2,
      "tests": [],
      "suites": [
        {
          "id": "r2",
          "title": "suite 1",
          "root": false,
          "type": "suite",
          "_retries": 2,
          "tests": [
            {
              "id": "r3",
              "title": "test 1",
              "body": "[body]",
              "type": "test",
              "_currentRetry": 0,
              "_retries": 2
            },
            {
              "id": "r4",
              "title": "test 2",
              "body": "[body]",
              "type": "test",
              "_currentRetry": 0,
              "_retries": 2
            },
            {
              "id": "r5",
              "title": "test 3",
              "body": "[body]",
              "type": "test",
              "_currentRetry": 0,
              "_retries": 2
            }
          ],
          "suites": []
        }
      ]
    },
    "[Function run]"
  ]
]

exports['serialize state - hooks'] = {
  "currentId": "r6",
  "tests": {
    "r3": {
      "id": "r3",
      "title": "test 1",
      "state": "passed",
      "body": "stub",
      "type": "test",
      "duration": 1,
      "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
      "wallClockDuration": 1,
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
        ],
        "after all": [
          {
            "hookId": "h4",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 1,
      "prevAttempts": []
    },
    "r5": {
      "id": "r5",
      "title": "test 1",
      "state": "passed",
      "body": "stub",
      "type": "test",
      "duration": 1,
      "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
      "wallClockDuration": 1,
      "timings": {
        "lifecycle": 1,
        "test": {
          "fnDuration": 1,
          "afterFnDuration": 1
        }
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 1,
      "prevAttempts": []
    }
  },
  "startTime": "1970-01-01T00:00:00.000Z",
  "emissions": {
    "started": {
      "r1": true,
      "r2": true,
      "r3": true,
      "r4": true,
      "r5": true,
      "r6": true
    },
    "ended": {
      "r3": true,
      "r2": true,
      "r5": true
    }
  },
  "passed": 2,
  "failed": 0,
  "pending": 0,
  "numLogs": 0
}

exports['serialize state - retries'] = {
  "currentId": "r6",
  "tests": {
    "r3": {
      "id": "r3",
      "title": "test 1",
      "state": "passed",
      "body": "stub",
      "type": "test",
      "duration": 1,
      "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
      "wallClockDuration": 1,
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
        ],
        "after all": [
          {
            "hookId": "h4",
            "fnDuration": 1,
            "afterFnDuration": 1
          }
        ]
      },
      "final": true,
      "_currentRetry": 0,
      "_retries": 1,
      "prevAttempts": []
    },
    "r5": {
      "id": "r5",
      "title": "test 1",
      "state": "passed",
      "body": "stub",
      "type": "test",
      "duration": 1,
      "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
      "wallClockDuration": 1,
      "timings": {
        "lifecycle": 1,
        "test": {
          "fnDuration": 1,
          "afterFnDuration": 1
        }
      },
      "final": true,
      "_currentRetry": 1,
      "_retries": 1,
      "prevAttempts": [
        {
          "id": "r5",
          "title": "test 1",
          "err": {
            "message": "stub 2 fail",
            "name": "AssertionError",
            "stack": "[err stack]",
            "actual": null,
            "showDiff": false
          },
          "state": "failed",
          "body": "stub",
          "type": "test",
          "duration": 1,
          "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
          "wallClockDuration": 1,
          "timings": {
            "lifecycle": 1,
            "test": {
              "fnDuration": 1,
              "afterFnDuration": 1
            }
          },
          "final": false,
          "_currentRetry": 0,
          "_retries": 1
        }
      ]
    }
  },
  "startTime": "1970-01-01T00:00:00.000Z",
  "emissions": {
    "started": {
      "r1": true,
      "r2": true,
      "r3": true,
      "r4": true,
      "r5": true,
      "r6": true
    },
    "ended": {
      "r3": true,
      "r2": true,
      "r5": true
    }
  },
  "passed": 2,
  "failed": 0,
  "pending": 0,
  "numLogs": 0
}

exports['src/cypress/runner isolated test runner test events hook failures fail in [after] #1'] = `
AssertionError: after

Because this error occurred during a 'after all' hook we are skipping the remaining tests in the current suite: 'suite 1'
`

exports['src/cypress/runner isolated test runner test events hook failures fail in [before] #1'] = `
AssertionError: before

Because this error occurred during a 'before all' hook we are skipping the remaining tests in the current suite: 'suite 1'
`
