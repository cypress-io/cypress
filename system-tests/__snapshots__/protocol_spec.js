exports['protocol events'] = `
{
  "beforeSpec": [
    {
      "name": "/path/to/name",
      "open": true,
      "inTransaction": false,
      "readonly": false,
      "memory": false
    }
  ],
  "afterSpec": [
    true
  ],
  "beforeTest": [
    {
      "_testConfig": {
        "testConfigList": [
          {
            "overrideLevel": "suite",
            "overrides": {
              "baseUrl": "http://foobar.com:2121"
            },
            "invocationDetails": {
              "function": "./cypress/e2e/protocol.cy.js",
              "fileUrl": "http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js",
              "originalFile": "webpack:///./cypress/e2e/protocol.cy.js",
              "relativeFile": "cypress/e2e/protocol.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 1,
              "column": 0,
              "whitespace": "    ",
              "stack": "Error\\n    at ./cypress/e2e/protocol.cy.js (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:99:1)\\n    at __webpack_require__ (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:20:30)\\n    at 0 (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:131:18)\\n    at __webpack_require__ (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:20:30)\\n    at eval (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:84:18)\\n    at eval (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:87:10)\\n    at eval (<anonymous>)"
            }
          }
        ],
        "unverifiedTestConfig": {
          "baseUrl": "http://foobar.com:2121"
        },
        "applied": "complete"
      },
      "id": "r3",
      "order": 1,
      "title": "has protocol events",
      "pending": false,
      "body": "() => {\\n    // change the viewport so we get viewport:changed event\\n    cy.viewport(300, 200);\\n\\n    // click an element so we get command logs with snapshots\\n    cy.contains('hi').click();\\n    cy.origin('http://foobar.com', () => {\\n      // verify changing the viewport inside cy.origin works\\n      cy.viewport(400, 500);\\n      cy.wait(1000, {\\n        log: false\\n      });\\n    });\\n  }",
      "type": "test",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js",
        "originalFile": "webpack:///./cypress/e2e/protocol.cy.js",
        "relativeFile": "cypress/e2e/protocol.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 7,
        "column": 2,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:106:3)\\n    at ./cypress/e2e/protocol.cy.js (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:99:1)\\n    at __webpack_require__ (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:20:30)\\n    at 0 (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:131:18)\\n    at __webpack_require__ (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:20:30)\\n    at eval (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:84:18)\\n    at eval (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:87:10)\\n    at eval (<anonymous>)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000,
      "config": {
        "testIsolation": true
      }
    }
  ],
  "afterTest": [
    {
      "_testConfig": {
        "testConfigList": [
          {
            "overrideLevel": "suite",
            "overrides": {
              "baseUrl": "http://foobar.com:2121"
            },
            "invocationDetails": {
              "function": "./cypress/e2e/protocol.cy.js",
              "fileUrl": "http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js",
              "originalFile": "webpack:///./cypress/e2e/protocol.cy.js",
              "relativeFile": "cypress/e2e/protocol.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 1,
              "column": 0,
              "whitespace": "    ",
              "stack": "Error\\n    at ./cypress/e2e/protocol.cy.js (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:99:1)\\n    at __webpack_require__ (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:20:30)\\n    at 0 (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:131:18)\\n    at __webpack_require__ (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:20:30)\\n    at eval (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:84:18)\\n    at eval (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:87:10)\\n    at eval (<anonymous>)"
            }
          }
        ],
        "unverifiedTestConfig": {
          "baseUrl": "http://foobar.com:2121"
        },
        "applied": "complete"
      },
      "id": "r3",
      "order": 1,
      "title": "has protocol events",
      "state": "passed",
      "pending": false,
      "body": "() => {\\n    // change the viewport so we get viewport:changed event\\n    cy.viewport(300, 200);\\n\\n    // click an element so we get command logs with snapshots\\n    cy.contains('hi').click();\\n    cy.origin('http://foobar.com', () => {\\n      // verify changing the viewport inside cy.origin works\\n      cy.viewport(400, 500);\\n      cy.wait(1000, {\\n        log: false\\n      });\\n    });\\n  }",
      "type": "test",
      "duration": 100,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "wallClockDuration": 100,
      "timings": {
        "lifecycle": 100,
        "before each": [
          {
            "hookId": "h1",
            "fnDuration": 100,
            "afterFnDuration": 100
          }
        ],
        "test": {
          "fnDuration": 100,
          "afterFnDuration": 100
        }
      },
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js",
        "originalFile": "webpack:///./cypress/e2e/protocol.cy.js",
        "relativeFile": "cypress/e2e/protocol.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 7,
        "column": 2,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:106:3)\\n    at ./cypress/e2e/protocol.cy.js (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:99:1)\\n    at __webpack_require__ (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:20:30)\\n    at 0 (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:131:18)\\n    at __webpack_require__ (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:20:30)\\n    at eval (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:84:18)\\n    at eval (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:87:10)\\n    at eval (<anonymous>)"
      },
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    }
  ],
  "addRunnables": [
    {
      "id": "r1",
      "title": "",
      "root": true,
      "pending": false,
      "type": "suite",
      "file": "cypress/e2e/protocol.cy.js",
      "retries": -1,
      "_slow": 10000,
      "hooks": [],
      "tests": [],
      "suites": [
        {
          "_testConfig": {
            "baseUrl": "http://foobar.com:2121"
          },
          "id": "r2",
          "title": "protocol events",
          "root": false,
          "pending": false,
          "type": "suite",
          "file": null,
          "invocationDetails": {
            "function": "./cypress/e2e/protocol.cy.js",
            "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js",
            "originalFile": "webpack:///./cypress/e2e/protocol.cy.js",
            "relativeFile": "cypress/e2e/protocol.cy.js",
            "absoluteFile": "/path/to/absoluteFile",
            "line": 1,
            "column": 0,
            "whitespace": "    ",
            "stack": "Error\\n    at ./cypress/e2e/protocol.cy.js (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:99:1)\\n    at __webpack_require__ (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:20:30)\\n    at 0 (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:131:18)\\n    at __webpack_require__ (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:20:30)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:84:18)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:87:10)\\n    at eval (<anonymous>)"
          },
          "retries": -1,
          "_slow": 10000,
          "hooks": [
            {
              "title": "\\"before each\\" hook",
              "hookName": "before each",
              "hookId": "h1",
              "pending": false,
              "body": "() => {\\n    // cause the top-origin to change by visiting a different domain\\n    cy.visit('http://localhost:3131/index.html');\\n  }",
              "type": "hook",
              "file": null,
              "invocationDetails": {
                "function": "Suite.eval",
                "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js",
                "originalFile": "webpack:///./cypress/e2e/protocol.cy.js",
                "relativeFile": "cypress/e2e/protocol.cy.js",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 2,
                "column": 2,
                "whitespace": "    ",
                "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:102:3)\\n    at ./cypress/e2e/protocol.cy.js (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:99:1)\\n    at __webpack_require__ (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:20:30)\\n    at 0 (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:131:18)\\n    at __webpack_require__ (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:20:30)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:84:18)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:87:10)\\n    at eval (<anonymous>)"
              },
              "currentRetry": 0,
              "retries": -1,
              "_slow": 10000
            }
          ],
          "tests": [
            {
              "id": "r3",
              "title": "has protocol events",
              "pending": false,
              "body": "() => {\\n    // change the viewport so we get viewport:changed event\\n    cy.viewport(300, 200);\\n\\n    // click an element so we get command logs with snapshots\\n    cy.contains('hi').click();\\n    cy.origin('http://foobar.com', () => {\\n      // verify changing the viewport inside cy.origin works\\n      cy.viewport(400, 500);\\n      cy.wait(1000, {\\n        log: false\\n      });\\n    });\\n  }",
              "type": "test",
              "file": null,
              "invocationDetails": {
                "function": "Suite.eval",
                "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js",
                "originalFile": "webpack:///./cypress/e2e/protocol.cy.js",
                "relativeFile": "cypress/e2e/protocol.cy.js",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 7,
                "column": 2,
                "whitespace": "    ",
                "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:106:3)\\n    at ./cypress/e2e/protocol.cy.js (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:99:1)\\n    at __webpack_require__ (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:20:30)\\n    at 0 (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:131:18)\\n    at __webpack_require__ (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:20:30)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:84:18)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:87:10)\\n    at eval (<anonymous>)"
              },
              "currentRetry": 0,
              "retries": -1,
              "_slow": 10000,
              "hooks": [
                {
                  "title": "\\"before each\\" hook",
                  "hookName": "before each",
                  "hookId": "h1",
                  "pending": false,
                  "body": "() => {\\n    // cause the top-origin to change by visiting a different domain\\n    cy.visit('http://localhost:3131/index.html');\\n  }",
                  "type": "hook",
                  "file": null,
                  "invocationDetails": {
                    "function": "Suite.eval",
                    "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js",
                    "originalFile": "webpack:///./cypress/e2e/protocol.cy.js",
                    "relativeFile": "cypress/e2e/protocol.cy.js",
                    "absoluteFile": "/path/to/absoluteFile",
                    "line": 2,
                    "column": 2,
                    "whitespace": "    ",
                    "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:102:3)\\n    at ./cypress/e2e/protocol.cy.js (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:99:1)\\n    at __webpack_require__ (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:20:30)\\n    at 0 (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:131:18)\\n    at __webpack_require__ (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:20:30)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:84:18)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:87:10)\\n    at eval (<anonymous>)"
                  },
                  "currentRetry": 0,
                  "retries": -1,
                  "_slow": 10000
                },
                {
                  "hookId": "r3",
                  "hookName": "test body",
                  "invocationDetails": {
                    "function": "Suite.eval",
                    "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js",
                    "originalFile": "webpack:///./cypress/e2e/protocol.cy.js",
                    "relativeFile": "cypress/e2e/protocol.cy.js",
                    "absoluteFile": "/path/to/absoluteFile",
                    "line": 7,
                    "column": 2,
                    "whitespace": "    ",
                    "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:106:3)\\n    at ./cypress/e2e/protocol.cy.js (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:99:1)\\n    at __webpack_require__ (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:20:30)\\n    at 0 (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:131:18)\\n    at __webpack_require__ (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:20:30)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:84:18)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:87:10)\\n    at eval (<anonymous>)"
                  }
                },
                {
                  "hookId": "r3-studio",
                  "hookName": "studio commands",
                  "isStudio": true
                }
              ],
              "_testConfig": {
                "testConfigList": [
                  {
                    "overrideLevel": "suite",
                    "overrides": {
                      "baseUrl": "http://foobar.com:2121"
                    },
                    "invocationDetails": {
                      "function": "./cypress/e2e/protocol.cy.js",
                      "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js",
                      "originalFile": "webpack:///./cypress/e2e/protocol.cy.js",
                      "relativeFile": "cypress/e2e/protocol.cy.js",
                      "absoluteFile": "/path/to/absoluteFile",
                      "line": 1,
                      "column": 0,
                      "whitespace": "    ",
                      "stack": "Error\\n    at ./cypress/e2e/protocol.cy.js (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:99:1)\\n    at __webpack_require__ (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:20:30)\\n    at 0 (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:131:18)\\n    at __webpack_require__ (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:20:30)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:84:18)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:87:10)\\n    at eval (<anonymous>)"
                    }
                  }
                ],
                "unverifiedTestConfig": {
                  "baseUrl": "http://foobar.com:2121"
                }
              },
              "_titlePath": [
                "protocol events",
                "has protocol events"
              ]
            }
          ],
          "suites": []
        }
      ],
      "runtimeConfig": {},
      "totalUnfilteredTests": 0
    }
  ],
  "connectToBrowser": [
    true
  ],
  "commandLogAdded": [
    {
      "id": "log-http://localhost:3131-1",
      "event": false,
      "hookId": "h1",
      "instrument": "command",
      "message": "http://localhost:3131/index.html",
      "name": "visit",
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 60000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100
    },
    {
      "id": "log-http://localhost:3131-2",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "300, 200",
      "name": "viewport",
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:3131/index.html",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100
    },
    {
      "id": "log-http://localhost:3131-3",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "hi",
      "name": "contains",
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 4000,
      "type": "child",
      "url": "http://localhost:3131/index.html",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100
    },
    {
      "id": "log-http://localhost:3131-4",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "",
      "name": "click",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 4000,
      "type": "child",
      "url": "http://localhost:3131/index.html",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:3131-5",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "http://foobar.com",
      "name": "origin",
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:3131/index.html",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100
    },
    {
      "id": "log-http://foobar.com-6",
      "event": false,
      "groupLevel": 1,
      "hookId": "r3",
      "instrument": "command",
      "group": "log-http://localhost:3131-5",
      "message": "400, 500",
      "name": "viewport",
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100
    }
  ],
  "commandLogChanged": [
    {
      "id": "log-http://localhost:3131-1",
      "event": false,
      "hookId": "h1",
      "instrument": "command",
      "message": "http://localhost:3131/index.html",
      "name": "visit",
      "renderProps": {},
      "state": "passed",
      "testId": "r3",
      "timeout": 60000,
      "type": "parent",
      "url": "http://localhost:3131/index.html",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": 100
        }
      ],
      "timestamp": 100
    },
    {
      "id": "log-http://localhost:3131-2",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "300, 200",
      "name": "viewport",
      "renderProps": {},
      "state": "passed",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:3131/index.html",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": 100
        }
      ],
      "timestamp": 100
    },
    {
      "id": "log-http://localhost:3131-3",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "hi",
      "name": "contains",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r3",
      "timeout": 4000,
      "type": "child",
      "url": "http://localhost:3131/index.html",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "h1"
            }
          ]
        }
      ],
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:3131-4",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "",
      "name": "click",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r3",
      "timeout": 4000,
      "type": "child",
      "url": "http://localhost:3131/index.html",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "name": "before",
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "h1"
            }
          ]
        },
        {
          "name": "after",
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "h1"
            }
          ]
        }
      ],
      "timestamp": 100,
      "coords": {
        "top": 22,
        "left": 8,
        "topCenter": 39,
        "leftCenter": 150,
        "x": 150,
        "y": 40
      },
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://foobar.com-6",
      "event": false,
      "groupLevel": 1,
      "hookId": "r3",
      "instrument": "command",
      "group": "log-http://localhost:3131-5",
      "message": "400, 500",
      "name": "viewport",
      "renderProps": {},
      "state": "passed",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [],
      "timestamp": 100
    },
    {
      "id": "log-http://localhost:3131-5",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "http://foobar.com",
      "name": "origin",
      "renderProps": {},
      "state": "passed",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:3131/index.html",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": 100
        }
      ],
      "timestamp": 100
    }
  ],
  "viewportChanged": [
    {
      "viewport": {
        "width": 300,
        "height": 200
      },
      "timestamp": 100
    },
    {
      "viewport": {
        "width": 400,
        "height": 500
      },
      "timestamp": 100
    }
  ],
  "urlChanged": [
    {
      "url": "http://localhost:3131/index.html",
      "timestamp": 100
    },
    {
      "url": "",
      "timestamp": 100
    }
  ],
  "pageLoading": [
    {
      "loading": true,
      "timestamp": 100
    },
    {
      "loading": false,
      "timestamp": 100
    },
    {
      "loading": true,
      "timestamp": 100
    },
    {
      "loading": false,
      "timestamp": 100
    }
  ],
  "resetTest": [
    "r3"
  ]
}
`
