exports['reporter retries can correctly handle retries #1'] = {
  "r3": {
    "title": "test 1",
    "fn": "[Function fn]",
    "_timeout": 2000,
    "_slow": 75,
    "_enableTimeouts": true,
    "_trace": {},
    "_retries": 2,
    "_currentRetry": 0,
    "pending": false,
    "type": "test",
    "body": "[body]",
    "duration": 1,
    "state": "passed",
    "parent": "{Suite}",
    "id": "r3",
    "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
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
    "speed": "fast",
    "wallClockDuration": 1,
    "addListener": "[Function addListener]",
    "clearTimeout": "[Function]",
    "clone": "[Function]",
    "currentRetry": "[Function]",
    "emit": "[Function emit]",
    "enableTimeouts": "[Function]",
    "eventNames": "[Function eventNames]",
    "fullTitle": "[Function]",
    "getMaxListeners": "[Function getMaxListeners]",
    "globals": "[Function]",
    "inspect": "[Function]",
    "listenerCount": "[Function listenerCount]",
    "listeners": "[Function listeners]",
    "on": "[Function addListener]",
    "once": "[Function once]",
    "prependListener": "[Function prependListener]",
    "prependOnceListener": "[Function prependOnceListener]",
    "removeAllListeners": "[Function removeAllListeners]",
    "removeListener": "[Function removeListener]",
    "resetTimeout": "[Function]",
    "retries": "[Function]",
    "run": "[Function]",
    "setMaxListeners": "[Function setMaxListeners]",
    "skip": "[Function]",
    "slow": "[Function]",
    "timeout": "[Function]",
    "titlePath": "[Function]"
  },
  "r4": {
    "title": "test 2",
    "fn": "[Function fn]",
    "_timeout": 2000,
    "_slow": 75,
    "_enableTimeouts": true,
    "_trace": {},
    "_retries": 2,
    "_currentRetry": 2,
    "pending": false,
    "type": "test",
    "body": "[body]",
    "duration": 1,
    "state": "passed",
    "parent": "{Suite}",
    "id": "r4",
    "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
    "err": "{Object 6}",
    "wallClockDuration": 1,
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
    "prevAttempts": [
      {
        "title": "test 2",
        "fn": "[Function fn]",
        "_timeout": 2000,
        "_slow": 75,
        "_enableTimeouts": true,
        "_trace": {},
        "_retries": 2,
        "_currentRetry": 0,
        "pending": false,
        "type": "test",
        "body": "[body]",
        "duration": 1,
        "state": "failed",
        "parent": "{Suite}",
        "id": "r4",
        "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
        "err": "{Object 6}",
        "wallClockDuration": 1,
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
        "addListener": "[Function addListener]",
        "clearTimeout": "[Function]",
        "clone": "[Function]",
        "currentRetry": "[Function]",
        "emit": "[Function emit]",
        "enableTimeouts": "[Function]",
        "eventNames": "[Function eventNames]",
        "fullTitle": "[Function]",
        "getMaxListeners": "[Function getMaxListeners]",
        "globals": "[Function]",
        "inspect": "[Function]",
        "listenerCount": "[Function listenerCount]",
        "listeners": "[Function listeners]",
        "on": "[Function addListener]",
        "once": "[Function once]",
        "prependListener": "[Function prependListener]",
        "prependOnceListener": "[Function prependOnceListener]",
        "removeAllListeners": "[Function removeAllListeners]",
        "removeListener": "[Function removeListener]",
        "resetTimeout": "[Function]",
        "retries": "[Function]",
        "run": "[Function]",
        "setMaxListeners": "[Function setMaxListeners]",
        "skip": "[Function]",
        "slow": "[Function]",
        "timeout": "[Function]",
        "titlePath": "[Function]"
      },
      {
        "title": "test 2",
        "fn": "[Function fn]",
        "_timeout": 2000,
        "_slow": 75,
        "_enableTimeouts": true,
        "_trace": {},
        "_retries": 2,
        "_currentRetry": 1,
        "pending": false,
        "type": "test",
        "body": "[body]",
        "duration": 1,
        "state": "failed",
        "parent": "{Suite}",
        "id": "r4",
        "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
        "err": "{Object 6}",
        "wallClockDuration": 1,
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
        "prevAttempts": [
          {
            "title": "test 2",
            "fn": "[Function fn]",
            "_timeout": 2000,
            "_slow": 75,
            "_enableTimeouts": true,
            "_trace": {},
            "_retries": 2,
            "_currentRetry": 0,
            "pending": false,
            "type": "test",
            "body": "[body]",
            "duration": 1,
            "state": "failed",
            "parent": "{Suite}",
            "id": "r4",
            "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
            "err": "{Object 6}",
            "wallClockDuration": 1,
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
            "addListener": "[Function addListener]",
            "clearTimeout": "[Function]",
            "clone": "[Function]",
            "currentRetry": "[Function]",
            "emit": "[Function emit]",
            "enableTimeouts": "[Function]",
            "eventNames": "[Function eventNames]",
            "fullTitle": "[Function]",
            "getMaxListeners": "[Function getMaxListeners]",
            "globals": "[Function]",
            "inspect": "[Function]",
            "listenerCount": "[Function listenerCount]",
            "listeners": "[Function listeners]",
            "on": "[Function addListener]",
            "once": "[Function once]",
            "prependListener": "[Function prependListener]",
            "prependOnceListener": "[Function prependOnceListener]",
            "removeAllListeners": "[Function removeAllListeners]",
            "removeListener": "[Function removeListener]",
            "resetTimeout": "[Function]",
            "retries": "[Function]",
            "run": "[Function]",
            "setMaxListeners": "[Function setMaxListeners]",
            "skip": "[Function]",
            "slow": "[Function]",
            "timeout": "[Function]",
            "titlePath": "[Function]"
          }
        ],
        "addListener": "[Function addListener]",
        "clearTimeout": "[Function]",
        "clone": "[Function]",
        "currentRetry": "[Function]",
        "emit": "[Function emit]",
        "enableTimeouts": "[Function]",
        "eventNames": "[Function eventNames]",
        "fullTitle": "[Function]",
        "getMaxListeners": "[Function getMaxListeners]",
        "globals": "[Function]",
        "inspect": "[Function]",
        "listenerCount": "[Function listenerCount]",
        "listeners": "[Function listeners]",
        "on": "[Function addListener]",
        "once": "[Function once]",
        "prependListener": "[Function prependListener]",
        "prependOnceListener": "[Function prependOnceListener]",
        "removeAllListeners": "[Function removeAllListeners]",
        "removeListener": "[Function removeListener]",
        "resetTimeout": "[Function]",
        "retries": "[Function]",
        "run": "[Function]",
        "setMaxListeners": "[Function setMaxListeners]",
        "skip": "[Function]",
        "slow": "[Function]",
        "timeout": "[Function]",
        "titlePath": "[Function]"
      }
    ],
    "speed": "fast",
    "final": true,
    "addListener": "[Function addListener]",
    "clearTimeout": "[Function]",
    "clone": "[Function]",
    "currentRetry": "[Function]",
    "emit": "[Function emit]",
    "enableTimeouts": "[Function]",
    "eventNames": "[Function eventNames]",
    "fullTitle": "[Function]",
    "getMaxListeners": "[Function getMaxListeners]",
    "globals": "[Function]",
    "inspect": "[Function]",
    "listenerCount": "[Function listenerCount]",
    "listeners": "[Function listeners]",
    "on": "[Function addListener]",
    "once": "[Function once]",
    "prependListener": "[Function prependListener]",
    "prependOnceListener": "[Function prependOnceListener]",
    "removeAllListeners": "[Function removeAllListeners]",
    "removeListener": "[Function removeListener]",
    "resetTimeout": "[Function]",
    "retries": "[Function]",
    "run": "[Function]",
    "setMaxListeners": "[Function setMaxListeners]",
    "skip": "[Function]",
    "slow": "[Function]",
    "timeout": "[Function]",
    "titlePath": "[Function]"
  },
  "r5": {
    "title": "test 3",
    "fn": "[Function fn]",
    "_timeout": 2000,
    "_slow": 75,
    "_enableTimeouts": true,
    "_trace": {},
    "_retries": 2,
    "_currentRetry": 0,
    "pending": false,
    "type": "test",
    "body": "[body]",
    "duration": 1,
    "state": "passed",
    "parent": "{Suite}",
    "id": "r5",
    "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
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
    "speed": "fast",
    "wallClockDuration": 1,
    "addListener": "[Function addListener]",
    "clearTimeout": "[Function]",
    "clone": "[Function]",
    "currentRetry": "[Function]",
    "emit": "[Function emit]",
    "enableTimeouts": "[Function]",
    "eventNames": "[Function eventNames]",
    "fullTitle": "[Function]",
    "getMaxListeners": "[Function getMaxListeners]",
    "globals": "[Function]",
    "inspect": "[Function]",
    "listenerCount": "[Function listenerCount]",
    "listeners": "[Function listeners]",
    "on": "[Function addListener]",
    "once": "[Function once]",
    "prependListener": "[Function prependListener]",
    "prependOnceListener": "[Function prependOnceListener]",
    "removeAllListeners": "[Function removeAllListeners]",
    "removeListener": "[Function removeListener]",
    "resetTimeout": "[Function]",
    "retries": "[Function]",
    "run": "[Function]",
    "setMaxListeners": "[Function setMaxListeners]",
    "skip": "[Function]",
    "slow": "[Function]",
    "timeout": "[Function]",
    "titlePath": "[Function]"
  },
  "r2": {
    "title": "suite 1",
    "ctx": {},
    "suites": [],
    "tests": [
      {
        "title": "test 1",
        "fn": "[Function fn]",
        "_timeout": 2000,
        "_slow": 75,
        "_enableTimeouts": true,
        "_trace": {},
        "_retries": 2,
        "_currentRetry": 0,
        "pending": false,
        "type": "test",
        "body": "[body]",
        "duration": 1,
        "state": "passed",
        "parent": "{Suite}",
        "id": "r3",
        "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
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
        "speed": "fast",
        "wallClockDuration": 1,
        "addListener": "[Function addListener]",
        "clearTimeout": "[Function]",
        "clone": "[Function]",
        "currentRetry": "[Function]",
        "emit": "[Function emit]",
        "enableTimeouts": "[Function]",
        "eventNames": "[Function eventNames]",
        "fullTitle": "[Function]",
        "getMaxListeners": "[Function getMaxListeners]",
        "globals": "[Function]",
        "inspect": "[Function]",
        "listenerCount": "[Function listenerCount]",
        "listeners": "[Function listeners]",
        "on": "[Function addListener]",
        "once": "[Function once]",
        "prependListener": "[Function prependListener]",
        "prependOnceListener": "[Function prependOnceListener]",
        "removeAllListeners": "[Function removeAllListeners]",
        "removeListener": "[Function removeListener]",
        "resetTimeout": "[Function]",
        "retries": "[Function]",
        "run": "[Function]",
        "setMaxListeners": "[Function setMaxListeners]",
        "skip": "[Function]",
        "slow": "[Function]",
        "timeout": "[Function]",
        "titlePath": "[Function]"
      },
      {
        "title": "test 2",
        "fn": "[Function fn]",
        "_timeout": 2000,
        "_slow": 75,
        "_enableTimeouts": true,
        "_trace": {},
        "_retries": 2,
        "_currentRetry": 2,
        "pending": false,
        "type": "test",
        "body": "[body]",
        "duration": 1,
        "state": "passed",
        "parent": "{Suite}",
        "id": "r4",
        "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
        "err": "{Object 6}",
        "wallClockDuration": 1,
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
        "prevAttempts": [
          {
            "title": "test 2",
            "fn": "[Function fn]",
            "_timeout": 2000,
            "_slow": 75,
            "_enableTimeouts": true,
            "_trace": {},
            "_retries": 2,
            "_currentRetry": 0,
            "pending": false,
            "type": "test",
            "body": "[body]",
            "duration": 1,
            "state": "failed",
            "parent": "{Suite}",
            "id": "r4",
            "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
            "err": "{Object 6}",
            "wallClockDuration": 1,
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
            "addListener": "[Function addListener]",
            "clearTimeout": "[Function]",
            "clone": "[Function]",
            "currentRetry": "[Function]",
            "emit": "[Function emit]",
            "enableTimeouts": "[Function]",
            "eventNames": "[Function eventNames]",
            "fullTitle": "[Function]",
            "getMaxListeners": "[Function getMaxListeners]",
            "globals": "[Function]",
            "inspect": "[Function]",
            "listenerCount": "[Function listenerCount]",
            "listeners": "[Function listeners]",
            "on": "[Function addListener]",
            "once": "[Function once]",
            "prependListener": "[Function prependListener]",
            "prependOnceListener": "[Function prependOnceListener]",
            "removeAllListeners": "[Function removeAllListeners]",
            "removeListener": "[Function removeListener]",
            "resetTimeout": "[Function]",
            "retries": "[Function]",
            "run": "[Function]",
            "setMaxListeners": "[Function setMaxListeners]",
            "skip": "[Function]",
            "slow": "[Function]",
            "timeout": "[Function]",
            "titlePath": "[Function]"
          },
          {
            "title": "test 2",
            "fn": "[Function fn]",
            "_timeout": 2000,
            "_slow": 75,
            "_enableTimeouts": true,
            "_trace": {},
            "_retries": 2,
            "_currentRetry": 1,
            "pending": false,
            "type": "test",
            "body": "[body]",
            "duration": 1,
            "state": "failed",
            "parent": "{Suite}",
            "id": "r4",
            "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
            "err": "{Object 6}",
            "wallClockDuration": 1,
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
            "prevAttempts": [
              {
                "title": "test 2",
                "fn": "[Function fn]",
                "_timeout": 2000,
                "_slow": 75,
                "_enableTimeouts": true,
                "_trace": {},
                "_retries": 2,
                "_currentRetry": 0,
                "pending": false,
                "type": "test",
                "body": "[body]",
                "duration": 1,
                "state": "failed",
                "parent": "{Suite}",
                "id": "r4",
                "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
                "err": "{Object 6}",
                "wallClockDuration": 1,
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
                "addListener": "[Function addListener]",
                "clearTimeout": "[Function]",
                "clone": "[Function]",
                "currentRetry": "[Function]",
                "emit": "[Function emit]",
                "enableTimeouts": "[Function]",
                "eventNames": "[Function eventNames]",
                "fullTitle": "[Function]",
                "getMaxListeners": "[Function getMaxListeners]",
                "globals": "[Function]",
                "inspect": "[Function]",
                "listenerCount": "[Function listenerCount]",
                "listeners": "[Function listeners]",
                "on": "[Function addListener]",
                "once": "[Function once]",
                "prependListener": "[Function prependListener]",
                "prependOnceListener": "[Function prependOnceListener]",
                "removeAllListeners": "[Function removeAllListeners]",
                "removeListener": "[Function removeListener]",
                "resetTimeout": "[Function]",
                "retries": "[Function]",
                "run": "[Function]",
                "setMaxListeners": "[Function setMaxListeners]",
                "skip": "[Function]",
                "slow": "[Function]",
                "timeout": "[Function]",
                "titlePath": "[Function]"
              }
            ],
            "addListener": "[Function addListener]",
            "clearTimeout": "[Function]",
            "clone": "[Function]",
            "currentRetry": "[Function]",
            "emit": "[Function emit]",
            "enableTimeouts": "[Function]",
            "eventNames": "[Function eventNames]",
            "fullTitle": "[Function]",
            "getMaxListeners": "[Function getMaxListeners]",
            "globals": "[Function]",
            "inspect": "[Function]",
            "listenerCount": "[Function listenerCount]",
            "listeners": "[Function listeners]",
            "on": "[Function addListener]",
            "once": "[Function once]",
            "prependListener": "[Function prependListener]",
            "prependOnceListener": "[Function prependOnceListener]",
            "removeAllListeners": "[Function removeAllListeners]",
            "removeListener": "[Function removeListener]",
            "resetTimeout": "[Function]",
            "retries": "[Function]",
            "run": "[Function]",
            "setMaxListeners": "[Function setMaxListeners]",
            "skip": "[Function]",
            "slow": "[Function]",
            "timeout": "[Function]",
            "titlePath": "[Function]"
          }
        ],
        "speed": "fast",
        "final": true,
        "addListener": "[Function addListener]",
        "clearTimeout": "[Function]",
        "clone": "[Function]",
        "currentRetry": "[Function]",
        "emit": "[Function emit]",
        "enableTimeouts": "[Function]",
        "eventNames": "[Function eventNames]",
        "fullTitle": "[Function]",
        "getMaxListeners": "[Function getMaxListeners]",
        "globals": "[Function]",
        "inspect": "[Function]",
        "listenerCount": "[Function listenerCount]",
        "listeners": "[Function listeners]",
        "on": "[Function addListener]",
        "once": "[Function once]",
        "prependListener": "[Function prependListener]",
        "prependOnceListener": "[Function prependOnceListener]",
        "removeAllListeners": "[Function removeAllListeners]",
        "removeListener": "[Function removeListener]",
        "resetTimeout": "[Function]",
        "retries": "[Function]",
        "run": "[Function]",
        "setMaxListeners": "[Function setMaxListeners]",
        "skip": "[Function]",
        "slow": "[Function]",
        "timeout": "[Function]",
        "titlePath": "[Function]"
      },
      {
        "title": "test 3",
        "fn": "[Function fn]",
        "_timeout": 2000,
        "_slow": 75,
        "_enableTimeouts": true,
        "_trace": {},
        "_retries": 2,
        "_currentRetry": 0,
        "pending": false,
        "type": "test",
        "body": "[body]",
        "duration": 1,
        "state": "passed",
        "parent": "{Suite}",
        "id": "r5",
        "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
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
        "speed": "fast",
        "wallClockDuration": 1,
        "addListener": "[Function addListener]",
        "clearTimeout": "[Function]",
        "clone": "[Function]",
        "currentRetry": "[Function]",
        "emit": "[Function emit]",
        "enableTimeouts": "[Function]",
        "eventNames": "[Function eventNames]",
        "fullTitle": "[Function]",
        "getMaxListeners": "[Function getMaxListeners]",
        "globals": "[Function]",
        "inspect": "[Function]",
        "listenerCount": "[Function listenerCount]",
        "listeners": "[Function listeners]",
        "on": "[Function addListener]",
        "once": "[Function once]",
        "prependListener": "[Function prependListener]",
        "prependOnceListener": "[Function prependOnceListener]",
        "removeAllListeners": "[Function removeAllListeners]",
        "removeListener": "[Function removeListener]",
        "resetTimeout": "[Function]",
        "retries": "[Function]",
        "run": "[Function]",
        "setMaxListeners": "[Function setMaxListeners]",
        "skip": "[Function]",
        "slow": "[Function]",
        "timeout": "[Function]",
        "titlePath": "[Function]"
      }
    ],
    "pending": false,
    "_beforeEach": [],
    "_beforeAll": [],
    "_afterEach": [],
    "_afterAll": [],
    "root": false,
    "_timeout": 2000,
    "_enableTimeouts": true,
    "_slow": 75,
    "_bail": false,
    "_retries": 2,
    "delayed": false,
    "parent": "{Suite}",
    "id": "r2",
    "type": "suite",
    "addListener": "[Function addListener]",
    "addSuite": "[Function]",
    "addTest": "[Function]",
    "afterAll": "[Function]",
    "afterEach": "[Function]",
    "bail": "[Function]",
    "beforeAll": "[Function]",
    "beforeEach": "[Function]",
    "clone": "[Function]",
    "eachTest": "[Function]",
    "emit": "[Function emit]",
    "enableTimeouts": "[Function]",
    "eventNames": "[Function eventNames]",
    "fullTitle": "[Function]",
    "getMaxListeners": "[Function getMaxListeners]",
    "listenerCount": "[Function listenerCount]",
    "listeners": "[Function listeners]",
    "on": "[Function addListener]",
    "once": "[Function once]",
    "prependListener": "[Function prependListener]",
    "prependOnceListener": "[Function prependOnceListener]",
    "removeAllListeners": "[Function removeAllListeners]",
    "removeListener": "[Function removeListener]",
    "retries": "[Function]",
    "run": "[Function run]",
    "setMaxListeners": "[Function setMaxListeners]",
    "slow": "[Function]",
    "timeout": "[Function]",
    "titlePath": "[Function]",
    "total": "[Function]"
  },
  "r1": {
    "title": "",
    "ctx": {},
    "suites": [
      {
        "title": "suite 1",
        "ctx": {},
        "suites": [],
        "tests": [
          {
            "title": "test 1",
            "fn": "[Function fn]",
            "_timeout": 2000,
            "_slow": 75,
            "_enableTimeouts": true,
            "_trace": {},
            "_retries": 2,
            "_currentRetry": 0,
            "pending": false,
            "type": "test",
            "body": "[body]",
            "duration": 1,
            "state": "passed",
            "parent": "{Suite}",
            "id": "r3",
            "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
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
            "speed": "fast",
            "wallClockDuration": 1,
            "addListener": "[Function addListener]",
            "clearTimeout": "[Function]",
            "clone": "[Function]",
            "currentRetry": "[Function]",
            "emit": "[Function emit]",
            "enableTimeouts": "[Function]",
            "eventNames": "[Function eventNames]",
            "fullTitle": "[Function]",
            "getMaxListeners": "[Function getMaxListeners]",
            "globals": "[Function]",
            "inspect": "[Function]",
            "listenerCount": "[Function listenerCount]",
            "listeners": "[Function listeners]",
            "on": "[Function addListener]",
            "once": "[Function once]",
            "prependListener": "[Function prependListener]",
            "prependOnceListener": "[Function prependOnceListener]",
            "removeAllListeners": "[Function removeAllListeners]",
            "removeListener": "[Function removeListener]",
            "resetTimeout": "[Function]",
            "retries": "[Function]",
            "run": "[Function]",
            "setMaxListeners": "[Function setMaxListeners]",
            "skip": "[Function]",
            "slow": "[Function]",
            "timeout": "[Function]",
            "titlePath": "[Function]"
          },
          {
            "title": "test 2",
            "fn": "[Function fn]",
            "_timeout": 2000,
            "_slow": 75,
            "_enableTimeouts": true,
            "_trace": {},
            "_retries": 2,
            "_currentRetry": 2,
            "pending": false,
            "type": "test",
            "body": "[body]",
            "duration": 1,
            "state": "passed",
            "parent": "{Suite}",
            "id": "r4",
            "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
            "err": "{Object 6}",
            "wallClockDuration": 1,
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
            "prevAttempts": [
              {
                "title": "test 2",
                "fn": "[Function fn]",
                "_timeout": 2000,
                "_slow": 75,
                "_enableTimeouts": true,
                "_trace": {},
                "_retries": 2,
                "_currentRetry": 0,
                "pending": false,
                "type": "test",
                "body": "[body]",
                "duration": 1,
                "state": "failed",
                "parent": "{Suite}",
                "id": "r4",
                "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
                "err": "{Object 6}",
                "wallClockDuration": 1,
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
                "addListener": "[Function addListener]",
                "clearTimeout": "[Function]",
                "clone": "[Function]",
                "currentRetry": "[Function]",
                "emit": "[Function emit]",
                "enableTimeouts": "[Function]",
                "eventNames": "[Function eventNames]",
                "fullTitle": "[Function]",
                "getMaxListeners": "[Function getMaxListeners]",
                "globals": "[Function]",
                "inspect": "[Function]",
                "listenerCount": "[Function listenerCount]",
                "listeners": "[Function listeners]",
                "on": "[Function addListener]",
                "once": "[Function once]",
                "prependListener": "[Function prependListener]",
                "prependOnceListener": "[Function prependOnceListener]",
                "removeAllListeners": "[Function removeAllListeners]",
                "removeListener": "[Function removeListener]",
                "resetTimeout": "[Function]",
                "retries": "[Function]",
                "run": "[Function]",
                "setMaxListeners": "[Function setMaxListeners]",
                "skip": "[Function]",
                "slow": "[Function]",
                "timeout": "[Function]",
                "titlePath": "[Function]"
              },
              {
                "title": "test 2",
                "fn": "[Function fn]",
                "_timeout": 2000,
                "_slow": 75,
                "_enableTimeouts": true,
                "_trace": {},
                "_retries": 2,
                "_currentRetry": 1,
                "pending": false,
                "type": "test",
                "body": "[body]",
                "duration": 1,
                "state": "failed",
                "parent": "{Suite}",
                "id": "r4",
                "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
                "err": "{Object 6}",
                "wallClockDuration": 1,
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
                "prevAttempts": [
                  {
                    "title": "test 2",
                    "fn": "[Function fn]",
                    "_timeout": 2000,
                    "_slow": 75,
                    "_enableTimeouts": true,
                    "_trace": {},
                    "_retries": 2,
                    "_currentRetry": 0,
                    "pending": false,
                    "type": "test",
                    "body": "[body]",
                    "duration": 1,
                    "state": "failed",
                    "parent": "{Suite}",
                    "id": "r4",
                    "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
                    "err": "{Object 6}",
                    "wallClockDuration": 1,
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
                    "addListener": "[Function addListener]",
                    "clearTimeout": "[Function]",
                    "clone": "[Function]",
                    "currentRetry": "[Function]",
                    "emit": "[Function emit]",
                    "enableTimeouts": "[Function]",
                    "eventNames": "[Function eventNames]",
                    "fullTitle": "[Function]",
                    "getMaxListeners": "[Function getMaxListeners]",
                    "globals": "[Function]",
                    "inspect": "[Function]",
                    "listenerCount": "[Function listenerCount]",
                    "listeners": "[Function listeners]",
                    "on": "[Function addListener]",
                    "once": "[Function once]",
                    "prependListener": "[Function prependListener]",
                    "prependOnceListener": "[Function prependOnceListener]",
                    "removeAllListeners": "[Function removeAllListeners]",
                    "removeListener": "[Function removeListener]",
                    "resetTimeout": "[Function]",
                    "retries": "[Function]",
                    "run": "[Function]",
                    "setMaxListeners": "[Function setMaxListeners]",
                    "skip": "[Function]",
                    "slow": "[Function]",
                    "timeout": "[Function]",
                    "titlePath": "[Function]"
                  }
                ],
                "addListener": "[Function addListener]",
                "clearTimeout": "[Function]",
                "clone": "[Function]",
                "currentRetry": "[Function]",
                "emit": "[Function emit]",
                "enableTimeouts": "[Function]",
                "eventNames": "[Function eventNames]",
                "fullTitle": "[Function]",
                "getMaxListeners": "[Function getMaxListeners]",
                "globals": "[Function]",
                "inspect": "[Function]",
                "listenerCount": "[Function listenerCount]",
                "listeners": "[Function listeners]",
                "on": "[Function addListener]",
                "once": "[Function once]",
                "prependListener": "[Function prependListener]",
                "prependOnceListener": "[Function prependOnceListener]",
                "removeAllListeners": "[Function removeAllListeners]",
                "removeListener": "[Function removeListener]",
                "resetTimeout": "[Function]",
                "retries": "[Function]",
                "run": "[Function]",
                "setMaxListeners": "[Function setMaxListeners]",
                "skip": "[Function]",
                "slow": "[Function]",
                "timeout": "[Function]",
                "titlePath": "[Function]"
              }
            ],
            "speed": "fast",
            "final": true,
            "addListener": "[Function addListener]",
            "clearTimeout": "[Function]",
            "clone": "[Function]",
            "currentRetry": "[Function]",
            "emit": "[Function emit]",
            "enableTimeouts": "[Function]",
            "eventNames": "[Function eventNames]",
            "fullTitle": "[Function]",
            "getMaxListeners": "[Function getMaxListeners]",
            "globals": "[Function]",
            "inspect": "[Function]",
            "listenerCount": "[Function listenerCount]",
            "listeners": "[Function listeners]",
            "on": "[Function addListener]",
            "once": "[Function once]",
            "prependListener": "[Function prependListener]",
            "prependOnceListener": "[Function prependOnceListener]",
            "removeAllListeners": "[Function removeAllListeners]",
            "removeListener": "[Function removeListener]",
            "resetTimeout": "[Function]",
            "retries": "[Function]",
            "run": "[Function]",
            "setMaxListeners": "[Function setMaxListeners]",
            "skip": "[Function]",
            "slow": "[Function]",
            "timeout": "[Function]",
            "titlePath": "[Function]"
          },
          {
            "title": "test 3",
            "fn": "[Function fn]",
            "_timeout": 2000,
            "_slow": 75,
            "_enableTimeouts": true,
            "_trace": {},
            "_retries": 2,
            "_currentRetry": 0,
            "pending": false,
            "type": "test",
            "body": "[body]",
            "duration": 1,
            "state": "passed",
            "parent": "{Suite}",
            "id": "r5",
            "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
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
            "speed": "fast",
            "wallClockDuration": 1,
            "addListener": "[Function addListener]",
            "clearTimeout": "[Function]",
            "clone": "[Function]",
            "currentRetry": "[Function]",
            "emit": "[Function emit]",
            "enableTimeouts": "[Function]",
            "eventNames": "[Function eventNames]",
            "fullTitle": "[Function]",
            "getMaxListeners": "[Function getMaxListeners]",
            "globals": "[Function]",
            "inspect": "[Function]",
            "listenerCount": "[Function listenerCount]",
            "listeners": "[Function listeners]",
            "on": "[Function addListener]",
            "once": "[Function once]",
            "prependListener": "[Function prependListener]",
            "prependOnceListener": "[Function prependOnceListener]",
            "removeAllListeners": "[Function removeAllListeners]",
            "removeListener": "[Function removeListener]",
            "resetTimeout": "[Function]",
            "retries": "[Function]",
            "run": "[Function]",
            "setMaxListeners": "[Function setMaxListeners]",
            "skip": "[Function]",
            "slow": "[Function]",
            "timeout": "[Function]",
            "titlePath": "[Function]"
          }
        ],
        "pending": false,
        "_beforeEach": [],
        "_beforeAll": [],
        "_afterEach": [],
        "_afterAll": [],
        "root": false,
        "_timeout": 2000,
        "_enableTimeouts": true,
        "_slow": 75,
        "_bail": false,
        "_retries": 2,
        "delayed": false,
        "parent": "{Suite}",
        "id": "r2",
        "type": "suite",
        "addListener": "[Function addListener]",
        "addSuite": "[Function]",
        "addTest": "[Function]",
        "afterAll": "[Function]",
        "afterEach": "[Function]",
        "bail": "[Function]",
        "beforeAll": "[Function]",
        "beforeEach": "[Function]",
        "clone": "[Function]",
        "eachTest": "[Function]",
        "emit": "[Function emit]",
        "enableTimeouts": "[Function]",
        "eventNames": "[Function eventNames]",
        "fullTitle": "[Function]",
        "getMaxListeners": "[Function getMaxListeners]",
        "listenerCount": "[Function listenerCount]",
        "listeners": "[Function listeners]",
        "on": "[Function addListener]",
        "once": "[Function once]",
        "prependListener": "[Function prependListener]",
        "prependOnceListener": "[Function prependOnceListener]",
        "removeAllListeners": "[Function removeAllListeners]",
        "removeListener": "[Function removeListener]",
        "retries": "[Function]",
        "run": "[Function run]",
        "setMaxListeners": "[Function setMaxListeners]",
        "slow": "[Function]",
        "timeout": "[Function]",
        "titlePath": "[Function]",
        "total": "[Function]"
      }
    ],
    "tests": [],
    "pending": false,
    "_beforeEach": [],
    "_beforeAll": [],
    "_afterEach": [],
    "_afterAll": [],
    "root": true,
    "_timeout": 2000,
    "_enableTimeouts": true,
    "_slow": 75,
    "_bail": false,
    "_retries": 2,
    "delayed": false,
    "id": "r1",
    "type": "suite",
    "addListener": "[Function addListener]",
    "addSuite": "[Function]",
    "addTest": "[Function]",
    "afterAll": "[Function]",
    "afterEach": "[Function]",
    "bail": "[Function]",
    "beforeAll": "[Function]",
    "beforeEach": "[Function]",
    "clone": "[Function]",
    "eachTest": "[Function]",
    "emit": "[Function emit]",
    "enableTimeouts": "[Function]",
    "eventNames": "[Function eventNames]",
    "fullTitle": "[Function]",
    "getMaxListeners": "[Function getMaxListeners]",
    "listenerCount": "[Function listenerCount]",
    "listeners": "[Function listeners]",
    "on": "[Function addListener]",
    "once": "[Function once]",
    "prependListener": "[Function prependListener]",
    "prependOnceListener": "[Function prependOnceListener]",
    "removeAllListeners": "[Function removeAllListeners]",
    "removeListener": "[Function removeListener]",
    "retries": "[Function]",
    "run": "[Function run]",
    "setMaxListeners": "[Function setMaxListeners]",
    "slow": "[Function]",
    "timeout": "[Function]",
    "titlePath": "[Function]",
    "total": "[Function]"
  },
  "h1": {
    "hookId": "h1",
    "type": "hook",
    "title": "\"before all\" hook",
    "body": "[body]",
    "hookName": "before all"
  },
  "h2": {
    "hookId": "h2",
    "type": "hook",
    "title": "\"before each\" hook",
    "body": "[body]",
    "hookName": "before each"
  },
  "h3": {
    "hookId": "h3",
    "type": "hook",
    "title": "\"after each\" hook",
    "body": "[body]",
    "hookName": "after each"
  },
  "h4": {
    "hookId": "h4",
    "type": "hook",
    "title": "\"after all\" hook",
    "body": "[body]",
    "hookName": "after all"
  }
}

