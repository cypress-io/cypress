exports['studio mocha events only runs a single test by id #1'] = [
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
      "title": "suite",
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
      "id": "r4",
      "order": 1,
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
    "test:before:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r4",
      "order": 1,
      "title": "test 2",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 0,
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
      "order": 1,
      "title": "test 2",
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
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 0,
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
      "order": 1,
      "title": "test 2",
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
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r2",
      "title": "suite",
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
      "id": "r4",
      "order": 1,
      "title": "test 2",
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
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 0,
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

exports['studio mocha events creates a new test when adding to a suite #1'] = [
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
      "title": "suite",
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
      "title": "New Test",
      "body": "[body]",
      "type": "test",
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
      "title": "New Test",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 0,
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
      "title": "New Test",
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
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 0,
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
      "title": "New Test",
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
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r2",
      "title": "suite",
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
      "title": "New Test",
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
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 0,
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

exports['studio mocha events can add new test to root runnable #1'] = [
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
      "title": "New Test",
      "body": "[body]",
      "type": "test",
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
      "title": "New Test",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "currentRetry": 0,
      "retries": 0,
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
      "id": "r2",
      "order": 1,
      "title": "New Test",
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
      "currentRetry": 0,
      "retries": 0,
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
      "id": "r2",
      "order": 1,
      "title": "New Test",
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
      "currentRetry": 0,
      "retries": 0,
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
      "order": 1,
      "title": "New Test",
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
      "currentRetry": 0,
      "retries": 0,
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

exports['studio mocha events hooks runs before hooks and test body but not after hooks when extending test #1'] = [
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
      "title": "suite",
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
      "title": "test",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 0,
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
      "title": "test",
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
        }
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 0,
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
    "pass",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
      "title": "test",
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
        }
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 0,
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
      "title": "test",
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
        }
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r2",
      "title": "suite",
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
      "title": "test",
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
        }
      },
      "file": null,
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 0,
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

exports['studio mocha events hooks runs before hooks but not after hooks when adding to suite #1'] = [
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
      "title": "suite",
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
      "title": "New Test",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 0,
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
      "title": "New Test",
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
        }
      },
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 0,
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
    "pass",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r3",
      "order": 1,
      "title": "New Test",
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
        }
      },
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 0,
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
      "title": "New Test",
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
        }
      },
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r2",
      "title": "suite",
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
      "title": "New Test",
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
        }
      },
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 0,
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

exports['studio mocha events only test can be extended #1'] = [
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
      "title": "suite",
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
      "id": "r3",
      "title": "nested suite 1",
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
      "id": "r4",
      "order": 1,
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
    "test:before:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r4",
      "order": 1,
      "title": "test 2",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 0,
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
      "order": 1,
      "title": "test 2",
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
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 0,
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
      "order": 1,
      "title": "test 2",
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
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r3",
      "title": "nested suite 1",
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
    "suite end",
    {
      "id": "r2",
      "title": "suite",
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
      "id": "r4",
      "order": 1,
      "title": "test 2",
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
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 0,
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

exports['studio mocha events only test can be extended when there are multiple in the spec #1'] = [
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
      "title": "suite",
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
      "id": "r3",
      "title": "nested suite 1",
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
      "id": "r5",
      "order": 1,
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
    "test:before:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r5",
      "order": 1,
      "title": "test 2",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 0,
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
      "order": 1,
      "title": "test 2",
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
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 0,
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
      "order": 1,
      "title": "test 2",
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
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r3",
      "title": "nested suite 1",
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
    "suite end",
    {
      "id": "r2",
      "title": "suite",
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
      "order": 1,
      "title": "test 2",
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
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 0,
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

exports['studio mocha events only test can extend a suite that contains an only spec #1'] = [
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
      "title": "suite",
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
      "id": "r3",
      "title": "nested suite 1",
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
      "id": "r8",
      "order": 2,
      "title": "New Test",
      "body": "[body]",
      "type": "test",
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
      "id": "r8",
      "order": 2,
      "title": "New Test",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 0,
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
      "id": "r8",
      "order": 2,
      "title": "New Test",
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
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 0,
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
      "id": "r8",
      "order": 2,
      "title": "New Test",
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
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r3",
      "title": "nested suite 1",
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
    "suite end",
    {
      "id": "r2",
      "title": "suite",
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
      "id": "r8",
      "order": 2,
      "title": "New Test",
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
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 0,
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

exports['studio mocha events only suite can be added to #1'] = [
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
      "title": "suite",
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
      "id": "r3",
      "title": "nested suite 2",
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
      "id": "r8",
      "order": 4,
      "title": "New Test",
      "body": "[body]",
      "type": "test",
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
      "id": "r8",
      "order": 4,
      "title": "New Test",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 0,
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
      "id": "r8",
      "order": 4,
      "title": "New Test",
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
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 0,
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
      "id": "r8",
      "order": 4,
      "title": "New Test",
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
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r3",
      "title": "nested suite 2",
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
    "suite end",
    {
      "id": "r2",
      "title": "suite",
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
      "id": "r8",
      "order": 4,
      "title": "New Test",
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
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 0,
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

exports['studio mocha events only suite can be added to when there are multiple in the spec #1'] = [
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
      "title": "suite",
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
      "id": "r4",
      "title": "nested suite 3",
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
      "id": "r11",
      "order": 6,
      "title": "New Test",
      "body": "[body]",
      "type": "test",
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
      "id": "r11",
      "order": 6,
      "title": "New Test",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 0,
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
      "id": "r11",
      "order": 6,
      "title": "New Test",
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
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 0,
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
      "id": "r11",
      "order": 6,
      "title": "New Test",
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
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r4",
      "title": "nested suite 3",
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
    "suite end",
    {
      "id": "r2",
      "title": "suite",
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
      "id": "r11",
      "order": 6,
      "title": "New Test",
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
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 0,
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

exports['studio mocha events only suite can extend a test within an only suite #1'] = [
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
      "title": "suite",
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
      "id": "r3",
      "title": "nested suite 2",
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
      "order": 1,
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
    "test:before:run",
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {}
      },
      "id": "r7",
      "order": 1,
      "title": "test 3",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 0,
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
      "order": 1,
      "title": "test 3",
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
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 0,
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
      "order": 1,
      "title": "test 3",
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
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r3",
      "title": "nested suite 2",
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
    "suite end",
    {
      "id": "r2",
      "title": "suite",
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
      "id": "r7",
      "order": 1,
      "title": "test 3",
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
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 0,
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

exports['studio mocha events only suite can extend a test within an only suite when there are multiple in the spec #1'] = [
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
      "title": "suite",
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
      "id": "r4",
      "title": "nested suite 3",
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
      "id": "r10",
      "order": 1,
      "title": "test 5",
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
      "id": "r10",
      "order": 1,
      "title": "test 5",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "invocationDetails": "{Object 9}",
      "currentRetry": 0,
      "retries": 0,
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
      "id": "r10",
      "order": 1,
      "title": "test 5",
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
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 0,
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
      "id": "r10",
      "order": 1,
      "title": "test 5",
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
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r4",
      "title": "nested suite 3",
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
    "suite end",
    {
      "id": "r2",
      "title": "suite",
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
      "id": "r10",
      "order": 1,
      "title": "test 5",
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
      "invocationDetails": "{Object 9}",
      "final": true,
      "currentRetry": 0,
      "retries": 0,
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
