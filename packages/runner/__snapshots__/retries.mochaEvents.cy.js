exports['src/cypress/runner retries mochaEvents simple retry #1'] = [
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
      "file": "relative/path/to/spec.js",
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "retry",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
      "state": "failed",
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": false,
      "currentRetry": 0,
      "retries": 1,
      "_slow": 10000
    },
    {
      "message": "[error message]",
      "name": "AssertionError",
      "stack": "match.string",
      "parsedStack": "match.array"
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
      "state": "failed",
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": false,
      "currentRetry": 0,
      "retries": 1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "currentRetry": 1,
      "retries": 1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "pass",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
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
      "file": null,
      "final": true,
      "currentRetry": 1,
      "retries": 1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test end",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
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
      "file": null,
      "final": true,
      "currentRetry": 1,
      "retries": 1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
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
      "file": null,
      "final": true,
      "currentRetry": 1,
      "retries": 1,
      "_slow": 10000
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
      "file": "relative/path/to/spec.js",
      "retries": -1,
      "_slow": 10000
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

exports['src/cypress/runner retries mochaEvents test retry with hooks #1'] = [
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
      "file": "relative/path/to/spec.js",
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
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
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "retry",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
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
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": false,
      "currentRetry": 0,
      "retries": 1,
      "_slow": 10000
    },
    {
      "message": "[error message]",
      "name": "AssertionError",
      "stack": "match.string",
      "parsedStack": "match.array"
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
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
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": false,
      "currentRetry": 0,
      "retries": 1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "currentRetry": 1,
      "retries": 1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"after all\" hook",
      "hookName": "after all",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"after all\" hook",
      "hookName": "after all",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "pass",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
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
          }
        ],
        "after all": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "final": true,
      "currentRetry": 1,
      "retries": 1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test end",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
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
          }
        ],
        "after all": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "final": true,
      "currentRetry": 1,
      "retries": 1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
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
          }
        ],
        "after all": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "final": true,
      "currentRetry": 1,
      "retries": 1,
      "_slow": 10000
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
      "file": "relative/path/to/spec.js",
      "retries": -1,
      "_slow": 10000
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