exports['reporter retries can correctly handle retries #2'] = [
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
    "pass",
    "{Test}"
  ],
  [
    "test end",
    "{Test}"
  ],
  [
    "hook",
    "{Object 53}"
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
    "{Object 54}"
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
    "pass",
    "{Test}"
  ],
  [
    "test end",
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
    "pass",
    "{Test}"
  ],
  [
    "test end",
    "{Test}"
  ],
  [
    "hook",
    "{Object 53}"
  ],
  [
    "hook end",
    "{Object 53}"
  ],
  [
    "hook",
    "{Object 53}"
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

exports['reporter retries can correctly handle retries #3'] = {
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
    "start": "2019-04-05T23:51:31.712Z",
    "end": "2019-04-05T23:51:31.718Z",
    "duration": 6
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
      "videoTimestamp": null,
      "attemptIndex": 0
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
      "attemptIndex": 2,
      "prevAttempts": [
        {
          "testId": "r4",
          "title": [
            "suite 1",
            "test 2"
          ],
          "state": "failed",
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
          "attemptIndex": 0
        },
        {
          "testId": "r4",
          "title": [
            "suite 1",
            "test 2"
          ],
          "state": "failed",
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
          "attemptIndex": 1,
          "prevAttempts": [
            {
              "testId": "r4",
              "title": [
                "suite 1",
                "test 2"
              ],
              "state": "failed",
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
              "attemptIndex": 0
            }
          ]
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
      "videoTimestamp": null,
      "attemptIndex": 0
    }
  ]
}

exports['reporter retries can receive events #1'] = [
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
    "pass",
    "{Test}"
  ],
  [
    "test end",
    "{Test}"
  ],
  [
    "hook",
    "{Object 53}"
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
    "pass",
    "{Test}"
  ],
  [
    "test end",
    "{Test}"
  ],
  [
    "hook",
    "{Object 53}"
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
    "pass",
    "{Test}"
  ],
  [
    "test end",
    "{Test}"
  ],
  [
    "hook",
    "{Object 53}"
  ],
  [
    "hook end",
    "{Object 53}"
  ],
  [
    "hook",
    "{Object 53}"
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

exports['reporter retries retry [afterEach] #1'] = [
  [],
  [
    "%s%s",
    "",
    ""
  ],
  [
    "%s%s",
    "  ",
    "suite 1"
  ],
  [
    "    \u2713 %s",
    "test 1"
  ],
  [
    "    \u2713 %s",
    "test 1"
  ],
  [],
  [],
  [
    "  %d passing (%s)",
    2,
    "9ms"
  ],
  []
]

exports['reporter retries retry [afterEach] #2'] = {
  "r3": {
    "title": "test 1",
    "fn": "[Function fn]",
    "_timeout": 2000,
    "_slow": 75,
    "_enableTimeouts": true,
    "_trace": {},
    "_retries": 1,
    "_currentRetry": 1,
    "pending": false,
    "type": "test",
    "body": "[body]",
    "duration": 1,
    "state": "passed",
    "parent": "{Suite}",
    "id": "r3",
    "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
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
    "speed": "fast",
    "err": "{Object 5}",
    "wallClockDuration": 1,
    "prevAttempts": [
      {
        "title": "test 1",
        "fn": "[Function fn]",
        "_timeout": 2000,
        "_slow": 75,
        "_enableTimeouts": true,
        "_trace": {},
        "_retries": 1,
        "_currentRetry": 0,
        "pending": false,
        "type": "test",
        "body": "[body]",
        "duration": 1,
        "state": "failed",
        "parent": "{Suite}",
        "id": "r3",
        "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
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
        "speed": "fast",
        "err": "{Object 5}",
        "wallClockDuration": 1,
        "addListener": "[Function addListener]",
        "clearTimeout": "[Function]",
        "clone": "[Function]",
        "currentRetry": "[Function]",
        "emit": "[Function emit]",
        "enableTimeouts": "[Function]",
        "eventNames": "[Function eventNames]",
        "fullTitle": "[Function]",
        "getMaxListeners": "[Function getMaxListeners]",
        "globals": "[Function]",
        "inspect": "[Function]",
        "listenerCount": "[Function listenerCount]",
        "listeners": "[Function listeners]",
        "on": "[Function addListener]",
        "once": "[Function once]",
        "prependListener": "[Function prependListener]",
        "prependOnceListener": "[Function prependOnceListener]",
        "removeAllListeners": "[Function removeAllListeners]",
        "removeListener": "[Function removeListener]",
        "resetTimeout": "[Function]",
        "retries": "[Function]",
        "run": "[Function]",
        "setMaxListeners": "[Function setMaxListeners]",
        "skip": "[Function]",
        "slow": "[Function]",
        "timeout": "[Function]",
        "titlePath": "[Function]"
      }
    ],
    "addListener": "[Function addListener]",
    "clearTimeout": "[Function]",
    "clone": "[Function]",
    "currentRetry": "[Function]",
    "emit": "[Function emit]",
    "enableTimeouts": "[Function]",
    "eventNames": "[Function eventNames]",
    "fullTitle": "[Function]",
    "getMaxListeners": "[Function getMaxListeners]",
    "globals": "[Function]",
    "inspect": "[Function]",
    "listenerCount": "[Function listenerCount]",
    "listeners": "[Function listeners]",
    "on": "[Function addListener]",
    "once": "[Function once]",
    "prependListener": "[Function prependListener]",
    "prependOnceListener": "[Function prependOnceListener]",
    "removeAllListeners": "[Function removeAllListeners]",
    "removeListener": "[Function removeListener]",
    "resetTimeout": "[Function]",
    "retries": "[Function]",
    "run": "[Function]",
    "setMaxListeners": "[Function setMaxListeners]",
    "skip": "[Function]",
    "slow": "[Function]",
    "timeout": "[Function]",
    "titlePath": "[Function]"
  },
  "r2": {
    "title": "suite 1",
    "ctx": {},
    "suites": [],
    "tests": [
      {
        "title": "test 1",
        "fn": "[Function fn]",
        "_timeout": 2000,
        "_slow": 75,
        "_enableTimeouts": true,
        "_trace": {},
        "_retries": 1,
        "_currentRetry": 1,
        "pending": false,
        "type": "test",
        "body": "[body]",
        "duration": 1,
        "state": "passed",
        "parent": "{Suite}",
        "id": "r3",
        "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
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
        "speed": "fast",
        "err": "{Object 5}",
        "wallClockDuration": 1,
        "prevAttempts": [
          {
            "title": "test 1",
            "fn": "[Function fn]",
            "_timeout": 2000,
            "_slow": 75,
            "_enableTimeouts": true,
            "_trace": {},
            "_retries": 1,
            "_currentRetry": 0,
            "pending": false,
            "type": "test",
            "body": "[body]",
            "duration": 1,
            "state": "failed",
            "parent": "{Suite}",
            "id": "r3",
            "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
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
            "speed": "fast",
            "err": "{Object 5}",
            "wallClockDuration": 1,
            "addListener": "[Function addListener]",
            "clearTimeout": "[Function]",
            "clone": "[Function]",
            "currentRetry": "[Function]",
            "emit": "[Function emit]",
            "enableTimeouts": "[Function]",
            "eventNames": "[Function eventNames]",
            "fullTitle": "[Function]",
            "getMaxListeners": "[Function getMaxListeners]",
            "globals": "[Function]",
            "inspect": "[Function]",
            "listenerCount": "[Function listenerCount]",
            "listeners": "[Function listeners]",
            "on": "[Function addListener]",
            "once": "[Function once]",
            "prependListener": "[Function prependListener]",
            "prependOnceListener": "[Function prependOnceListener]",
            "removeAllListeners": "[Function removeAllListeners]",
            "removeListener": "[Function removeListener]",
            "resetTimeout": "[Function]",
            "retries": "[Function]",
            "run": "[Function]",
            "setMaxListeners": "[Function setMaxListeners]",
            "skip": "[Function]",
            "slow": "[Function]",
            "timeout": "[Function]",
            "titlePath": "[Function]"
          }
        ],
        "addListener": "[Function addListener]",
        "clearTimeout": "[Function]",
        "clone": "[Function]",
        "currentRetry": "[Function]",
        "emit": "[Function emit]",
        "enableTimeouts": "[Function]",
        "eventNames": "[Function eventNames]",
        "fullTitle": "[Function]",
        "getMaxListeners": "[Function getMaxListeners]",
        "globals": "[Function]",
        "inspect": "[Function]",
        "listenerCount": "[Function listenerCount]",
        "listeners": "[Function listeners]",
        "on": "[Function addListener]",
        "once": "[Function once]",
        "prependListener": "[Function prependListener]",
        "prependOnceListener": "[Function prependOnceListener]",
        "removeAllListeners": "[Function removeAllListeners]",
        "removeListener": "[Function removeListener]",
        "resetTimeout": "[Function]",
        "retries": "[Function]",
        "run": "[Function]",
        "setMaxListeners": "[Function setMaxListeners]",
        "skip": "[Function]",
        "slow": "[Function]",
        "timeout": "[Function]",
        "titlePath": "[Function]"
      }
    ],
    "pending": false,
    "_beforeEach": [],
    "_beforeAll": [],
    "_afterEach": [],
    "_afterAll": [],
    "root": false,
    "_timeout": 2000,
    "_enableTimeouts": true,
    "_slow": 75,
    "_bail": false,
    "_retries": 1,
    "delayed": false,
    "parent": "{Suite}",
    "id": "r2",
    "type": "suite",
    "addListener": "[Function addListener]",
    "addSuite": "[Function]",
    "addTest": "[Function]",
    "afterAll": "[Function]",
    "afterEach": "[Function]",
    "bail": "[Function]",
    "beforeAll": "[Function]",
    "beforeEach": "[Function]",
    "clone": "[Function]",
    "eachTest": "[Function]",
    "emit": "[Function emit]",
    "enableTimeouts": "[Function]",
    "eventNames": "[Function eventNames]",
    "fullTitle": "[Function]",
    "getMaxListeners": "[Function getMaxListeners]",
    "listenerCount": "[Function listenerCount]",
    "listeners": "[Function listeners]",
    "on": "[Function addListener]",
    "once": "[Function once]",
    "prependListener": "[Function prependListener]",
    "prependOnceListener": "[Function prependOnceListener]",
    "removeAllListeners": "[Function removeAllListeners]",
    "removeListener": "[Function removeListener]",
    "retries": "[Function]",
    "run": "[Function run]",
    "setMaxListeners": "[Function setMaxListeners]",
    "slow": "[Function]",
    "timeout": "[Function]",
    "titlePath": "[Function]",
    "total": "[Function]"
  },
  "r1": {
    "title": "",
    "ctx": {},
    "suites": [
      {
        "title": "suite 1",
        "ctx": {},
        "suites": [],
        "tests": [
          {
            "title": "test 1",
            "fn": "[Function fn]",
            "_timeout": 2000,
            "_slow": 75,
            "_enableTimeouts": true,
            "_trace": {},
            "_retries": 1,
            "_currentRetry": 1,
            "pending": false,
            "type": "test",
            "body": "[body]",
            "duration": 1,
            "state": "passed",
            "parent": "{Suite}",
            "id": "r3",
            "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
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
            "speed": "fast",
            "err": "{Object 5}",
            "wallClockDuration": 1,
            "prevAttempts": [
              {
                "title": "test 1",
                "fn": "[Function fn]",
                "_timeout": 2000,
                "_slow": 75,
                "_enableTimeouts": true,
                "_trace": {},
                "_retries": 1,
                "_currentRetry": 0,
                "pending": false,
                "type": "test",
                "body": "[body]",
                "duration": 1,
                "state": "failed",
                "parent": "{Suite}",
                "id": "r3",
                "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
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
                "speed": "fast",
                "err": "{Object 5}",
                "wallClockDuration": 1,
                "addListener": "[Function addListener]",
                "clearTimeout": "[Function]",
                "clone": "[Function]",
                "currentRetry": "[Function]",
                "emit": "[Function emit]",
                "enableTimeouts": "[Function]",
                "eventNames": "[Function eventNames]",
                "fullTitle": "[Function]",
                "getMaxListeners": "[Function getMaxListeners]",
                "globals": "[Function]",
                "inspect": "[Function]",
                "listenerCount": "[Function listenerCount]",
                "listeners": "[Function listeners]",
                "on": "[Function addListener]",
                "once": "[Function once]",
                "prependListener": "[Function prependListener]",
                "prependOnceListener": "[Function prependOnceListener]",
                "removeAllListeners": "[Function removeAllListeners]",
                "removeListener": "[Function removeListener]",
                "resetTimeout": "[Function]",
                "retries": "[Function]",
                "run": "[Function]",
                "setMaxListeners": "[Function setMaxListeners]",
                "skip": "[Function]",
                "slow": "[Function]",
                "timeout": "[Function]",
                "titlePath": "[Function]"
              }
            ],
            "addListener": "[Function addListener]",
            "clearTimeout": "[Function]",
            "clone": "[Function]",
            "currentRetry": "[Function]",
            "emit": "[Function emit]",
            "enableTimeouts": "[Function]",
            "eventNames": "[Function eventNames]",
            "fullTitle": "[Function]",
            "getMaxListeners": "[Function getMaxListeners]",
            "globals": "[Function]",
            "inspect": "[Function]",
            "listenerCount": "[Function listenerCount]",
            "listeners": "[Function listeners]",
            "on": "[Function addListener]",
            "once": "[Function once]",
            "prependListener": "[Function prependListener]",
            "prependOnceListener": "[Function prependOnceListener]",
            "removeAllListeners": "[Function removeAllListeners]",
            "removeListener": "[Function removeListener]",
            "resetTimeout": "[Function]",
            "retries": "[Function]",
            "run": "[Function]",
            "setMaxListeners": "[Function setMaxListeners]",
            "skip": "[Function]",
            "slow": "[Function]",
            "timeout": "[Function]",
            "titlePath": "[Function]"
          }
        ],
        "pending": false,
        "_beforeEach": [],
        "_beforeAll": [],
        "_afterEach": [],
        "_afterAll": [],
        "root": false,
        "_timeout": 2000,
        "_enableTimeouts": true,
        "_slow": 75,
        "_bail": false,
        "_retries": 1,
        "delayed": false,
        "parent": "{Suite}",
        "id": "r2",
        "type": "suite",
        "addListener": "[Function addListener]",
        "addSuite": "[Function]",
        "addTest": "[Function]",
        "afterAll": "[Function]",
        "afterEach": "[Function]",
        "bail": "[Function]",
        "beforeAll": "[Function]",
        "beforeEach": "[Function]",
        "clone": "[Function]",
        "eachTest": "[Function]",
        "emit": "[Function emit]",
        "enableTimeouts": "[Function]",
        "eventNames": "[Function eventNames]",
        "fullTitle": "[Function]",
        "getMaxListeners": "[Function getMaxListeners]",
        "listenerCount": "[Function listenerCount]",
        "listeners": "[Function listeners]",
        "on": "[Function addListener]",
        "once": "[Function once]",
        "prependListener": "[Function prependListener]",
        "prependOnceListener": "[Function prependOnceListener]",
        "removeAllListeners": "[Function removeAllListeners]",
        "removeListener": "[Function removeListener]",
        "retries": "[Function]",
        "run": "[Function run]",
        "setMaxListeners": "[Function setMaxListeners]",
        "slow": "[Function]",
        "timeout": "[Function]",
        "titlePath": "[Function]",
        "total": "[Function]"
      }
    ],
    "tests": [],
    "pending": false,
    "_beforeEach": [],
    "_beforeAll": [],
    "_afterEach": [],
    "_afterAll": [],
    "root": true,
    "_timeout": 2000,
    "_enableTimeouts": true,
    "_slow": 75,
    "_bail": false,
    "_retries": 1,
    "delayed": false,
    "id": "r1",
    "type": "suite",
    "addListener": "[Function addListener]",
    "addSuite": "[Function]",
    "addTest": "[Function]",
    "afterAll": "[Function]",
    "afterEach": "[Function]",
    "bail": "[Function]",
    "beforeAll": "[Function]",
    "beforeEach": "[Function]",
    "clone": "[Function]",
    "eachTest": "[Function]",
    "emit": "[Function emit]",
    "enableTimeouts": "[Function]",
    "eventNames": "[Function eventNames]",
    "fullTitle": "[Function]",
    "getMaxListeners": "[Function getMaxListeners]",
    "listenerCount": "[Function listenerCount]",
    "listeners": "[Function listeners]",
    "on": "[Function addListener]",
    "once": "[Function once]",
    "prependListener": "[Function prependListener]",
    "prependOnceListener": "[Function prependOnceListener]",
    "removeAllListeners": "[Function removeAllListeners]",
    "removeListener": "[Function removeListener]",
    "retries": "[Function]",
    "run": "[Function run]",
    "setMaxListeners": "[Function setMaxListeners]",
    "slow": "[Function]",
    "timeout": "[Function]",
    "titlePath": "[Function]",
    "total": "[Function]"
  },
  "h1": {
    "hookId": "h1",
    "type": "hook",
    "title": "\"before all\" hook",
    "body": "[body]",
    "hookName": "before all"
  },
  "h2": {
    "hookId": "h2",
    "type": "hook",
    "title": "\"before each\" hook",
    "body": "[body]",
    "hookName": "before each"
  },
  "h3": {
    "hookId": "h3",
    "type": "hook",
    "title": "\"before each\" hook",
    "body": "[body]",
    "hookName": "before each"
  },
  "h4": {
    "hookId": "h4",
    "type": "hook",
    "title": "\"after each\" hook",
    "body": "[body]",
    "hookName": "after each"
  },
  "h5": {
    "hookId": "h5",
    "type": "hook",
    "title": "\"after each\" hook",
    "body": "[body]",
    "hookName": "after each"
  },
  "h6": {
    "hookId": "h6",
    "type": "hook",
    "title": "\"after all\" hook",
    "body": "[body]",
    "hookName": "after all"
  }
}

exports['reporter retries retry [afterEach] #3'] = {
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
    "passes": 2,
    "pending": 0,
    "failures": 0,
    "start": "2019-04-08T02:16:39.818Z",
    "end": "2019-04-08T02:16:39.825Z",
    "duration": 7
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
      "attemptIndex": 1,
      "prevAttempts": [
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
          "failedFromHookId": null,
          "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
          "wallClockDuration": 1,
          "videoTimestamp": null,
          "attemptIndex": 0
        }
      ]
    }
  ]
}

exports['reporter retries retry [afterEach] #4'] = {
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
    "passes": 2,
    "pending": 0,
    "failures": 0,
    "start": "2019-04-08T02:52:32.401Z",
    "end": "2019-04-08T02:52:32.410Z",
    "duration": 9
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
      "attemptIndex": 1,
      "prevAttempts": [
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
          "failedFromHookId": null,
          "wallClockStartedAt": "1970-01-01T00:00:00.000Z",
          "wallClockDuration": 1,
          "videoTimestamp": null,
          "attemptIndex": 0
        }
      ]
    }
  ]
}

exports['some title'] = [
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
    "hook",
    "{Object 53}"
  ],
  [
    "hook end",
    "{Object 54}"
  ],
  [
    "hook",
    "{Object 53}"
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
    "{Object 55}"
  ],
  [
    "test:before:run",
    "{Test}"
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
    "hook",
    "{Object 56}"
  ],
  [
    "hook end",
    "{Object 56}"
  ],
  [
    "suite end",
    "{Suite}"
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
    "end",
    null
  ]
]
