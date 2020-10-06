exports['src/cypress/runner tests finish with correct state hook failures fail in [before] #1'] = [
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
      "retries": -1
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
      "retries": -1
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
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
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
        "sourceMappedStack": "match.string",
        "parsedStack": "match.array"
      },
      "state": "failed",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "originalTitle": "\"before all\" hook",
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
    },
    {
      "message": "[error message]",
      "name": "AssertionError",
      "stack": "match.string",
      "sourceMappedStack": "match.string",
      "parsedStack": "match.array"
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
      "retries": -1
    }
  ],
  [
    "mocha",
    "test end",
    {
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "hookName": "before all",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "sourceMappedStack": "match.string",
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
        ]
      },
      "file": null,
      "invocationDetails": "{Object 8}",
      "final": true,
      "currentRetry": 0,
      "retries": 0
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "hookName": "before all",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "sourceMappedStack": "match.string",
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
        ]
      },
      "file": null,
      "invocationDetails": "{Object 8}",
      "final": true,
      "currentRetry": 0,
      "retries": 0
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
      "retries": -1
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

exports['src/cypress/runner tests finish with correct state hook failures fail in [beforeEach] #1'] = [
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
      "retries": -1
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
      "retries": -1
    }
  ],
  [
    "mocha",
    "test",
    {
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "file": null,
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
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
      "file": null,
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
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
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "sourceMappedStack": "match.string",
        "parsedStack": "match.array"
      },
      "state": "failed",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "originalTitle": "\"before each\" hook",
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
    },
    {
      "message": "[error message]",
      "name": "AssertionError",
      "stack": "match.string",
      "sourceMappedStack": "match.string",
      "parsedStack": "match.array"
    }
  ],
  [
    "mocha",
    "test end",
    {
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "hookName": "before each",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "sourceMappedStack": "match.string",
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
        "before each": [
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 8}",
      "final": true,
      "currentRetry": 0,
      "retries": 0
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
      "retries": -1
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "hookName": "before each",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "sourceMappedStack": "match.string",
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
        "before each": [
          {
            "hookId": "h1",
            "fnDuration": "match.number",
            "afterFnDuration": "match.number"
          }
        ]
      },
      "file": null,
      "invocationDetails": "{Object 8}",
      "final": true,
      "currentRetry": 0,
      "retries": 0
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
      "retries": -1
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

exports['src/cypress/runner tests finish with correct state hook failures fail in [afterEach] #1'] = [
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
      "retries": -1
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
      "retries": -1
    }
  ],
  [
    "mocha",
    "test",
    {
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "file": null,
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
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
      "file": null,
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
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
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "sourceMappedStack": "match.string",
        "parsedStack": "match.array"
      },
      "state": "failed",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "originalTitle": "\"after each\" hook",
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
    },
    {
      "message": "[error message]",
      "name": "AssertionError",
      "stack": "match.string",
      "sourceMappedStack": "match.string",
      "parsedStack": "match.array"
    }
  ],
  [
    "mocha",
    "test end",
    {
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "hookName": "after each",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "sourceMappedStack": "match.string",
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
      "invocationDetails": "{Object 8}",
      "final": true,
      "currentRetry": 0,
      "retries": 0
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
      "retries": -1
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "hookName": "after each",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "sourceMappedStack": "match.string",
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
      "invocationDetails": "{Object 8}",
      "final": true,
      "currentRetry": 0,
      "retries": 0
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
      "retries": -1
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

exports['src/cypress/runner tests finish with correct state hook failures fail in [after] #1'] = [
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
      "retries": -1
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
      "retries": -1
    }
  ],
  [
    "mocha",
    "test",
    {
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "file": null,
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
    }
  ],
  [
    "mocha",
    "pass",
    {
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
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        }
      },
      "file": null,
      "invocationDetails": "{Object 8}",
      "final": true,
      "currentRetry": 0,
      "retries": 0
    }
  ],
  [
    "mocha",
    "test end",
    {
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
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        }
      },
      "file": null,
      "invocationDetails": "{Object 8}",
      "final": true,
      "currentRetry": 0,
      "retries": 0
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
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
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        }
      },
      "file": null,
      "invocationDetails": "{Object 8}",
      "final": true,
      "currentRetry": 0,
      "retries": 0
    }
  ],
  [
    "mocha",
    "test",
    {
      "id": "r4",
      "order": 2,
      "title": "test 2",
      "body": "[body]",
      "type": "test",
      "file": null,
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r4",
      "order": 2,
      "title": "test 2",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
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
      "file": null,
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
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
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "sourceMappedStack": "match.string",
        "parsedStack": "match.array"
      },
      "state": "failed",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "originalTitle": "\"after all\" hook",
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
    },
    {
      "message": "[error message]",
      "name": "AssertionError",
      "stack": "match.string",
      "sourceMappedStack": "match.string",
      "parsedStack": "match.array"
    }
  ],
  [
    "mocha",
    "test end",
    {
      "id": "r4",
      "order": 2,
      "title": "test 2",
      "hookName": "after all",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "sourceMappedStack": "match.string",
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
      "file": null,
      "invocationDetails": "{Object 8}",
      "final": true,
      "currentRetry": 0,
      "retries": 0
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
      "retries": -1
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "id": "r4",
      "order": 2,
      "title": "test 2",
      "hookName": "after all",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "sourceMappedStack": "match.string",
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
      "file": null,
      "invocationDetails": "{Object 8}",
      "final": true,
      "currentRetry": 0,
      "retries": 0
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
      "retries": -1
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

exports['src/cypress/runner tests finish with correct state mocha grep fail with [only] #1'] = [
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
      "retries": -1
    }
  ],
  [
    "mocha",
    "suite",
    {
      "id": "r4",
      "title": "suite 1",
      "root": false,
      "type": "suite",
      "file": null,
      "retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r5",
      "title": "\"before all\" hook",
      "hookName": "before all",
      "hookId": "h1",
      "body": "[body]",
      "type": "hook",
      "file": null,
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r5",
      "order": 2,
      "title": "test 2",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r5",
      "title": "\"before all\" hook",
      "hookName": "before all",
      "hookId": "h1",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
    }
  ],
  [
    "mocha",
    "test",
    {
      "id": "r5",
      "order": 2,
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
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": 0
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
      "file": null,
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
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
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
    }
  ],
  [
    "mocha",
    "fail",
    {
      "id": "r5",
      "order": 2,
      "title": "test 2",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "sourceMappedStack": "match.string",
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
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": 0
    },
    {
      "message": "[error message]",
      "name": "AssertionError",
      "stack": "match.string",
      "sourceMappedStack": "match.string",
      "parsedStack": "match.array"
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
      "file": null,
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
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
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
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
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
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
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
    }
  ],
  [
    "mocha",
    "test end",
    {
      "id": "r5",
      "order": 2,
      "title": "test 2",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "sourceMappedStack": "match.string",
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
      "invocationDetails": "{Object 8}",
      "final": true,
      "currentRetry": 0,
      "retries": 0
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r4",
      "title": "suite 1",
      "root": false,
      "type": "suite",
      "file": null,
      "retries": -1
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "id": "r5",
      "order": 2,
      "title": "test 2",
      "err": {
        "message": "[error message]",
        "name": "AssertionError",
        "stack": "match.string",
        "sourceMappedStack": "match.string",
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
      "invocationDetails": "{Object 8}",
      "final": true,
      "currentRetry": 0,
      "retries": 0
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
      "retries": -1
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

exports['src/cypress/runner tests finish with correct state mocha grep pass with [only] #1'] = [
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
      "retries": -1
    }
  ],
  [
    "mocha",
    "suite",
    {
      "id": "r4",
      "title": "suite 1",
      "root": false,
      "type": "suite",
      "file": null,
      "retries": -1
    }
  ],
  [
    "mocha",
    "hook",
    {
      "id": "r5",
      "title": "\"before all\" hook",
      "hookName": "before all",
      "hookId": "h1",
      "body": "[body]",
      "type": "hook",
      "file": null,
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r5",
      "order": 2,
      "title": "test 2",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
    }
  ],
  [
    "mocha",
    "hook end",
    {
      "id": "r5",
      "title": "\"before all\" hook",
      "hookName": "before all",
      "hookId": "h1",
      "body": "[body]",
      "type": "hook",
      "duration": "match.number",
      "file": null,
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
    }
  ],
  [
    "mocha",
    "test",
    {
      "id": "r5",
      "order": 2,
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
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": 0
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
      "file": null,
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
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
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
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
      "file": null,
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
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
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
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
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
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
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
    }
  ],
  [
    "mocha",
    "pass",
    {
      "id": "r5",
      "order": 2,
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
      "invocationDetails": "{Object 8}",
      "final": true,
      "currentRetry": 0,
      "retries": 0
    }
  ],
  [
    "mocha",
    "test end",
    {
      "id": "r5",
      "order": 2,
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
      "invocationDetails": "{Object 8}",
      "final": true,
      "currentRetry": 0,
      "retries": 0
    }
  ],
  [
    "mocha",
    "suite end",
    {
      "id": "r4",
      "title": "suite 1",
      "root": false,
      "type": "suite",
      "file": null,
      "retries": -1
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
      "id": "r5",
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
      "invocationDetails": "{Object 8}",
      "final": true,
      "currentRetry": 0,
      "retries": 0
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
      "retries": -1
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

exports['serialize state - hooks'] = {
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

exports['src/cypress/runner other specs screenshots screenshot after failed test #1'] = [
  [
    "take:screenshot",
    {
      "titles": [
        "suite 1",
        "test 1"
      ],
      "testId": "r3",
      "testAttemptIndex": 0,
      "simple": true,
      "testFailure": true,
      "capture": "runner",
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
      "scaled": true,
      "blackout": [],
      "startTime": "1970-01-01T00:00:00.000Z"
    }
  ]
]

exports['src/cypress/runner mocha events simple single test #1'] = [
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
      "retries": -1
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
      "retries": -1
    }
  ],
  [
    "mocha",
    "test",
    {
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "file": null,
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
    }
  ],
  [
    "mocha",
    "pass",
    {
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
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        }
      },
      "file": null,
      "invocationDetails": "{Object 8}",
      "final": true,
      "currentRetry": 0,
      "retries": 0
    }
  ],
  [
    "mocha",
    "test end",
    {
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
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        }
      },
      "file": null,
      "invocationDetails": "{Object 8}",
      "final": true,
      "currentRetry": 0,
      "retries": 0
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
      "retries": -1
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
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
        "test": {
          "fnDuration": "match.number",
          "afterFnDuration": "match.number"
        }
      },
      "file": null,
      "invocationDetails": "{Object 8}",
      "final": true,
      "currentRetry": 0,
      "retries": 0
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
      "retries": -1
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

exports['src/cypress/runner mocha events simple three tests #1'] = [
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
      "retries": -1
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
      "retries": -1
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
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
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
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
    }
  ],
  [
    "mocha",
    "test",
    {
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
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": 0
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
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
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
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
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
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
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
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
    }
  ],
  [
    "mocha",
    "pass",
    {
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
      "invocationDetails": "{Object 8}",
      "final": true,
      "currentRetry": 0,
      "retries": 0
    }
  ],
  [
    "mocha",
    "test end",
    {
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
      "invocationDetails": "{Object 8}",
      "final": true,
      "currentRetry": 0,
      "retries": 0
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
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
      "invocationDetails": "{Object 8}",
      "final": true,
      "currentRetry": 0,
      "retries": 0
    }
  ],
  [
    "mocha",
    "test",
    {
      "id": "r4",
      "order": 2,
      "title": "test 2",
      "body": "[body]",
      "type": "test",
      "file": null,
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
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
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r4",
      "order": 2,
      "title": "test 2",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
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
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
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
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
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
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
    }
  ],
  [
    "mocha",
    "pass",
    {
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
      "invocationDetails": "{Object 8}",
      "final": true,
      "currentRetry": 0,
      "retries": 0
    }
  ],
  [
    "mocha",
    "test end",
    {
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
      "invocationDetails": "{Object 8}",
      "final": true,
      "currentRetry": 0,
      "retries": 0
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
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
      "invocationDetails": "{Object 8}",
      "final": true,
      "currentRetry": 0,
      "retries": 0
    }
  ],
  [
    "mocha",
    "test",
    {
      "id": "r5",
      "order": 3,
      "title": "test 3",
      "body": "[body]",
      "type": "test",
      "file": null,
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
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
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
    }
  ],
  [
    "mocha",
    "test:before:run",
    {
      "id": "r5",
      "order": 3,
      "title": "test 3",
      "body": "[body]",
      "type": "test",
      "wallClockStartedAt": "match.date",
      "file": null,
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
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
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
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
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
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
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
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
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
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
      "invocationDetails": "{Object 8}",
      "currentRetry": 0,
      "retries": -1
    }
  ],
  [
    "mocha",
    "pass",
    {
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
      "invocationDetails": "{Object 8}",
      "final": true,
      "currentRetry": 0,
      "retries": 0
    }
  ],
  [
    "mocha",
    "test end",
    {
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
      "invocationDetails": "{Object 8}",
      "final": true,
      "currentRetry": 0,
      "retries": 0
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
      "retries": -1
    }
  ],
  [
    "mocha",
    "test:after:run",
    {
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
      "invocationDetails": "{Object 8}",
      "final": true,
      "currentRetry": 0,
      "retries": 0
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
      "retries": -1
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