exports['src/cypress/runner retries mochaEvents test retry with [only] #1'] = [
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
      "file": "relative/path/to/spec.js",
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
      "title": "test 2",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
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
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "retry",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
      "title": "test 2",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
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
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": false,
      "currentRetry": 0,
      "retries": 1,
      "_slow": 10000
    },
    {
      "message": "[error message]",
      "name": "AssertionError",
      "stack": "match.string",
      "parsedStack": "match.array"
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
      "title": "test 2",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
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
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": false,
      "currentRetry": 0,
      "retries": 1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "title": "test 2",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "currentRetry": 1,
      "retries": 1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"after all\" hook",
      "hookName": "after all",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"after all\" hook",
      "hookName": "after all",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "pass",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
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
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "after all": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "final": true,
      "currentRetry": 1,
      "retries": 1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test end",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
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
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "after all": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "final": true,
      "currentRetry": 1,
      "retries": 1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
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
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "after all": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "final": true,
      "currentRetry": 1,
      "retries": 1,
      "_slow": 10000
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
      "file": "relative/path/to/spec.js",
      "retries": -1,
      "_slow": 10000
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

exports['src/cypress/runner retries mochaEvents can retry from [beforeEach] #1'] = [
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
      "file": "relative/path/to/spec.js",
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
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
            "hookId": "h6",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "retry",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "hookName": "before each",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
      "state": "failed",
      "failedFromHookId": "h3",
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
            "hookId": "h6",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": false,
      "currentRetry": 0,
      "retries": 1,
      "_slow": 10000
    },
    {
      "message": "[error message]",
      "name": "AssertionError",
      "stack": "match.string",
      "parsedStack": "match.array"
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h6",
      "body": "[body]",
      "type": "hook",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h6",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "hookName": "before each",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
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
        },
        "after each": [
          {
            "hookId": "h6",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": false,
      "currentRetry": 0,
      "retries": 1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "currentRetry": 1,
      "retries": 1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h6",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h6",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"after all\" hook",
      "hookName": "after all",
      "hookId": "h5",
      "body": "[body]",
      "type": "hook",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"after all\" hook",
      "hookName": "after all",
      "hookId": "h5",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "pass",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
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
            "hookId": "h6",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "after all": [
          {
            "hookId": "h5",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "final": true,
      "currentRetry": 1,
      "retries": 1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test end",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
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
            "hookId": "h6",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "after all": [
          {
            "hookId": "h5",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "final": true,
      "currentRetry": 1,
      "retries": 1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
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
            "hookId": "h6",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "after all": [
          {
            "hookId": "h5",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "final": true,
      "currentRetry": 1,
      "retries": 1,
      "_slow": 10000
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
      "file": "relative/path/to/spec.js",
      "retries": -1,
      "_slow": 10000
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

exports['src/cypress/runner retries mochaEvents can retry from [afterEach] #1'] = [
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
      "file": "relative/path/to/spec.js",
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"before all\" hook",
      "hookName": "before all",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"before all\" hook",
      "hookName": "before all",
      "hookId": "h2",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "timings": {
        "lifecycle": "match.number",
        "before all": [
          {
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "before each": [
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
            "hookId": "h6",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h6",
      "body": "[body]",
      "type": "hook",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h6",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": "relative/path/to/spec.js",
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "retry",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "hookName": "after each",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
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
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "before each": [
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
            "hookId": "h6",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": false,
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
    },
    {
      "message": "[error message]",
      "name": "AssertionError",
      "stack": "match.string",
      "parsedStack": "match.array"
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h1",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": "relative/path/to/spec.js",
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "hookName": "after each",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
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
            "hookId": "h2",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "before each": [
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
            "hookId": "h6",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": false,
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "currentRetry": 1,
      "retries": 2,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "duration": "match.number",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h6",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h6",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": "relative/path/to/spec.js",
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h1",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": "relative/path/to/spec.js",
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "pass",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
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
            "hookId": "h6",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "final": true,
      "currentRetry": 1,
      "retries": 2,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test end",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
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
            "hookId": "h6",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "final": true,
      "currentRetry": 1,
      "retries": 2,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
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
            "hookId": "h6",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "final": true,
      "currentRetry": 1,
      "retries": 2,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r4",
      "order": 2,
      "title": "test 2",
      "body": "[body]",
      "type": "test",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r4",
      "order": 2,
      "title": "test 2",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r4",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h4",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r4",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h4",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r4",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h6",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r4",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h6",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r4",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h1",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": "relative/path/to/spec.js",
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r4",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h1",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": "relative/path/to/spec.js",
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "pass",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r4",
      "order": 2,
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
            "hookId": "h6",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test end",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r4",
      "order": 2,
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
            "hookId": "h6",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r4",
      "order": 2,
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
            "hookId": "h6",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r5",
      "order": 3,
      "title": "test 3",
      "body": "[body]",
      "type": "test",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r5",
      "order": 3,
      "title": "test 3",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r5",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h4",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r5",
      "title": "\"before each\" hook",
      "hookName": "before each",
      "hookId": "h4",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r5",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h6",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r5",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h6",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r5",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h1",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": "relative/path/to/spec.js",
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r5",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h1",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": "relative/path/to/spec.js",
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r5",
      "title": "\"after all\" hook",
      "hookName": "after all",
      "hookId": "h5",
      "body": "[body]",
      "type": "hook",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r5",
      "title": "\"after all\" hook",
      "hookName": "after all",
      "hookId": "h5",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "pass",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r5",
      "order": 3,
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
            "hookId": "h6",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "after all": [
          {
            "hookId": "h5",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test end",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r5",
      "order": 3,
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
            "hookId": "h6",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "after all": [
          {
            "hookId": "h5",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r5",
      "order": 3,
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
            "hookId": "h6",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "after all": [
          {
            "hookId": "h5",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r7",
      "order": 4,
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r7",
      "order": 4,
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "retry",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r7",
      "order": 4,
      "title": "test 1",
      "hookName": "after each",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
      "state": "failed",
      "failedFromHookId": "h7",
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
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": false,
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
    },
    {
      "message": "[error message]",
      "name": "AssertionError",
      "stack": "match.string",
      "parsedStack": "match.array"
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
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r7",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h1",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": "relative/path/to/spec.js",
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r7",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h1",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": "relative/path/to/spec.js",
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r7",
      "order": 4,
      "title": "test 1",
      "hookName": "after each",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
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
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": false,
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r7",
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "currentRetry": 1,
      "retries": 2,
      "_slow": 10000
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
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "retry",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r7",
      "title": "test 1",
      "hookName": "after each",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
      "state": "failed",
      "failedFromHookId": "h7",
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
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "final": false,
      "currentRetry": 1,
      "retries": 2,
      "_slow": 10000
    },
    {
      "message": "[error message]",
      "name": "AssertionError",
      "stack": "match.string",
      "parsedStack": "match.array"
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
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r7",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h1",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": "relative/path/to/spec.js",
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r7",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h1",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": "relative/path/to/spec.js",
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r7",
      "title": "test 1",
      "hookName": "after each",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
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
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "final": false,
      "currentRetry": 1,
      "retries": 2,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r7",
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "currentRetry": 2,
      "retries": 2,
      "_slow": 10000
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
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r7",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h1",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": "relative/path/to/spec.js",
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r7",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h1",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": "relative/path/to/spec.js",
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "pass",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
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
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "final": true,
      "currentRetry": 2,
      "retries": 2,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test end",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
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
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "final": true,
      "currentRetry": 2,
      "retries": 2,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
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
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "final": true,
      "currentRetry": 2,
      "retries": 2,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r9",
      "order": 5,
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r9",
      "order": 5,
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r9",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h1",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": "relative/path/to/spec.js",
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r9",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h1",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": "relative/path/to/spec.js",
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "pass",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r9",
      "order": 5,
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
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test end",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r9",
      "order": 5,
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
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r9",
      "order": 5,
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
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
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
      "file": "relative/path/to/spec.js",
      "retries": -1,
      "_slow": 10000
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

exports['src/cypress/runner retries mochaEvents cant retry from [before] #1'] = [
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
      "file": "relative/path/to/spec.js",
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 1,
      "_slow": 10000
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
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
      "state": "failed",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "originalTitle": "\"before all\" hook",
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    },
    {
      "message": "[error message]",
      "name": "AssertionError",
      "stack": "match.string",
      "parsedStack": "match.array"
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test end",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "hookName": "before all",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
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
        ],
        "after all": [
          {
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "hookName": "before all",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
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
        ],
        "after all": [
          {
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 1,
      "_slow": 10000
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
      "file": "relative/path/to/spec.js",
      "retries": -1,
      "_slow": 10000
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

exports['src/cypress/runner retries mochaEvents cant retry from [after] #1'] = [
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
      "file": "relative/path/to/spec.js",
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
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
            "hookId": "h5",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h6",
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r3",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h6",
      "body": "[body]",
      "type": "hook",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r3",
      "title": "\"after each\" hook",
      "hookName": "after each",
      "hookId": "h6",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "fail",
    {
      "id": "r3",
      "title": "\"after all\" hook for \"test 1\"",
      "hookName": "after all",
      "hookId": "h4",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
      "state": "failed",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "originalTitle": "\"after all\" hook",
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    },
    {
      "message": "[error message]",
      "name": "AssertionError",
      "stack": "match.string",
      "parsedStack": "match.array"
    }
  ],
  [
    "mocha",
    "test end",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "hookName": "after all",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
      "state": "failed",
      "failedFromHookId": "h4",
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
            "hookId": "h5",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h6",
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "hookName": "after all",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
      "state": "failed",
      "failedFromHookId": "h4",
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
            "hookId": "h5",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          },
          {
            "hookId": "h6",
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 1,
      "_slow": 10000
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
      "file": "relative/path/to/spec.js",
      "retries": -1,
      "_slow": 10000
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

exports['src/cypress/runner retries mochaEvents three tests with retry #1'] = [
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
      "file": "relative/path/to/spec.js",
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
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
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "pass",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
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
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test end",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
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
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
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
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r4",
      "order": 2,
      "title": "test 2",
      "body": "[body]",
      "type": "test",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r4",
      "order": 2,
      "title": "test 2",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "retry",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r4",
      "order": 2,
      "title": "test 2",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
      "state": "failed",
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
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": false,
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
    },
    {
      "message": "[error message]",
      "name": "AssertionError",
      "stack": "match.string",
      "parsedStack": "match.array"
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r4",
      "order": 2,
      "title": "test 2",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
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
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": false,
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r4",
      "title": "test 2",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "currentRetry": 1,
      "retries": 2,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "retry",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r4",
      "title": "test 2",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
      "state": "failed",
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
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "final": false,
      "currentRetry": 1,
      "retries": 2,
      "_slow": 10000
    },
    {
      "message": "[error message]",
      "name": "AssertionError",
      "stack": "match.string",
      "parsedStack": "match.array"
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r4",
      "title": "test 2",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
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
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "final": false,
      "currentRetry": 1,
      "retries": 2,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r4",
      "title": "test 2",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "currentRetry": 2,
      "retries": 2,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "pass",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
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
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "final": true,
      "currentRetry": 2,
      "retries": 2,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test end",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
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
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "final": true,
      "currentRetry": 2,
      "retries": 2,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
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
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "final": true,
      "currentRetry": 2,
      "retries": 2,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r5",
      "order": 3,
      "title": "test 3",
      "body": "[body]",
      "type": "test",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r5",
      "order": 3,
      "title": "test 3",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r5",
      "title": "\"after all\" hook",
      "hookName": "after all",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r5",
      "title": "\"after all\" hook",
      "hookName": "after all",
      "hookId": "h3",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "pass",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r5",
      "order": 3,
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
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "after all": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test end",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r5",
      "order": 3,
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
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "after all": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r5",
      "order": 3,
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
            "hookId": "h4",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ],
        "after all": [
          {
            "hookId": "h3",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
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
      "file": "relative/path/to/spec.js",
      "retries": -1,
      "_slow": 10000
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

exports['src/cypress/runner retries mochaEvents screenshots retry screenshot in test body #1'] = [
  "take:screenshot",
  {
    "titles": [
      "suite 1",
      "test 1"
    ],
    "testId": "r3",
    "testAttemptIndex": "match.match(0)",
    "capture": "fullPage",
    "clip": {
      "x": 0,
      "y": 0,
      "width": 1000,
      "height": 660
    },
    "viewport": {
      "width": 1000,
      "height": 660
    },
    "scaled": false,
    "blackout": [],
    "overwrite": false,
    "startTime": "match.string",
    "current": 1,
    "total": 1
  }
]

exports['src/cypress/runner retries mochaEvents screenshots retry screenshot in test body #2'] = {
  "id": "r3",
  "testAttemptIndex": "match.match(0)",
  "isOpen": false,
  "appOnly": true,
  "scale": false,
  "waitForCommandSynchronization": false,
  "disableTimersAndAnimations": true,
  "blackout": [],
  "overwrite": false
}

exports['src/cypress/runner retries mochaEvents cleanses errors before emitting does not try to serialize error with err.actual as DOM node #1'] = [
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
      "file": "relative/path/to/spec.js",
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r2",
      "order": 1,
      "title": "visits",
      "body": "[body]",
      "type": "test",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": -1,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r2",
      "order": 1,
      "title": "visits",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "retry",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r2",
      "order": 1,
      "title": "visits",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
      "state": "failed",
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": false,
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
    },
    {
      "message": "[error message]",
      "name": "AssertionError",
      "stack": "match.string",
      "parsedStack": "match.array"
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r2",
      "order": 1,
      "title": "visits",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
      "state": "failed",
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
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": false,
      "currentRetry": 0,
      "retries": 2,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r2",
      "title": "visits",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "currentRetry": 1,
      "retries": 2,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "retry",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r2",
      "title": "visits",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
      "state": "failed",
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
      "file": null,
      "final": false,
      "currentRetry": 1,
      "retries": 2,
      "_slow": 10000
    },
    {
      "message": "[error message]",
      "name": "AssertionError",
      "stack": "match.string",
      "parsedStack": "match.array"
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r2",
      "title": "visits",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
      "state": "failed",
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
      "file": null,
      "final": false,
      "currentRetry": 1,
      "retries": 2,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r2",
      "title": "visits",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "currentRetry": 2,
      "retries": 2,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "fail",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r2",
      "title": "visits",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
      "state": "failed",
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
      "file": null,
      "currentRetry": 2,
      "retries": 2,
      "_slow": 10000
    },
    {
      "message": "[error message]",
      "name": "AssertionError",
      "stack": "match.string",
      "parsedStack": "match.array"
    }
  ],
  [
    "mocha",
    "test end",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r2",
      "title": "visits",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
      "state": "failed",
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
      "file": null,
      "final": true,
      "currentRetry": 2,
      "retries": 2,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r2",
      "title": "visits",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "parsedStack": "match.array"
      },
      "state": "failed",
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
      "file": null,
      "final": true,
      "currentRetry": 2,
      "retries": 2,
      "_slow": 10000
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
      "file": "relative/path/to/spec.js",
      "retries": -1,
      "_slow": 10000
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

exports['serialize state - retries'] = {
  "currentId": "r6",
  "tests": "{Object 2}",
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
