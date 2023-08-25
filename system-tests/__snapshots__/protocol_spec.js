exports['e2e events'] = `
{
  "beforeSpec": [
    {
      "name": "/path/to/name",
      "open": true,
      "inTransaction": false,
      "readonly": false,
      "memory": false
    },
    {
      "name": "/path/to/name",
      "open": true,
      "inTransaction": false,
      "readonly": false,
      "memory": false
    }
  ],
  "afterSpec": [
    true,
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
              "function": "eval",
              "fileUrl": "http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/protocol.cy.js",
              "relativeFile": "cypress/e2e/protocol.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 1,
              "column": 0,
              "whitespace": "    ",
              "stack": "Error\\n    at eval (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:9:1)\\n    at eval (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:33:12)\\n    at eval (<anonymous>)"
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
      "body": "() => {\\n    // change the viewport so we get viewport:changed event\\n    cy.viewport(300, 200);\\n\\n    // click an element so we get command logs with snapshots\\n    cy.contains('hi').click();\\n    cy.origin('http://foobar.com', () => {\\n      // verify changing the viewport inside cy.origin works\\n      cy.viewport(400, 500);\\n\\n      // eslint-disable-next-line cypress/no-unnecessary-waiting\\n      cy.wait(1000, {\\n        log: false\\n      });\\n    });\\n  }",
      "type": "test",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js",
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/protocol.cy.js",
        "relativeFile": "cypress/e2e/protocol.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 7,
        "column": 2,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:16:3)\\n    at eval (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:9:1)\\n    at eval (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:33:12)\\n    at eval (<anonymous>)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    },
    {
      "_testConfig": {
        "testConfigList": [
          {
            "overrideLevel": "suite",
            "overrides": {
              "baseUrl": null
            },
            "invocationDetails": {
              "function": "eval",
              "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
              "relativeFile": "cypress/e2e/test-isolation.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 3,
              "column": 0,
              "whitespace": "    ",
              "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
            }
          },
          {
            "overrideLevel": "suite",
            "overrides": {
              "testIsolation": false
            },
            "invocationDetails": {
              "function": "Suite.eval",
              "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
              "relativeFile": "cypress/e2e/test-isolation.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 4,
              "column": 2,
              "whitespace": "    ",
              "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
            }
          }
        ],
        "unverifiedTestConfig": {
          "baseUrl": null,
          "testIsolation": false
        },
        "applied": "complete"
      },
      "id": "r4",
      "order": 1,
      "title": "test 1",
      "pending": false,
      "body": "() => {\\n      cy.visit('cypress/fixtures/dom-with-browser-interactions.html');\\n      cy.wait(1000, {\\n        log: false\\n      });\\n      cy.get('#text-target').type('abc').should('have.value', 'abc');\\n    }",
      "type": "test",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
        "relativeFile": "cypress/e2e/test-isolation.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 5,
        "column": 4,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:17:5)\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    },
    {
      "_testConfig": {
        "testConfigList": [
          {
            "overrideLevel": "suite",
            "overrides": {
              "baseUrl": null
            },
            "invocationDetails": {
              "function": "eval",
              "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
              "relativeFile": "cypress/e2e/test-isolation.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 3,
              "column": 0,
              "whitespace": "    ",
              "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
            }
          },
          {
            "overrideLevel": "suite",
            "overrides": {
              "testIsolation": false
            },
            "invocationDetails": {
              "function": "Suite.eval",
              "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
              "relativeFile": "cypress/e2e/test-isolation.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 4,
              "column": 2,
              "whitespace": "    ",
              "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
            }
          }
        ],
        "unverifiedTestConfig": {
          "baseUrl": null,
          "testIsolation": false
        },
        "applied": "complete"
      },
      "id": "r5",
      "order": 2,
      "title": "test 2",
      "pending": false,
      "body": "() => {\\n      cy.get('#text-target').type('def').should('have.value', 'abcdef');\\n    }",
      "type": "test",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
        "relativeFile": "cypress/e2e/test-isolation.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 11,
        "column": 4,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:24:5)\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    },
    {
      "_testConfig": {
        "testConfigList": [
          {
            "overrideLevel": "suite",
            "overrides": {
              "baseUrl": null
            },
            "invocationDetails": {
              "function": "eval",
              "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
              "relativeFile": "cypress/e2e/test-isolation.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 3,
              "column": 0,
              "whitespace": "    ",
              "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
            }
          },
          {
            "overrideLevel": "suite",
            "overrides": {
              "testIsolation": false
            },
            "invocationDetails": {
              "function": "Suite.eval",
              "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
              "relativeFile": "cypress/e2e/test-isolation.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 4,
              "column": 2,
              "whitespace": "    ",
              "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
            }
          }
        ],
        "unverifiedTestConfig": {
          "baseUrl": null,
          "testIsolation": false
        },
        "applied": "complete"
      },
      "id": "r6",
      "order": 3,
      "title": "test 3",
      "pending": false,
      "body": "() => {\\n      cy.get('#text-target').type('ghi').should('have.value', 'abcdefghi');\\n    }",
      "type": "test",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
        "relativeFile": "cypress/e2e/test-isolation.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 15,
        "column": 4,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:27:5)\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    },
    {
      "_testConfig": {
        "testConfigList": [
          {
            "overrideLevel": "suite",
            "overrides": {
              "baseUrl": null
            },
            "invocationDetails": {
              "function": "eval",
              "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
              "relativeFile": "cypress/e2e/test-isolation.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 3,
              "column": 0,
              "whitespace": "    ",
              "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
            }
          },
          {
            "overrideLevel": "suite",
            "overrides": {
              "testIsolation": false
            },
            "invocationDetails": {
              "function": "Suite.eval",
              "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
              "relativeFile": "cypress/e2e/test-isolation.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 4,
              "column": 2,
              "whitespace": "    ",
              "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
            }
          }
        ],
        "unverifiedTestConfig": {
          "baseUrl": null,
          "testIsolation": false
        },
        "applied": "complete"
      },
      "id": "r7",
      "order": 4,
      "title": "test 4",
      "pending": false,
      "body": "() => {\\n      cy.get('#text-target').type('!').should('have.value', 'abcdefghi!');\\n      cy.visit('cypress/fixtures/dom-with-browser-interactions.html');\\n      cy.wait(1000, {\\n        log: false\\n      });\\n      cy.get('#text-target').type('abc').should('have.value', 'abc');\\n    }",
      "type": "test",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
        "relativeFile": "cypress/e2e/test-isolation.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 19,
        "column": 4,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:30:5)\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    },
    {
      "_testConfig": {
        "testConfigList": [
          {
            "overrideLevel": "suite",
            "overrides": {
              "baseUrl": null
            },
            "invocationDetails": {
              "function": "eval",
              "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
              "relativeFile": "cypress/e2e/test-isolation.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 3,
              "column": 0,
              "whitespace": "    ",
              "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
            }
          },
          {
            "overrideLevel": "suite",
            "overrides": {
              "testIsolation": false
            },
            "invocationDetails": {
              "function": "Suite.eval",
              "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
              "relativeFile": "cypress/e2e/test-isolation.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 4,
              "column": 2,
              "whitespace": "    ",
              "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
            }
          }
        ],
        "unverifiedTestConfig": {
          "baseUrl": null,
          "testIsolation": false
        },
        "applied": "complete"
      },
      "id": "r8",
      "order": 5,
      "title": "test 5",
      "pending": false,
      "body": "() => {\\n      cy.get('#text-target').type('!').should('have.value', 'abc!');\\n    }",
      "type": "test",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
        "relativeFile": "cypress/e2e/test-isolation.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 27,
        "column": 4,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:38:5)\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    },
    {
      "_testConfig": {
        "testConfigList": [
          {
            "overrideLevel": "suite",
            "overrides": {
              "baseUrl": null
            },
            "invocationDetails": {
              "function": "eval",
              "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
              "relativeFile": "cypress/e2e/test-isolation.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 3,
              "column": 0,
              "whitespace": "    ",
              "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
            }
          },
          {
            "overrideLevel": "suite",
            "overrides": {
              "testIsolation": true
            },
            "invocationDetails": {
              "function": "Suite.eval",
              "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
              "relativeFile": "cypress/e2e/test-isolation.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 32,
              "column": 2,
              "whitespace": "    ",
              "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:42:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
            }
          }
        ],
        "unverifiedTestConfig": {
          "baseUrl": null,
          "testIsolation": true
        },
        "applied": "complete"
      },
      "id": "r10",
      "order": 6,
      "title": "test 6",
      "pending": false,
      "body": "() => {\\n      cy.visit('cypress/fixtures/dom-with-browser-interactions.html');\\n      cy.wait(1000, {\\n        log: false\\n      });\\n      cy.get('#text-target').type('abc').should('have.value', 'abc');\\n    }",
      "type": "test",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
        "relativeFile": "cypress/e2e/test-isolation.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 33,
        "column": 4,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:45:5)\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:42:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    },
    {
      "_testConfig": {
        "testConfigList": [
          {
            "overrideLevel": "suite",
            "overrides": {
              "baseUrl": null
            },
            "invocationDetails": {
              "function": "eval",
              "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
              "relativeFile": "cypress/e2e/test-isolation.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 3,
              "column": 0,
              "whitespace": "    ",
              "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
            }
          },
          {
            "overrideLevel": "suite",
            "overrides": {
              "testIsolation": true
            },
            "invocationDetails": {
              "function": "Suite.eval",
              "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
              "relativeFile": "cypress/e2e/test-isolation.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 32,
              "column": 2,
              "whitespace": "    ",
              "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:42:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
            }
          }
        ],
        "unverifiedTestConfig": {
          "baseUrl": null,
          "testIsolation": true
        },
        "applied": "complete"
      },
      "id": "r11",
      "order": 7,
      "title": "test 7",
      "pending": false,
      "body": "() => {\\n      cy.visit('cypress/fixtures/dom-with-browser-interactions.html');\\n      cy.wait(1000, {\\n        log: false\\n      });\\n      cy.get('#text-target').type('def').should('have.value', 'def');\\n    }",
      "type": "test",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
        "relativeFile": "cypress/e2e/test-isolation.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 39,
        "column": 4,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:52:5)\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:42:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    },
    {
      "_testConfig": {
        "testConfigList": [
          {
            "overrideLevel": "suite",
            "overrides": {
              "baseUrl": null
            },
            "invocationDetails": {
              "function": "eval",
              "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
              "relativeFile": "cypress/e2e/test-isolation.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 3,
              "column": 0,
              "whitespace": "    ",
              "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
            }
          },
          {
            "overrideLevel": "suite",
            "overrides": {
              "testIsolation": false
            },
            "invocationDetails": {
              "function": "Suite.eval",
              "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
              "relativeFile": "cypress/e2e/test-isolation.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 46,
              "column": 2,
              "whitespace": "    ",
              "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:60:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
            }
          }
        ],
        "unverifiedTestConfig": {
          "baseUrl": null,
          "testIsolation": false
        },
        "applied": "complete"
      },
      "id": "r13",
      "order": 8,
      "title": "test 8",
      "pending": false,
      "body": "() => {\\n      cy.get('#text-target').type('abc').should('have.value', 'defabc');\\n    }",
      "type": "test",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
        "relativeFile": "cypress/e2e/test-isolation.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 47,
        "column": 4,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:63:5)\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:60:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    }
  ],
  "preAfterTest": [
    {
      "test": {
        "_testConfig": {
          "testConfigList": [
            {
              "overrideLevel": "suite",
              "overrides": {
                "baseUrl": "http://foobar.com:2121"
              },
              "invocationDetails": {
                "function": "eval",
                "fileUrl": "http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js",
                "originalFile": "webpack://protocol-sample-project/./cypress/e2e/protocol.cy.js",
                "relativeFile": "cypress/e2e/protocol.cy.js",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 1,
                "column": 0,
                "whitespace": "    ",
                "stack": "Error\\n    at eval (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:9:1)\\n    at eval (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:33:12)\\n    at eval (<anonymous>)"
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
        "body": "() => {\\n    // change the viewport so we get viewport:changed event\\n    cy.viewport(300, 200);\\n\\n    // click an element so we get command logs with snapshots\\n    cy.contains('hi').click();\\n    cy.origin('http://foobar.com', () => {\\n      // verify changing the viewport inside cy.origin works\\n      cy.viewport(400, 500);\\n\\n      // eslint-disable-next-line cypress/no-unnecessary-waiting\\n      cy.wait(1000, {\\n        log: false\\n      });\\n    });\\n  }",
        "type": "test",
        "duration": 100,
        "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
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
          "originalFile": "webpack://protocol-sample-project/./cypress/e2e/protocol.cy.js",
          "relativeFile": "cypress/e2e/protocol.cy.js",
          "absoluteFile": "/path/to/absoluteFile",
          "line": 7,
          "column": 2,
          "whitespace": "    ",
          "stack": "Error\\n    at Suite.eval (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:16:3)\\n    at eval (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:9:1)\\n    at eval (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:33:12)\\n    at eval (<anonymous>)"
        },
        "final": true,
        "currentRetry": 0,
        "retries": 0,
        "_slow": 10000
      },
      "options": {
        "nextTestHasTestIsolationOn": true
      }
    },
    {
      "test": {
        "_testConfig": {
          "testConfigList": [
            {
              "overrideLevel": "suite",
              "overrides": {
                "baseUrl": null
              },
              "invocationDetails": {
                "function": "eval",
                "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                "relativeFile": "cypress/e2e/test-isolation.cy.js",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 3,
                "column": 0,
                "whitespace": "    ",
                "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
              }
            },
            {
              "overrideLevel": "suite",
              "overrides": {
                "testIsolation": false
              },
              "invocationDetails": {
                "function": "Suite.eval",
                "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                "relativeFile": "cypress/e2e/test-isolation.cy.js",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 4,
                "column": 2,
                "whitespace": "    ",
                "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
              }
            }
          ],
          "unverifiedTestConfig": {
            "baseUrl": null,
            "testIsolation": false
          },
          "applied": "complete"
        },
        "id": "r4",
        "order": 1,
        "title": "test 1",
        "state": "passed",
        "pending": false,
        "body": "() => {\\n      cy.visit('cypress/fixtures/dom-with-browser-interactions.html');\\n      cy.wait(1000, {\\n        log: false\\n      });\\n      cy.get('#text-target').type('abc').should('have.value', 'abc');\\n    }",
        "type": "test",
        "duration": 100,
        "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
        "timings": {
          "lifecycle": 100,
          "test": {
            "fnDuration": 100,
            "afterFnDuration": 100
          }
        },
        "file": null,
        "invocationDetails": {
          "function": "Suite.eval",
          "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
          "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
          "relativeFile": "cypress/e2e/test-isolation.cy.js",
          "absoluteFile": "/path/to/absoluteFile",
          "line": 5,
          "column": 4,
          "whitespace": "    ",
          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:17:5)\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
        },
        "final": true,
        "currentRetry": 0,
        "retries": 0,
        "_slow": 10000
      },
      "options": {
        "nextTestHasTestIsolationOn": false
      }
    },
    {
      "test": {
        "_testConfig": {
          "testConfigList": [
            {
              "overrideLevel": "suite",
              "overrides": {
                "baseUrl": null
              },
              "invocationDetails": {
                "function": "eval",
                "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                "relativeFile": "cypress/e2e/test-isolation.cy.js",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 3,
                "column": 0,
                "whitespace": "    ",
                "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
              }
            },
            {
              "overrideLevel": "suite",
              "overrides": {
                "testIsolation": false
              },
              "invocationDetails": {
                "function": "Suite.eval",
                "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                "relativeFile": "cypress/e2e/test-isolation.cy.js",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 4,
                "column": 2,
                "whitespace": "    ",
                "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
              }
            }
          ],
          "unverifiedTestConfig": {
            "baseUrl": null,
            "testIsolation": false
          },
          "applied": "complete"
        },
        "id": "r5",
        "order": 2,
        "title": "test 2",
        "state": "passed",
        "pending": false,
        "body": "() => {\\n      cy.get('#text-target').type('def').should('have.value', 'abcdef');\\n    }",
        "type": "test",
        "duration": 100,
        "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
        "timings": {
          "lifecycle": 100,
          "test": {
            "fnDuration": 100,
            "afterFnDuration": 100
          }
        },
        "file": null,
        "invocationDetails": {
          "function": "Suite.eval",
          "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
          "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
          "relativeFile": "cypress/e2e/test-isolation.cy.js",
          "absoluteFile": "/path/to/absoluteFile",
          "line": 11,
          "column": 4,
          "whitespace": "    ",
          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:24:5)\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
        },
        "final": true,
        "currentRetry": 0,
        "retries": 0,
        "_slow": 10000
      },
      "options": {
        "nextTestHasTestIsolationOn": false
      }
    },
    {
      "test": {
        "_testConfig": {
          "testConfigList": [
            {
              "overrideLevel": "suite",
              "overrides": {
                "baseUrl": null
              },
              "invocationDetails": {
                "function": "eval",
                "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                "relativeFile": "cypress/e2e/test-isolation.cy.js",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 3,
                "column": 0,
                "whitespace": "    ",
                "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
              }
            },
            {
              "overrideLevel": "suite",
              "overrides": {
                "testIsolation": false
              },
              "invocationDetails": {
                "function": "Suite.eval",
                "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                "relativeFile": "cypress/e2e/test-isolation.cy.js",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 4,
                "column": 2,
                "whitespace": "    ",
                "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
              }
            }
          ],
          "unverifiedTestConfig": {
            "baseUrl": null,
            "testIsolation": false
          },
          "applied": "complete"
        },
        "id": "r6",
        "order": 3,
        "title": "test 3",
        "state": "passed",
        "pending": false,
        "body": "() => {\\n      cy.get('#text-target').type('ghi').should('have.value', 'abcdefghi');\\n    }",
        "type": "test",
        "duration": 100,
        "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
        "timings": {
          "lifecycle": 100,
          "test": {
            "fnDuration": 100,
            "afterFnDuration": 100
          }
        },
        "file": null,
        "invocationDetails": {
          "function": "Suite.eval",
          "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
          "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
          "relativeFile": "cypress/e2e/test-isolation.cy.js",
          "absoluteFile": "/path/to/absoluteFile",
          "line": 15,
          "column": 4,
          "whitespace": "    ",
          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:27:5)\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
        },
        "final": true,
        "currentRetry": 0,
        "retries": 0,
        "_slow": 10000
      },
      "options": {
        "nextTestHasTestIsolationOn": false
      }
    },
    {
      "test": {
        "_testConfig": {
          "testConfigList": [
            {
              "overrideLevel": "suite",
              "overrides": {
                "baseUrl": null
              },
              "invocationDetails": {
                "function": "eval",
                "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                "relativeFile": "cypress/e2e/test-isolation.cy.js",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 3,
                "column": 0,
                "whitespace": "    ",
                "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
              }
            },
            {
              "overrideLevel": "suite",
              "overrides": {
                "testIsolation": false
              },
              "invocationDetails": {
                "function": "Suite.eval",
                "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                "relativeFile": "cypress/e2e/test-isolation.cy.js",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 4,
                "column": 2,
                "whitespace": "    ",
                "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
              }
            }
          ],
          "unverifiedTestConfig": {
            "baseUrl": null,
            "testIsolation": false
          },
          "applied": "complete"
        },
        "id": "r7",
        "order": 4,
        "title": "test 4",
        "state": "passed",
        "pending": false,
        "body": "() => {\\n      cy.get('#text-target').type('!').should('have.value', 'abcdefghi!');\\n      cy.visit('cypress/fixtures/dom-with-browser-interactions.html');\\n      cy.wait(1000, {\\n        log: false\\n      });\\n      cy.get('#text-target').type('abc').should('have.value', 'abc');\\n    }",
        "type": "test",
        "duration": 100,
        "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
        "timings": {
          "lifecycle": 100,
          "test": {
            "fnDuration": 100,
            "afterFnDuration": 100
          }
        },
        "file": null,
        "invocationDetails": {
          "function": "Suite.eval",
          "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
          "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
          "relativeFile": "cypress/e2e/test-isolation.cy.js",
          "absoluteFile": "/path/to/absoluteFile",
          "line": 19,
          "column": 4,
          "whitespace": "    ",
          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:30:5)\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
        },
        "final": true,
        "currentRetry": 0,
        "retries": 0,
        "_slow": 10000
      },
      "options": {
        "nextTestHasTestIsolationOn": false
      }
    },
    {
      "test": {
        "_testConfig": {
          "testConfigList": [
            {
              "overrideLevel": "suite",
              "overrides": {
                "baseUrl": null
              },
              "invocationDetails": {
                "function": "eval",
                "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                "relativeFile": "cypress/e2e/test-isolation.cy.js",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 3,
                "column": 0,
                "whitespace": "    ",
                "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
              }
            },
            {
              "overrideLevel": "suite",
              "overrides": {
                "testIsolation": false
              },
              "invocationDetails": {
                "function": "Suite.eval",
                "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                "relativeFile": "cypress/e2e/test-isolation.cy.js",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 4,
                "column": 2,
                "whitespace": "    ",
                "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
              }
            }
          ],
          "unverifiedTestConfig": {
            "baseUrl": null,
            "testIsolation": false
          },
          "applied": "complete"
        },
        "id": "r8",
        "order": 5,
        "title": "test 5",
        "state": "passed",
        "pending": false,
        "body": "() => {\\n      cy.get('#text-target').type('!').should('have.value', 'abc!');\\n    }",
        "type": "test",
        "duration": 100,
        "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
        "timings": {
          "lifecycle": 100,
          "test": {
            "fnDuration": 100,
            "afterFnDuration": 100
          }
        },
        "file": null,
        "invocationDetails": {
          "function": "Suite.eval",
          "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
          "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
          "relativeFile": "cypress/e2e/test-isolation.cy.js",
          "absoluteFile": "/path/to/absoluteFile",
          "line": 27,
          "column": 4,
          "whitespace": "    ",
          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:38:5)\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
        },
        "final": true,
        "currentRetry": 0,
        "retries": 0,
        "_slow": 10000
      },
      "options": {
        "nextTestHasTestIsolationOn": true
      }
    },
    {
      "test": {
        "_testConfig": {
          "testConfigList": [
            {
              "overrideLevel": "suite",
              "overrides": {
                "baseUrl": null
              },
              "invocationDetails": {
                "function": "eval",
                "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                "relativeFile": "cypress/e2e/test-isolation.cy.js",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 3,
                "column": 0,
                "whitespace": "    ",
                "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
              }
            },
            {
              "overrideLevel": "suite",
              "overrides": {
                "testIsolation": true
              },
              "invocationDetails": {
                "function": "Suite.eval",
                "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                "relativeFile": "cypress/e2e/test-isolation.cy.js",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 32,
                "column": 2,
                "whitespace": "    ",
                "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:42:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
              }
            }
          ],
          "unverifiedTestConfig": {
            "baseUrl": null,
            "testIsolation": true
          },
          "applied": "complete"
        },
        "id": "r10",
        "order": 6,
        "title": "test 6",
        "state": "passed",
        "pending": false,
        "body": "() => {\\n      cy.visit('cypress/fixtures/dom-with-browser-interactions.html');\\n      cy.wait(1000, {\\n        log: false\\n      });\\n      cy.get('#text-target').type('abc').should('have.value', 'abc');\\n    }",
        "type": "test",
        "duration": 100,
        "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
        "timings": {
          "lifecycle": 100,
          "test": {
            "fnDuration": 100,
            "afterFnDuration": 100
          }
        },
        "file": null,
        "invocationDetails": {
          "function": "Suite.eval",
          "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
          "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
          "relativeFile": "cypress/e2e/test-isolation.cy.js",
          "absoluteFile": "/path/to/absoluteFile",
          "line": 33,
          "column": 4,
          "whitespace": "    ",
          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:45:5)\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:42:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
        },
        "final": true,
        "currentRetry": 0,
        "retries": 0,
        "_slow": 10000
      },
      "options": {
        "nextTestHasTestIsolationOn": true
      }
    },
    {
      "test": {
        "_testConfig": {
          "testConfigList": [
            {
              "overrideLevel": "suite",
              "overrides": {
                "baseUrl": null
              },
              "invocationDetails": {
                "function": "eval",
                "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                "relativeFile": "cypress/e2e/test-isolation.cy.js",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 3,
                "column": 0,
                "whitespace": "    ",
                "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
              }
            },
            {
              "overrideLevel": "suite",
              "overrides": {
                "testIsolation": true
              },
              "invocationDetails": {
                "function": "Suite.eval",
                "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                "relativeFile": "cypress/e2e/test-isolation.cy.js",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 32,
                "column": 2,
                "whitespace": "    ",
                "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:42:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
              }
            }
          ],
          "unverifiedTestConfig": {
            "baseUrl": null,
            "testIsolation": true
          },
          "applied": "complete"
        },
        "id": "r11",
        "order": 7,
        "title": "test 7",
        "state": "passed",
        "pending": false,
        "body": "() => {\\n      cy.visit('cypress/fixtures/dom-with-browser-interactions.html');\\n      cy.wait(1000, {\\n        log: false\\n      });\\n      cy.get('#text-target').type('def').should('have.value', 'def');\\n    }",
        "type": "test",
        "duration": 100,
        "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
        "timings": {
          "lifecycle": 100,
          "test": {
            "fnDuration": 100,
            "afterFnDuration": 100
          }
        },
        "file": null,
        "invocationDetails": {
          "function": "Suite.eval",
          "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
          "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
          "relativeFile": "cypress/e2e/test-isolation.cy.js",
          "absoluteFile": "/path/to/absoluteFile",
          "line": 39,
          "column": 4,
          "whitespace": "    ",
          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:52:5)\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:42:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
        },
        "final": true,
        "currentRetry": 0,
        "retries": 0,
        "_slow": 10000
      },
      "options": {
        "nextTestHasTestIsolationOn": false
      }
    },
    {
      "test": {
        "_testConfig": {
          "testConfigList": [
            {
              "overrideLevel": "suite",
              "overrides": {
                "baseUrl": null
              },
              "invocationDetails": {
                "function": "eval",
                "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                "relativeFile": "cypress/e2e/test-isolation.cy.js",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 3,
                "column": 0,
                "whitespace": "    ",
                "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
              }
            },
            {
              "overrideLevel": "suite",
              "overrides": {
                "testIsolation": false
              },
              "invocationDetails": {
                "function": "Suite.eval",
                "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                "relativeFile": "cypress/e2e/test-isolation.cy.js",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 46,
                "column": 2,
                "whitespace": "    ",
                "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:60:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
              }
            }
          ],
          "unverifiedTestConfig": {
            "baseUrl": null,
            "testIsolation": false
          },
          "applied": "complete"
        },
        "id": "r13",
        "order": 8,
        "title": "test 8",
        "state": "passed",
        "pending": false,
        "body": "() => {\\n      cy.get('#text-target').type('abc').should('have.value', 'defabc');\\n    }",
        "type": "test",
        "duration": 100,
        "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
        "timings": {
          "lifecycle": 100,
          "test": {
            "fnDuration": 100,
            "afterFnDuration": 100
          }
        },
        "file": null,
        "invocationDetails": {
          "function": "Suite.eval",
          "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
          "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
          "relativeFile": "cypress/e2e/test-isolation.cy.js",
          "absoluteFile": "/path/to/absoluteFile",
          "line": 47,
          "column": 4,
          "whitespace": "    ",
          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:63:5)\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:60:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
        },
        "final": true,
        "currentRetry": 0,
        "retries": 0,
        "_slow": 10000
      },
      "options": {
        "nextTestHasTestIsolationOn": true
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
              "function": "eval",
              "fileUrl": "http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/protocol.cy.js",
              "relativeFile": "cypress/e2e/protocol.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 1,
              "column": 0,
              "whitespace": "    ",
              "stack": "Error\\n    at eval (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:9:1)\\n    at eval (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:33:12)\\n    at eval (<anonymous>)"
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
      "body": "() => {\\n    // change the viewport so we get viewport:changed event\\n    cy.viewport(300, 200);\\n\\n    // click an element so we get command logs with snapshots\\n    cy.contains('hi').click();\\n    cy.origin('http://foobar.com', () => {\\n      // verify changing the viewport inside cy.origin works\\n      cy.viewport(400, 500);\\n\\n      // eslint-disable-next-line cypress/no-unnecessary-waiting\\n      cy.wait(1000, {\\n        log: false\\n      });\\n    });\\n  }",
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
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/protocol.cy.js",
        "relativeFile": "cypress/e2e/protocol.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 7,
        "column": 2,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:16:3)\\n    at eval (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:9:1)\\n    at eval (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:33:12)\\n    at eval (<anonymous>)"
      },
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    },
    {
      "_testConfig": {
        "testConfigList": [
          {
            "overrideLevel": "suite",
            "overrides": {
              "baseUrl": null
            },
            "invocationDetails": {
              "function": "eval",
              "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
              "relativeFile": "cypress/e2e/test-isolation.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 3,
              "column": 0,
              "whitespace": "    ",
              "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
            }
          },
          {
            "overrideLevel": "suite",
            "overrides": {
              "testIsolation": false
            },
            "invocationDetails": {
              "function": "Suite.eval",
              "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
              "relativeFile": "cypress/e2e/test-isolation.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 4,
              "column": 2,
              "whitespace": "    ",
              "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
            }
          }
        ],
        "unverifiedTestConfig": {
          "baseUrl": null,
          "testIsolation": false
        },
        "applied": "complete"
      },
      "id": "r4",
      "order": 1,
      "title": "test 1",
      "state": "passed",
      "pending": false,
      "body": "() => {\\n      cy.visit('cypress/fixtures/dom-with-browser-interactions.html');\\n      cy.wait(1000, {\\n        log: false\\n      });\\n      cy.get('#text-target').type('abc').should('have.value', 'abc');\\n    }",
      "type": "test",
      "duration": 100,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "wallClockDuration": 100,
      "timings": {
        "lifecycle": 100,
        "test": {
          "fnDuration": 100,
          "afterFnDuration": 100
        }
      },
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
        "relativeFile": "cypress/e2e/test-isolation.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 5,
        "column": 4,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:17:5)\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
      },
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    },
    {
      "_testConfig": {
        "testConfigList": [
          {
            "overrideLevel": "suite",
            "overrides": {
              "baseUrl": null
            },
            "invocationDetails": {
              "function": "eval",
              "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
              "relativeFile": "cypress/e2e/test-isolation.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 3,
              "column": 0,
              "whitespace": "    ",
              "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
            }
          },
          {
            "overrideLevel": "suite",
            "overrides": {
              "testIsolation": false
            },
            "invocationDetails": {
              "function": "Suite.eval",
              "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
              "relativeFile": "cypress/e2e/test-isolation.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 4,
              "column": 2,
              "whitespace": "    ",
              "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
            }
          }
        ],
        "unverifiedTestConfig": {
          "baseUrl": null,
          "testIsolation": false
        },
        "applied": "complete"
      },
      "id": "r5",
      "order": 2,
      "title": "test 2",
      "state": "passed",
      "pending": false,
      "body": "() => {\\n      cy.get('#text-target').type('def').should('have.value', 'abcdef');\\n    }",
      "type": "test",
      "duration": 100,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "wallClockDuration": 100,
      "timings": {
        "lifecycle": 100,
        "test": {
          "fnDuration": 100,
          "afterFnDuration": 100
        }
      },
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
        "relativeFile": "cypress/e2e/test-isolation.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 11,
        "column": 4,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:24:5)\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
      },
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    },
    {
      "_testConfig": {
        "testConfigList": [
          {
            "overrideLevel": "suite",
            "overrides": {
              "baseUrl": null
            },
            "invocationDetails": {
              "function": "eval",
              "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
              "relativeFile": "cypress/e2e/test-isolation.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 3,
              "column": 0,
              "whitespace": "    ",
              "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
            }
          },
          {
            "overrideLevel": "suite",
            "overrides": {
              "testIsolation": false
            },
            "invocationDetails": {
              "function": "Suite.eval",
              "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
              "relativeFile": "cypress/e2e/test-isolation.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 4,
              "column": 2,
              "whitespace": "    ",
              "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
            }
          }
        ],
        "unverifiedTestConfig": {
          "baseUrl": null,
          "testIsolation": false
        },
        "applied": "complete"
      },
      "id": "r6",
      "order": 3,
      "title": "test 3",
      "state": "passed",
      "pending": false,
      "body": "() => {\\n      cy.get('#text-target').type('ghi').should('have.value', 'abcdefghi');\\n    }",
      "type": "test",
      "duration": 100,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "wallClockDuration": 100,
      "timings": {
        "lifecycle": 100,
        "test": {
          "fnDuration": 100,
          "afterFnDuration": 100
        }
      },
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
        "relativeFile": "cypress/e2e/test-isolation.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 15,
        "column": 4,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:27:5)\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
      },
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    },
    {
      "_testConfig": {
        "testConfigList": [
          {
            "overrideLevel": "suite",
            "overrides": {
              "baseUrl": null
            },
            "invocationDetails": {
              "function": "eval",
              "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
              "relativeFile": "cypress/e2e/test-isolation.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 3,
              "column": 0,
              "whitespace": "    ",
              "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
            }
          },
          {
            "overrideLevel": "suite",
            "overrides": {
              "testIsolation": false
            },
            "invocationDetails": {
              "function": "Suite.eval",
              "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
              "relativeFile": "cypress/e2e/test-isolation.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 4,
              "column": 2,
              "whitespace": "    ",
              "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
            }
          }
        ],
        "unverifiedTestConfig": {
          "baseUrl": null,
          "testIsolation": false
        },
        "applied": "complete"
      },
      "id": "r7",
      "order": 4,
      "title": "test 4",
      "state": "passed",
      "pending": false,
      "body": "() => {\\n      cy.get('#text-target').type('!').should('have.value', 'abcdefghi!');\\n      cy.visit('cypress/fixtures/dom-with-browser-interactions.html');\\n      cy.wait(1000, {\\n        log: false\\n      });\\n      cy.get('#text-target').type('abc').should('have.value', 'abc');\\n    }",
      "type": "test",
      "duration": 100,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "wallClockDuration": 100,
      "timings": {
        "lifecycle": 100,
        "test": {
          "fnDuration": 100,
          "afterFnDuration": 100
        }
      },
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
        "relativeFile": "cypress/e2e/test-isolation.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 19,
        "column": 4,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:30:5)\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
      },
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    },
    {
      "_testConfig": {
        "testConfigList": [
          {
            "overrideLevel": "suite",
            "overrides": {
              "baseUrl": null
            },
            "invocationDetails": {
              "function": "eval",
              "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
              "relativeFile": "cypress/e2e/test-isolation.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 3,
              "column": 0,
              "whitespace": "    ",
              "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
            }
          },
          {
            "overrideLevel": "suite",
            "overrides": {
              "testIsolation": false
            },
            "invocationDetails": {
              "function": "Suite.eval",
              "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
              "relativeFile": "cypress/e2e/test-isolation.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 4,
              "column": 2,
              "whitespace": "    ",
              "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
            }
          }
        ],
        "unverifiedTestConfig": {
          "baseUrl": null,
          "testIsolation": false
        },
        "applied": "complete"
      },
      "id": "r8",
      "order": 5,
      "title": "test 5",
      "state": "passed",
      "pending": false,
      "body": "() => {\\n      cy.get('#text-target').type('!').should('have.value', 'abc!');\\n    }",
      "type": "test",
      "duration": 100,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "wallClockDuration": 100,
      "timings": {
        "lifecycle": 100,
        "test": {
          "fnDuration": 100,
          "afterFnDuration": 100
        }
      },
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
        "relativeFile": "cypress/e2e/test-isolation.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 27,
        "column": 4,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:38:5)\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
      },
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    },
    {
      "_testConfig": {
        "testConfigList": [
          {
            "overrideLevel": "suite",
            "overrides": {
              "baseUrl": null
            },
            "invocationDetails": {
              "function": "eval",
              "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
              "relativeFile": "cypress/e2e/test-isolation.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 3,
              "column": 0,
              "whitespace": "    ",
              "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
            }
          },
          {
            "overrideLevel": "suite",
            "overrides": {
              "testIsolation": true
            },
            "invocationDetails": {
              "function": "Suite.eval",
              "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
              "relativeFile": "cypress/e2e/test-isolation.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 32,
              "column": 2,
              "whitespace": "    ",
              "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:42:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
            }
          }
        ],
        "unverifiedTestConfig": {
          "baseUrl": null,
          "testIsolation": true
        },
        "applied": "complete"
      },
      "id": "r10",
      "order": 6,
      "title": "test 6",
      "state": "passed",
      "pending": false,
      "body": "() => {\\n      cy.visit('cypress/fixtures/dom-with-browser-interactions.html');\\n      cy.wait(1000, {\\n        log: false\\n      });\\n      cy.get('#text-target').type('abc').should('have.value', 'abc');\\n    }",
      "type": "test",
      "duration": 100,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "wallClockDuration": 100,
      "timings": {
        "lifecycle": 100,
        "test": {
          "fnDuration": 100,
          "afterFnDuration": 100
        }
      },
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
        "relativeFile": "cypress/e2e/test-isolation.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 33,
        "column": 4,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:45:5)\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:42:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
      },
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    },
    {
      "_testConfig": {
        "testConfigList": [
          {
            "overrideLevel": "suite",
            "overrides": {
              "baseUrl": null
            },
            "invocationDetails": {
              "function": "eval",
              "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
              "relativeFile": "cypress/e2e/test-isolation.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 3,
              "column": 0,
              "whitespace": "    ",
              "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
            }
          },
          {
            "overrideLevel": "suite",
            "overrides": {
              "testIsolation": true
            },
            "invocationDetails": {
              "function": "Suite.eval",
              "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
              "relativeFile": "cypress/e2e/test-isolation.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 32,
              "column": 2,
              "whitespace": "    ",
              "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:42:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
            }
          }
        ],
        "unverifiedTestConfig": {
          "baseUrl": null,
          "testIsolation": true
        },
        "applied": "complete"
      },
      "id": "r11",
      "order": 7,
      "title": "test 7",
      "state": "passed",
      "pending": false,
      "body": "() => {\\n      cy.visit('cypress/fixtures/dom-with-browser-interactions.html');\\n      cy.wait(1000, {\\n        log: false\\n      });\\n      cy.get('#text-target').type('def').should('have.value', 'def');\\n    }",
      "type": "test",
      "duration": 100,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "wallClockDuration": 100,
      "timings": {
        "lifecycle": 100,
        "test": {
          "fnDuration": 100,
          "afterFnDuration": 100
        }
      },
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
        "relativeFile": "cypress/e2e/test-isolation.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 39,
        "column": 4,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:52:5)\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:42:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
      },
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    },
    {
      "_testConfig": {
        "testConfigList": [
          {
            "overrideLevel": "suite",
            "overrides": {
              "baseUrl": null
            },
            "invocationDetails": {
              "function": "eval",
              "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
              "relativeFile": "cypress/e2e/test-isolation.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 3,
              "column": 0,
              "whitespace": "    ",
              "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
            }
          },
          {
            "overrideLevel": "suite",
            "overrides": {
              "testIsolation": false
            },
            "invocationDetails": {
              "function": "Suite.eval",
              "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
              "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
              "relativeFile": "cypress/e2e/test-isolation.cy.js",
              "absoluteFile": "/path/to/absoluteFile",
              "line": 46,
              "column": 2,
              "whitespace": "    ",
              "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:60:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
            }
          }
        ],
        "unverifiedTestConfig": {
          "baseUrl": null,
          "testIsolation": false
        },
        "applied": "complete"
      },
      "id": "r13",
      "order": 8,
      "title": "test 8",
      "state": "passed",
      "pending": false,
      "body": "() => {\\n      cy.get('#text-target').type('abc').should('have.value', 'defabc');\\n    }",
      "type": "test",
      "duration": 100,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "wallClockDuration": 100,
      "timings": {
        "lifecycle": 100,
        "test": {
          "fnDuration": 100,
          "afterFnDuration": 100
        }
      },
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
        "relativeFile": "cypress/e2e/test-isolation.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 47,
        "column": 4,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:63:5)\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:60:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
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
            "function": "eval",
            "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js",
            "originalFile": "webpack://protocol-sample-project/./cypress/e2e/protocol.cy.js",
            "relativeFile": "cypress/e2e/protocol.cy.js",
            "absoluteFile": "/path/to/absoluteFile",
            "line": 1,
            "column": 0,
            "whitespace": "    ",
            "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:9:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:33:12)\\n    at eval (<anonymous>)"
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
                "originalFile": "webpack://protocol-sample-project/./cypress/e2e/protocol.cy.js",
                "relativeFile": "cypress/e2e/protocol.cy.js",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 2,
                "column": 2,
                "whitespace": "    ",
                "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:12:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:9:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:33:12)\\n    at eval (<anonymous>)"
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
              "body": "() => {\\n    // change the viewport so we get viewport:changed event\\n    cy.viewport(300, 200);\\n\\n    // click an element so we get command logs with snapshots\\n    cy.contains('hi').click();\\n    cy.origin('http://foobar.com', () => {\\n      // verify changing the viewport inside cy.origin works\\n      cy.viewport(400, 500);\\n\\n      // eslint-disable-next-line cypress/no-unnecessary-waiting\\n      cy.wait(1000, {\\n        log: false\\n      });\\n    });\\n  }",
              "type": "test",
              "file": null,
              "invocationDetails": {
                "function": "Suite.eval",
                "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js",
                "originalFile": "webpack://protocol-sample-project/./cypress/e2e/protocol.cy.js",
                "relativeFile": "cypress/e2e/protocol.cy.js",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 7,
                "column": 2,
                "whitespace": "    ",
                "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:16:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:9:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:33:12)\\n    at eval (<anonymous>)"
              },
              "currentRetry": 0,
              "retries": -1,
              "_slow": 10000,
              "hooks": [],
              "_testConfig": {
                "testConfigList": [
                  {
                    "overrideLevel": "suite",
                    "overrides": {
                      "baseUrl": "http://foobar.com:2121"
                    },
                    "invocationDetails": {
                      "function": "eval",
                      "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js",
                      "originalFile": "webpack://protocol-sample-project/./cypress/e2e/protocol.cy.js",
                      "relativeFile": "cypress/e2e/protocol.cy.js",
                      "absoluteFile": "/path/to/absoluteFile",
                      "line": 1,
                      "column": 0,
                      "whitespace": "    ",
                      "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:9:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:33:12)\\n    at eval (<anonymous>)"
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
    },
    {
      "id": "r1",
      "title": "",
      "root": true,
      "pending": false,
      "type": "suite",
      "file": "cypress/e2e/test-isolation.cy.js",
      "retries": -1,
      "_slow": 10000,
      "hooks": [],
      "tests": [],
      "suites": [
        {
          "_testConfig": {
            "baseUrl": null
          },
          "id": "r2",
          "title": "test isolation",
          "root": false,
          "pending": false,
          "type": "suite",
          "file": null,
          "invocationDetails": {
            "function": "eval",
            "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
            "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
            "relativeFile": "cypress/e2e/test-isolation.cy.js",
            "absoluteFile": "/path/to/absoluteFile",
            "line": 3,
            "column": 0,
            "whitespace": "    ",
            "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
          },
          "retries": -1,
          "_slow": 10000,
          "hooks": [],
          "tests": [],
          "suites": [
            {
              "_testConfig": {
                "testIsolation": false
              },
              "id": "r3",
              "title": "test isolation false",
              "root": false,
              "pending": false,
              "type": "suite",
              "file": null,
              "invocationDetails": {
                "function": "Suite.eval",
                "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                "relativeFile": "cypress/e2e/test-isolation.cy.js",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 4,
                "column": 2,
                "whitespace": "    ",
                "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
              },
              "retries": -1,
              "_slow": 10000,
              "hooks": [],
              "tests": [
                {
                  "id": "r4",
                  "title": "test 1",
                  "pending": false,
                  "body": "() => {\\n      cy.visit('cypress/fixtures/dom-with-browser-interactions.html');\\n      cy.wait(1000, {\\n        log: false\\n      });\\n      cy.get('#text-target').type('abc').should('have.value', 'abc');\\n    }",
                  "type": "test",
                  "file": null,
                  "invocationDetails": {
                    "function": "Suite.eval",
                    "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                    "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                    "relativeFile": "cypress/e2e/test-isolation.cy.js",
                    "absoluteFile": "/path/to/absoluteFile",
                    "line": 5,
                    "column": 4,
                    "whitespace": "    ",
                    "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:17:5)\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
                  },
                  "currentRetry": 0,
                  "retries": -1,
                  "_slow": 10000,
                  "hooks": [],
                  "_testConfig": {
                    "testConfigList": [
                      {
                        "overrideLevel": "suite",
                        "overrides": {
                          "baseUrl": null
                        },
                        "invocationDetails": {
                          "function": "eval",
                          "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                          "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                          "relativeFile": "cypress/e2e/test-isolation.cy.js",
                          "absoluteFile": "/path/to/absoluteFile",
                          "line": 3,
                          "column": 0,
                          "whitespace": "    ",
                          "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
                        }
                      },
                      {
                        "overrideLevel": "suite",
                        "overrides": {
                          "testIsolation": false
                        },
                        "invocationDetails": {
                          "function": "Suite.eval",
                          "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                          "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                          "relativeFile": "cypress/e2e/test-isolation.cy.js",
                          "absoluteFile": "/path/to/absoluteFile",
                          "line": 4,
                          "column": 2,
                          "whitespace": "    ",
                          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
                        }
                      }
                    ],
                    "unverifiedTestConfig": {
                      "baseUrl": null,
                      "testIsolation": false
                    }
                  },
                  "_titlePath": [
                    "test isolation",
                    "test isolation false",
                    "test 1"
                  ]
                },
                {
                  "id": "r5",
                  "title": "test 2",
                  "pending": false,
                  "body": "() => {\\n      cy.get('#text-target').type('def').should('have.value', 'abcdef');\\n    }",
                  "type": "test",
                  "file": null,
                  "invocationDetails": {
                    "function": "Suite.eval",
                    "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                    "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                    "relativeFile": "cypress/e2e/test-isolation.cy.js",
                    "absoluteFile": "/path/to/absoluteFile",
                    "line": 11,
                    "column": 4,
                    "whitespace": "    ",
                    "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:24:5)\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
                  },
                  "currentRetry": 0,
                  "retries": -1,
                  "_slow": 10000,
                  "hooks": [],
                  "_testConfig": {
                    "testConfigList": [
                      {
                        "overrideLevel": "suite",
                        "overrides": {
                          "baseUrl": null
                        },
                        "invocationDetails": {
                          "function": "eval",
                          "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                          "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                          "relativeFile": "cypress/e2e/test-isolation.cy.js",
                          "absoluteFile": "/path/to/absoluteFile",
                          "line": 3,
                          "column": 0,
                          "whitespace": "    ",
                          "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
                        }
                      },
                      {
                        "overrideLevel": "suite",
                        "overrides": {
                          "testIsolation": false
                        },
                        "invocationDetails": {
                          "function": "Suite.eval",
                          "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                          "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                          "relativeFile": "cypress/e2e/test-isolation.cy.js",
                          "absoluteFile": "/path/to/absoluteFile",
                          "line": 4,
                          "column": 2,
                          "whitespace": "    ",
                          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
                        }
                      }
                    ],
                    "unverifiedTestConfig": {
                      "baseUrl": null,
                      "testIsolation": false
                    }
                  },
                  "_titlePath": [
                    "test isolation",
                    "test isolation false",
                    "test 2"
                  ]
                },
                {
                  "id": "r6",
                  "title": "test 3",
                  "pending": false,
                  "body": "() => {\\n      cy.get('#text-target').type('ghi').should('have.value', 'abcdefghi');\\n    }",
                  "type": "test",
                  "file": null,
                  "invocationDetails": {
                    "function": "Suite.eval",
                    "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                    "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                    "relativeFile": "cypress/e2e/test-isolation.cy.js",
                    "absoluteFile": "/path/to/absoluteFile",
                    "line": 15,
                    "column": 4,
                    "whitespace": "    ",
                    "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:27:5)\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
                  },
                  "currentRetry": 0,
                  "retries": -1,
                  "_slow": 10000,
                  "hooks": [],
                  "_testConfig": {
                    "testConfigList": [
                      {
                        "overrideLevel": "suite",
                        "overrides": {
                          "baseUrl": null
                        },
                        "invocationDetails": {
                          "function": "eval",
                          "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                          "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                          "relativeFile": "cypress/e2e/test-isolation.cy.js",
                          "absoluteFile": "/path/to/absoluteFile",
                          "line": 3,
                          "column": 0,
                          "whitespace": "    ",
                          "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
                        }
                      },
                      {
                        "overrideLevel": "suite",
                        "overrides": {
                          "testIsolation": false
                        },
                        "invocationDetails": {
                          "function": "Suite.eval",
                          "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                          "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                          "relativeFile": "cypress/e2e/test-isolation.cy.js",
                          "absoluteFile": "/path/to/absoluteFile",
                          "line": 4,
                          "column": 2,
                          "whitespace": "    ",
                          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
                        }
                      }
                    ],
                    "unverifiedTestConfig": {
                      "baseUrl": null,
                      "testIsolation": false
                    }
                  },
                  "_titlePath": [
                    "test isolation",
                    "test isolation false",
                    "test 3"
                  ]
                },
                {
                  "id": "r7",
                  "title": "test 4",
                  "pending": false,
                  "body": "() => {\\n      cy.get('#text-target').type('!').should('have.value', 'abcdefghi!');\\n      cy.visit('cypress/fixtures/dom-with-browser-interactions.html');\\n      cy.wait(1000, {\\n        log: false\\n      });\\n      cy.get('#text-target').type('abc').should('have.value', 'abc');\\n    }",
                  "type": "test",
                  "file": null,
                  "invocationDetails": {
                    "function": "Suite.eval",
                    "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                    "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                    "relativeFile": "cypress/e2e/test-isolation.cy.js",
                    "absoluteFile": "/path/to/absoluteFile",
                    "line": 19,
                    "column": 4,
                    "whitespace": "    ",
                    "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:30:5)\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
                  },
                  "currentRetry": 0,
                  "retries": -1,
                  "_slow": 10000,
                  "hooks": [],
                  "_testConfig": {
                    "testConfigList": [
                      {
                        "overrideLevel": "suite",
                        "overrides": {
                          "baseUrl": null
                        },
                        "invocationDetails": {
                          "function": "eval",
                          "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                          "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                          "relativeFile": "cypress/e2e/test-isolation.cy.js",
                          "absoluteFile": "/path/to/absoluteFile",
                          "line": 3,
                          "column": 0,
                          "whitespace": "    ",
                          "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
                        }
                      },
                      {
                        "overrideLevel": "suite",
                        "overrides": {
                          "testIsolation": false
                        },
                        "invocationDetails": {
                          "function": "Suite.eval",
                          "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                          "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                          "relativeFile": "cypress/e2e/test-isolation.cy.js",
                          "absoluteFile": "/path/to/absoluteFile",
                          "line": 4,
                          "column": 2,
                          "whitespace": "    ",
                          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
                        }
                      }
                    ],
                    "unverifiedTestConfig": {
                      "baseUrl": null,
                      "testIsolation": false
                    }
                  },
                  "_titlePath": [
                    "test isolation",
                    "test isolation false",
                    "test 4"
                  ]
                },
                {
                  "id": "r8",
                  "title": "test 5",
                  "pending": false,
                  "body": "() => {\\n      cy.get('#text-target').type('!').should('have.value', 'abc!');\\n    }",
                  "type": "test",
                  "file": null,
                  "invocationDetails": {
                    "function": "Suite.eval",
                    "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                    "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                    "relativeFile": "cypress/e2e/test-isolation.cy.js",
                    "absoluteFile": "/path/to/absoluteFile",
                    "line": 27,
                    "column": 4,
                    "whitespace": "    ",
                    "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:38:5)\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
                  },
                  "currentRetry": 0,
                  "retries": -1,
                  "_slow": 10000,
                  "hooks": [],
                  "_testConfig": {
                    "testConfigList": [
                      {
                        "overrideLevel": "suite",
                        "overrides": {
                          "baseUrl": null
                        },
                        "invocationDetails": {
                          "function": "eval",
                          "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                          "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                          "relativeFile": "cypress/e2e/test-isolation.cy.js",
                          "absoluteFile": "/path/to/absoluteFile",
                          "line": 3,
                          "column": 0,
                          "whitespace": "    ",
                          "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
                        }
                      },
                      {
                        "overrideLevel": "suite",
                        "overrides": {
                          "testIsolation": false
                        },
                        "invocationDetails": {
                          "function": "Suite.eval",
                          "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                          "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                          "relativeFile": "cypress/e2e/test-isolation.cy.js",
                          "absoluteFile": "/path/to/absoluteFile",
                          "line": 4,
                          "column": 2,
                          "whitespace": "    ",
                          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
                        }
                      }
                    ],
                    "unverifiedTestConfig": {
                      "baseUrl": null,
                      "testIsolation": false
                    }
                  },
                  "_titlePath": [
                    "test isolation",
                    "test isolation false",
                    "test 5"
                  ]
                }
              ],
              "suites": []
            },
            {
              "_testConfig": {
                "testIsolation": true
              },
              "id": "r9",
              "title": "test isolation true",
              "root": false,
              "pending": false,
              "type": "suite",
              "file": null,
              "invocationDetails": {
                "function": "Suite.eval",
                "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                "relativeFile": "cypress/e2e/test-isolation.cy.js",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 32,
                "column": 2,
                "whitespace": "    ",
                "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:42:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
              },
              "retries": -1,
              "_slow": 10000,
              "hooks": [],
              "tests": [
                {
                  "id": "r10",
                  "title": "test 6",
                  "pending": false,
                  "body": "() => {\\n      cy.visit('cypress/fixtures/dom-with-browser-interactions.html');\\n      cy.wait(1000, {\\n        log: false\\n      });\\n      cy.get('#text-target').type('abc').should('have.value', 'abc');\\n    }",
                  "type": "test",
                  "file": null,
                  "invocationDetails": {
                    "function": "Suite.eval",
                    "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                    "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                    "relativeFile": "cypress/e2e/test-isolation.cy.js",
                    "absoluteFile": "/path/to/absoluteFile",
                    "line": 33,
                    "column": 4,
                    "whitespace": "    ",
                    "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:45:5)\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:42:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
                  },
                  "currentRetry": 0,
                  "retries": -1,
                  "_slow": 10000,
                  "hooks": [],
                  "_testConfig": {
                    "testConfigList": [
                      {
                        "overrideLevel": "suite",
                        "overrides": {
                          "baseUrl": null
                        },
                        "invocationDetails": {
                          "function": "eval",
                          "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                          "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                          "relativeFile": "cypress/e2e/test-isolation.cy.js",
                          "absoluteFile": "/path/to/absoluteFile",
                          "line": 3,
                          "column": 0,
                          "whitespace": "    ",
                          "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
                        }
                      },
                      {
                        "overrideLevel": "suite",
                        "overrides": {
                          "testIsolation": true
                        },
                        "invocationDetails": {
                          "function": "Suite.eval",
                          "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                          "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                          "relativeFile": "cypress/e2e/test-isolation.cy.js",
                          "absoluteFile": "/path/to/absoluteFile",
                          "line": 32,
                          "column": 2,
                          "whitespace": "    ",
                          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:42:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
                        }
                      }
                    ],
                    "unverifiedTestConfig": {
                      "baseUrl": null,
                      "testIsolation": true
                    }
                  },
                  "_titlePath": [
                    "test isolation",
                    "test isolation true",
                    "test 6"
                  ]
                },
                {
                  "id": "r11",
                  "title": "test 7",
                  "pending": false,
                  "body": "() => {\\n      cy.visit('cypress/fixtures/dom-with-browser-interactions.html');\\n      cy.wait(1000, {\\n        log: false\\n      });\\n      cy.get('#text-target').type('def').should('have.value', 'def');\\n    }",
                  "type": "test",
                  "file": null,
                  "invocationDetails": {
                    "function": "Suite.eval",
                    "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                    "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                    "relativeFile": "cypress/e2e/test-isolation.cy.js",
                    "absoluteFile": "/path/to/absoluteFile",
                    "line": 39,
                    "column": 4,
                    "whitespace": "    ",
                    "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:52:5)\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:42:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
                  },
                  "currentRetry": 0,
                  "retries": -1,
                  "_slow": 10000,
                  "hooks": [],
                  "_testConfig": {
                    "testConfigList": [
                      {
                        "overrideLevel": "suite",
                        "overrides": {
                          "baseUrl": null
                        },
                        "invocationDetails": {
                          "function": "eval",
                          "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                          "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                          "relativeFile": "cypress/e2e/test-isolation.cy.js",
                          "absoluteFile": "/path/to/absoluteFile",
                          "line": 3,
                          "column": 0,
                          "whitespace": "    ",
                          "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
                        }
                      },
                      {
                        "overrideLevel": "suite",
                        "overrides": {
                          "testIsolation": true
                        },
                        "invocationDetails": {
                          "function": "Suite.eval",
                          "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                          "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                          "relativeFile": "cypress/e2e/test-isolation.cy.js",
                          "absoluteFile": "/path/to/absoluteFile",
                          "line": 32,
                          "column": 2,
                          "whitespace": "    ",
                          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:42:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
                        }
                      }
                    ],
                    "unverifiedTestConfig": {
                      "baseUrl": null,
                      "testIsolation": true
                    }
                  },
                  "_titlePath": [
                    "test isolation",
                    "test isolation true",
                    "test 7"
                  ]
                }
              ],
              "suites": []
            },
            {
              "_testConfig": {
                "testIsolation": false
              },
              "id": "r12",
              "title": "test isolation false",
              "root": false,
              "pending": false,
              "type": "suite",
              "file": null,
              "invocationDetails": {
                "function": "Suite.eval",
                "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                "relativeFile": "cypress/e2e/test-isolation.cy.js",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 46,
                "column": 2,
                "whitespace": "    ",
                "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:60:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
              },
              "retries": -1,
              "_slow": 10000,
              "hooks": [],
              "tests": [
                {
                  "id": "r13",
                  "title": "test 8",
                  "pending": false,
                  "body": "() => {\\n      cy.get('#text-target').type('abc').should('have.value', 'defabc');\\n    }",
                  "type": "test",
                  "file": null,
                  "invocationDetails": {
                    "function": "Suite.eval",
                    "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                    "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                    "relativeFile": "cypress/e2e/test-isolation.cy.js",
                    "absoluteFile": "/path/to/absoluteFile",
                    "line": 47,
                    "column": 4,
                    "whitespace": "    ",
                    "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:63:5)\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:60:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
                  },
                  "currentRetry": 0,
                  "retries": -1,
                  "_slow": 10000,
                  "hooks": [],
                  "_testConfig": {
                    "testConfigList": [
                      {
                        "overrideLevel": "suite",
                        "overrides": {
                          "baseUrl": null
                        },
                        "invocationDetails": {
                          "function": "eval",
                          "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                          "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                          "relativeFile": "cypress/e2e/test-isolation.cy.js",
                          "absoluteFile": "/path/to/absoluteFile",
                          "line": 3,
                          "column": 0,
                          "whitespace": "    ",
                          "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
                        }
                      },
                      {
                        "overrideLevel": "suite",
                        "overrides": {
                          "testIsolation": false
                        },
                        "invocationDetails": {
                          "function": "Suite.eval",
                          "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                          "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                          "relativeFile": "cypress/e2e/test-isolation.cy.js",
                          "absoluteFile": "/path/to/absoluteFile",
                          "line": 46,
                          "column": 2,
                          "whitespace": "    ",
                          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:60:3)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:12)\\n    at eval (<anonymous>)"
                        }
                      }
                    ],
                    "unverifiedTestConfig": {
                      "baseUrl": null,
                      "testIsolation": false
                    }
                  },
                  "_titlePath": [
                    "test isolation",
                    "test isolation false",
                    "test 8"
                  ]
                }
              ],
              "suites": []
            }
          ]
        }
      ],
      "runtimeConfig": {},
      "totalUnfilteredTests": 0
    }
  ],
  "connectToBrowser": [
    true,
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
      "createdAtTimestamp": 100,
      "updatedAtTimestamp": 100
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
      "createdAtTimestamp": 100,
      "updatedAtTimestamp": 100
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
      "createdAtTimestamp": 100,
      "updatedAtTimestamp": 100
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
      "createdAtTimestamp": 100,
      "updatedAtTimestamp": 100,
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
      "createdAtTimestamp": 100,
      "updatedAtTimestamp": 100
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
      "createdAtTimestamp": 100,
      "updatedAtTimestamp": 100
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
      "createdAtTimestamp": 100,
      "updatedAtTimestamp": 100
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
      "createdAtTimestamp": 100,
      "updatedAtTimestamp": 100
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
      "createdAtTimestamp": 100,
      "updatedAtTimestamp": 100,
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
      "createdAtTimestamp": 100,
      "updatedAtTimestamp": 100,
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
      "createdAtTimestamp": 100,
      "updatedAtTimestamp": 100
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
      "createdAtTimestamp": 100,
      "updatedAtTimestamp": 100
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
    },
    {
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "timestamp": 100
    },
    {
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "timestamp": 100
    },
    {
      "url": "",
      "timestamp": 100
    },
    {
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "timestamp": 100
    },
    {
      "url": "",
      "timestamp": 100
    },
    {
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
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
    },
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
    },
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
    },
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

exports['component events - experimentalSingleTabRunMode: true'] = `
{
  "beforeSpec": [
    {
      "name": "/path/to/name",
      "open": true,
      "inTransaction": false,
      "readonly": false,
      "memory": false
    },
    {
      "name": "/path/to/name",
      "open": true,
      "inTransaction": false,
      "readonly": false,
      "memory": false
    }
  ],
  "afterSpec": [
    true,
    true
  ],
  "beforeTest": [
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {},
        "applied": "complete"
      },
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "pending": false,
      "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloEarth_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#earth-text').type('Hello Earth').should('have.value', 'Hello Earth');\\n  }",
      "type": "test",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "file": null,
      "invocationDetails": {
        "function": "Object.getInvocationDetails",
        "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
        "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
        "relativeFile": "../driver/src/cypress/stack_utils.ts",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 94,
        "column": 17,
        "whitespace": "    ",
        "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:333:85)\\n    at context.it.context.specify (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:88:13)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:17:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 250
    },
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {},
        "applied": "complete"
      },
      "id": "r4",
      "order": 2,
      "title": "test 2",
      "pending": false,
      "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloEarth_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#earth-text').type('Where\\\\'s Mars?').should('have.value', 'Where\\\\'s Mars?');\\n  }",
      "type": "test",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "file": null,
      "invocationDetails": {
        "function": "Object.getInvocationDetails",
        "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
        "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
        "relativeFile": "../driver/src/cypress/stack_utils.ts",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 94,
        "column": 17,
        "whitespace": "    ",
        "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:333:85)\\n    at context.it.context.specify (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:88:13)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:21:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 250
    },
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {},
        "applied": "complete"
      },
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "pending": false,
      "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloMars_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#mars-text').type('Hello Mars').should('have.value', 'Hello Mars');\\n  }",
      "type": "test",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "file": null,
      "invocationDetails": {
        "function": "Object.getInvocationDetails",
        "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
        "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
        "relativeFile": "../driver/src/cypress/stack_utils.ts",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 94,
        "column": 17,
        "whitespace": "    ",
        "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:333:85)\\n    at context.it.context.specify (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:88:13)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-1.js:17:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 250
    },
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {},
        "applied": "complete"
      },
      "id": "r4",
      "order": 2,
      "title": "test 2",
      "pending": false,
      "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloMars_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#mars-text').type('Where\\\\'s Earth?').should('have.value', 'Where\\\\'s Earth?');\\n  }",
      "type": "test",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "file": null,
      "invocationDetails": {
        "function": "Object.getInvocationDetails",
        "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
        "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
        "relativeFile": "../driver/src/cypress/stack_utils.ts",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 94,
        "column": 17,
        "whitespace": "    ",
        "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:333:85)\\n    at context.it.context.specify (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:88:13)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-1.js:21:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 250
    }
  ],
  "preAfterTest": [
    {
      "test": {
        "_testConfig": {
          "testConfigList": [],
          "unverifiedTestConfig": {},
          "applied": "complete"
        },
        "id": "r3",
        "order": 1,
        "title": "test 1",
        "state": "passed",
        "pending": false,
        "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloEarth_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#earth-text').type('Hello Earth').should('have.value', 'Hello Earth');\\n  }",
        "type": "test",
        "duration": 100,
        "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
        "timings": {
          "lifecycle": 100,
          "test": {
            "fnDuration": 100,
            "afterFnDuration": 100
          }
        },
        "file": null,
        "invocationDetails": {
          "function": "Object.getInvocationDetails",
          "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
          "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
          "relativeFile": "../driver/src/cypress/stack_utils.ts",
          "absoluteFile": "/path/to/absoluteFile",
          "line": 94,
          "column": 17,
          "whitespace": "    ",
          "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:333:85)\\n    at context.it.context.specify (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:88:13)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:17:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)"
        },
        "final": true,
        "currentRetry": 0,
        "retries": 0,
        "_slow": 250
      },
      "options": {
        "nextTestHasTestIsolationOn": true
      }
    },
    {
      "test": {
        "_testConfig": {
          "testConfigList": [],
          "unverifiedTestConfig": {},
          "applied": "complete"
        },
        "id": "r4",
        "order": 2,
        "title": "test 2",
        "state": "passed",
        "pending": false,
        "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloEarth_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#earth-text').type('Where\\\\'s Mars?').should('have.value', 'Where\\\\'s Mars?');\\n  }",
        "type": "test",
        "duration": 100,
        "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
        "timings": {
          "lifecycle": 100,
          "test": {
            "fnDuration": 100,
            "afterFnDuration": 100
          }
        },
        "file": null,
        "invocationDetails": {
          "function": "Object.getInvocationDetails",
          "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
          "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
          "relativeFile": "../driver/src/cypress/stack_utils.ts",
          "absoluteFile": "/path/to/absoluteFile",
          "line": 94,
          "column": 17,
          "whitespace": "    ",
          "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:333:85)\\n    at context.it.context.specify (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:88:13)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:21:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)"
        },
        "final": true,
        "currentRetry": 0,
        "retries": 0,
        "_slow": 250
      },
      "options": {
        "nextTestHasTestIsolationOn": true
      }
    },
    {
      "test": {
        "_testConfig": {
          "testConfigList": [],
          "unverifiedTestConfig": {},
          "applied": "complete"
        },
        "id": "r3",
        "order": 1,
        "title": "test 1",
        "state": "passed",
        "pending": false,
        "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloMars_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#mars-text').type('Hello Mars').should('have.value', 'Hello Mars');\\n  }",
        "type": "test",
        "duration": 100,
        "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
        "timings": {
          "lifecycle": 100,
          "test": {
            "fnDuration": 100,
            "afterFnDuration": 100
          }
        },
        "file": null,
        "invocationDetails": {
          "function": "Object.getInvocationDetails",
          "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
          "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
          "relativeFile": "../driver/src/cypress/stack_utils.ts",
          "absoluteFile": "/path/to/absoluteFile",
          "line": 94,
          "column": 17,
          "whitespace": "    ",
          "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:333:85)\\n    at context.it.context.specify (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:88:13)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-1.js:17:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)"
        },
        "final": true,
        "currentRetry": 0,
        "retries": 0,
        "_slow": 250
      },
      "options": {
        "nextTestHasTestIsolationOn": true
      }
    },
    {
      "test": {
        "_testConfig": {
          "testConfigList": [],
          "unverifiedTestConfig": {},
          "applied": "complete"
        },
        "id": "r4",
        "order": 2,
        "title": "test 2",
        "state": "passed",
        "pending": false,
        "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloMars_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#mars-text').type('Where\\\\'s Earth?').should('have.value', 'Where\\\\'s Earth?');\\n  }",
        "type": "test",
        "duration": 100,
        "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
        "timings": {
          "lifecycle": 100,
          "test": {
            "fnDuration": 100,
            "afterFnDuration": 100
          }
        },
        "file": null,
        "invocationDetails": {
          "function": "Object.getInvocationDetails",
          "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
          "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
          "relativeFile": "../driver/src/cypress/stack_utils.ts",
          "absoluteFile": "/path/to/absoluteFile",
          "line": 94,
          "column": 17,
          "whitespace": "    ",
          "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:333:85)\\n    at context.it.context.specify (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:88:13)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-1.js:21:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)"
        },
        "final": true,
        "currentRetry": 0,
        "retries": 0,
        "_slow": 250
      },
      "options": {
        "nextTestHasTestIsolationOn": true
      }
    }
  ],
  "afterTest": [
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {},
        "applied": "complete"
      },
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "state": "passed",
      "pending": false,
      "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloEarth_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#earth-text').type('Hello Earth').should('have.value', 'Hello Earth');\\n  }",
      "type": "test",
      "duration": 100,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "wallClockDuration": 100,
      "timings": {
        "lifecycle": 100,
        "test": {
          "fnDuration": 100,
          "afterFnDuration": 100
        }
      },
      "file": null,
      "invocationDetails": {
        "function": "Object.getInvocationDetails",
        "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
        "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
        "relativeFile": "../driver/src/cypress/stack_utils.ts",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 94,
        "column": 17,
        "whitespace": "    ",
        "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:333:85)\\n    at context.it.context.specify (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:88:13)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:17:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)"
      },
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 250
    },
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {},
        "applied": "complete"
      },
      "id": "r4",
      "order": 2,
      "title": "test 2",
      "state": "passed",
      "pending": false,
      "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloEarth_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#earth-text').type('Where\\\\'s Mars?').should('have.value', 'Where\\\\'s Mars?');\\n  }",
      "type": "test",
      "duration": 100,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "wallClockDuration": 100,
      "timings": {
        "lifecycle": 100,
        "test": {
          "fnDuration": 100,
          "afterFnDuration": 100
        }
      },
      "file": null,
      "invocationDetails": {
        "function": "Object.getInvocationDetails",
        "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
        "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
        "relativeFile": "../driver/src/cypress/stack_utils.ts",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 94,
        "column": 17,
        "whitespace": "    ",
        "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:333:85)\\n    at context.it.context.specify (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:88:13)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:21:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)"
      },
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 250
    },
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {},
        "applied": "complete"
      },
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "state": "passed",
      "pending": false,
      "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloMars_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#mars-text').type('Hello Mars').should('have.value', 'Hello Mars');\\n  }",
      "type": "test",
      "duration": 100,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "wallClockDuration": 100,
      "timings": {
        "lifecycle": 100,
        "test": {
          "fnDuration": 100,
          "afterFnDuration": 100
        }
      },
      "file": null,
      "invocationDetails": {
        "function": "Object.getInvocationDetails",
        "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
        "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
        "relativeFile": "../driver/src/cypress/stack_utils.ts",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 94,
        "column": 17,
        "whitespace": "    ",
        "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:333:85)\\n    at context.it.context.specify (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:88:13)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-1.js:17:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)"
      },
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 250
    },
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {},
        "applied": "complete"
      },
      "id": "r4",
      "order": 2,
      "title": "test 2",
      "state": "passed",
      "pending": false,
      "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloMars_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#mars-text').type('Where\\\\'s Earth?').should('have.value', 'Where\\\\'s Earth?');\\n  }",
      "type": "test",
      "duration": 100,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "wallClockDuration": 100,
      "timings": {
        "lifecycle": 100,
        "test": {
          "fnDuration": 100,
          "afterFnDuration": 100
        }
      },
      "file": null,
      "invocationDetails": {
        "function": "Object.getInvocationDetails",
        "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
        "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
        "relativeFile": "../driver/src/cypress/stack_utils.ts",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 94,
        "column": 17,
        "whitespace": "    ",
        "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:333:85)\\n    at context.it.context.specify (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:88:13)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-1.js:21:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)"
      },
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 250
    }
  ],
  "addRunnables": [
    {
      "id": "r1",
      "title": "",
      "root": true,
      "pending": false,
      "type": "suite",
      "file": "src/components/HelloEarth.cy.jsx",
      "retries": -1,
      "_slow": 250,
      "hooks": [],
      "tests": [],
      "suites": [
        {
          "id": "r2",
          "title": "<HelloEarth />",
          "root": false,
          "pending": false,
          "type": "suite",
          "file": null,
          "invocationDetails": {
            "function": "Object.getInvocationDetails",
            "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
            "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
            "relativeFile": "../driver/src/cypress/stack_utils.ts",
            "absoluteFile": "/path/to/absoluteFile",
            "line": 94,
            "column": 17,
            "whitespace": "    ",
            "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addSuite (cypress:///../driver/src/cypress/mocha.ts:359:86)\\n    at Suite.create (cypress:///../driver/node_modules/mocha/lib/suite.js:33:10)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:123:27)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at ./src/components/HelloEarth.cy.jsx (http://localhost:2121/__cypress/src/spec-0.js:16:1)\\n    at Function.__webpack_require__ (http://localhost:2121/__cypress/src/main.js:114:42)"
          },
          "retries": -1,
          "_slow": 250,
          "hooks": [],
          "tests": [
            {
              "id": "r3",
              "title": "test 1",
              "pending": false,
              "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloEarth_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#earth-text').type('Hello Earth').should('have.value', 'Hello Earth');\\n  }",
              "type": "test",
              "file": null,
              "invocationDetails": {
                "function": "Object.getInvocationDetails",
                "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
                "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
                "relativeFile": "../driver/src/cypress/stack_utils.ts",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 94,
                "column": 17,
                "whitespace": "    ",
                "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:333:85)\\n    at context.it.context.specify (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:88:13)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:17:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)"
              },
              "currentRetry": 0,
              "retries": -1,
              "_slow": 250,
              "hooks": [],
              "_testConfig": {
                "testConfigList": [],
                "unverifiedTestConfig": {}
              },
              "_titlePath": [
                "<HelloEarth />",
                "test 1"
              ]
            },
            {
              "id": "r4",
              "title": "test 2",
              "pending": false,
              "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloEarth_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#earth-text').type('Where\\\\'s Mars?').should('have.value', 'Where\\\\'s Mars?');\\n  }",
              "type": "test",
              "file": null,
              "invocationDetails": {
                "function": "Object.getInvocationDetails",
                "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
                "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
                "relativeFile": "../driver/src/cypress/stack_utils.ts",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 94,
                "column": 17,
                "whitespace": "    ",
                "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:333:85)\\n    at context.it.context.specify (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:88:13)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:21:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)"
              },
              "currentRetry": 0,
              "retries": -1,
              "_slow": 250,
              "hooks": [],
              "_testConfig": {
                "testConfigList": [],
                "unverifiedTestConfig": {}
              },
              "_titlePath": [
                "<HelloEarth />",
                "test 2"
              ]
            }
          ],
          "suites": []
        }
      ],
      "runtimeConfig": {},
      "totalUnfilteredTests": 0
    },
    {
      "id": "r1",
      "title": "",
      "root": true,
      "pending": false,
      "type": "suite",
      "file": "src/components/HelloMars.cy.jsx",
      "retries": -1,
      "_slow": 250,
      "hooks": [],
      "tests": [],
      "suites": [
        {
          "id": "r2",
          "title": "<HelloMars />",
          "root": false,
          "pending": false,
          "type": "suite",
          "file": null,
          "invocationDetails": {
            "function": "Object.getInvocationDetails",
            "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
            "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
            "relativeFile": "../driver/src/cypress/stack_utils.ts",
            "absoluteFile": "/path/to/absoluteFile",
            "line": 94,
            "column": 17,
            "whitespace": "    ",
            "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addSuite (cypress:///../driver/src/cypress/mocha.ts:359:86)\\n    at Suite.create (cypress:///../driver/node_modules/mocha/lib/suite.js:33:10)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:123:27)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at ./src/components/HelloMars.cy.jsx (http://localhost:2121/__cypress/src/spec-1.js:16:1)\\n    at Function.__webpack_require__ (http://localhost:2121/__cypress/src/main.js:114:42)"
          },
          "retries": -1,
          "_slow": 250,
          "hooks": [],
          "tests": [
            {
              "id": "r3",
              "title": "test 1",
              "pending": false,
              "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloMars_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#mars-text').type('Hello Mars').should('have.value', 'Hello Mars');\\n  }",
              "type": "test",
              "file": null,
              "invocationDetails": {
                "function": "Object.getInvocationDetails",
                "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
                "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
                "relativeFile": "../driver/src/cypress/stack_utils.ts",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 94,
                "column": 17,
                "whitespace": "    ",
                "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:333:85)\\n    at context.it.context.specify (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:88:13)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-1.js:17:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)"
              },
              "currentRetry": 0,
              "retries": -1,
              "_slow": 250,
              "hooks": [],
              "_testConfig": {
                "testConfigList": [],
                "unverifiedTestConfig": {}
              },
              "_titlePath": [
                "<HelloMars />",
                "test 1"
              ]
            },
            {
              "id": "r4",
              "title": "test 2",
              "pending": false,
              "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloMars_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#mars-text').type('Where\\\\'s Earth?').should('have.value', 'Where\\\\'s Earth?');\\n  }",
              "type": "test",
              "file": null,
              "invocationDetails": {
                "function": "Object.getInvocationDetails",
                "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
                "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
                "relativeFile": "../driver/src/cypress/stack_utils.ts",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 94,
                "column": 17,
                "whitespace": "    ",
                "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:333:85)\\n    at context.it.context.specify (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:88:13)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-1.js:21:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)"
              },
              "currentRetry": 0,
              "retries": -1,
              "_slow": 250,
              "hooks": [],
              "_testConfig": {
                "testConfigList": [],
                "unverifiedTestConfig": {}
              },
              "_titlePath": [
                "<HelloMars />",
                "test 2"
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
    true,
    true
  ],
  "commandLogAdded": [
    {
      "id": "log-http://localhost:2121-1",
      "end": true,
      "event": true,
      "instrument": "command",
      "message": "http://localhost:2121/__cypress/iframes/index.html?specPath=/private/var/folders/6d/pqstcz093k1_xn80gfmlyy_c0000gn/T/cy-projects/protocol/src/components/HelloEarth.cy.jsx",
      "name": "new url",
      "renderProps": {},
      "state": "pending",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:2121/__cypress/iframes/index.html?specPath=/private/var/folders/6d/pqstcz093k1_xn80gfmlyy_c0000gn/T/cy-projects/protocol/src/components/HelloEarth.cy.jsx",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "snapshots": [
        {
          "timestamp": 100
        }
      ],
      "timestamp": 100
    },
    {
      "id": "log-http://localhost:2121-2",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "<HelloEarth ... />",
      "name": "mount",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-3",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "#earth-text",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100
    },
    {
      "id": "log-http://localhost:2121-4",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "Hello Earth",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 4000,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-5",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "expected **<input#earth-text>** to have value **Hello Earth**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 0,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-6",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "message": "<HelloEarth ... />",
      "name": "mount",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r4",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-7",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "message": "#earth-text",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r4",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100
    },
    {
      "id": "log-http://localhost:2121-8",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "message": "Where's Mars?",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r4",
      "timeout": 4000,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-9",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "message": "expected **<input#earth-text>** to have value **Where's Mars?**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r4",
      "timeout": 0,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-1",
      "end": true,
      "event": true,
      "instrument": "command",
      "message": "http://localhost:2121/__cypress/iframes/index.html?specPath=/private/var/folders/6d/pqstcz093k1_xn80gfmlyy_c0000gn/T/cy-projects/protocol/src/components/HelloMars.cy.jsx",
      "name": "new url",
      "renderProps": {},
      "state": "pending",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:2121/__cypress/iframes/index.html?specPath=/private/var/folders/6d/pqstcz093k1_xn80gfmlyy_c0000gn/T/cy-projects/protocol/src/components/HelloMars.cy.jsx",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "snapshots": [
        {
          "timestamp": 100
        }
      ],
      "timestamp": 100
    },
    {
      "id": "log-http://localhost:2121-2",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "<HelloMars ... />",
      "name": "mount",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-3",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "#mars-text",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100
    },
    {
      "id": "log-http://localhost:2121-4",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "Hello Mars",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 4000,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-5",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "expected **<input#mars-text>** to have value **Hello Mars**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 0,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-6",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "message": "<HelloMars ... />",
      "name": "mount",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r4",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-7",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "message": "#mars-text",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r4",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100
    },
    {
      "id": "log-http://localhost:2121-8",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "message": "Where's Earth?",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r4",
      "timeout": 4000,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-9",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "message": "expected **<input#mars-text>** to have value **Where's Earth?**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r4",
      "timeout": 0,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    }
  ],
  "commandLogChanged": [
    {
      "id": "log-http://localhost:2121-1",
      "end": true,
      "event": true,
      "instrument": "command",
      "message": "http://localhost:2121/__cypress/iframes/index.html?specPath=/private/var/folders/6d/pqstcz093k1_xn80gfmlyy_c0000gn/T/cy-projects/protocol/src/components/HelloEarth.cy.jsx",
      "name": "new url",
      "renderProps": {},
      "state": "passed",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:2121/__cypress/iframes/index.html?specPath=/private/var/folders/6d/pqstcz093k1_xn80gfmlyy_c0000gn/T/cy-projects/protocol/src/components/HelloEarth.cy.jsx",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "snapshots": [
        {
          "timestamp": 100
        }
      ],
      "timestamp": 100
    },
    {
      "id": "log-http://localhost:2121-2",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "<HelloEarth ... />",
      "name": "mount",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": ":nth-child(1) > div"
            }
          ]
        }
      ],
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-3",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "#earth-text",
      "name": "get",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "#earth-text"
            }
          ]
        }
      ],
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-5",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "expected **<input#earth-text>** to have value **Hello Earth**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r3",
      "timeout": 0,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "#earth-text"
            }
          ]
        }
      ],
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-4",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "Hello Earth",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r3",
      "timeout": 4000,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "name": "before",
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "#earth-text"
            }
          ]
        },
        {
          "name": "after",
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "#earth-text"
            }
          ]
        }
      ],
      "timestamp": 100,
      "coords": {
        "top": 128,
        "left": 176.5,
        "topCenter": 138,
        "leftCenter": 250,
        "x": 250,
        "y": 138
      },
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-6",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "message": "<HelloEarth ... />",
      "name": "mount",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r4",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": ":nth-child(1) > div"
            }
          ]
        }
      ],
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-7",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "message": "#earth-text",
      "name": "get",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r4",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "#earth-text"
            }
          ]
        }
      ],
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-9",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "message": "expected **<input#earth-text>** to have value **Where's Mars?**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r4",
      "timeout": 0,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "#earth-text"
            }
          ]
        }
      ],
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-8",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "message": "Where's Mars?",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r4",
      "timeout": 4000,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "name": "before",
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "#earth-text"
            }
          ]
        },
        {
          "name": "after",
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "#earth-text"
            }
          ]
        }
      ],
      "timestamp": 100,
      "coords": {
        "top": 128,
        "left": 176.5,
        "topCenter": 138,
        "leftCenter": 250,
        "x": 250,
        "y": 138
      },
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-1",
      "end": true,
      "event": true,
      "instrument": "command",
      "message": "http://localhost:2121/__cypress/iframes/index.html?specPath=/private/var/folders/6d/pqstcz093k1_xn80gfmlyy_c0000gn/T/cy-projects/protocol/src/components/HelloMars.cy.jsx",
      "name": "new url",
      "renderProps": {},
      "state": "passed",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:2121/__cypress/iframes/index.html?specPath=/private/var/folders/6d/pqstcz093k1_xn80gfmlyy_c0000gn/T/cy-projects/protocol/src/components/HelloMars.cy.jsx",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "snapshots": [
        {
          "timestamp": 100
        }
      ],
      "timestamp": 100
    },
    {
      "id": "log-http://localhost:2121-2",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "<HelloMars ... />",
      "name": "mount",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": ":nth-child(1) > div"
            }
          ]
        }
      ],
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-3",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "#mars-text",
      "name": "get",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "#mars-text"
            }
          ]
        }
      ],
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-5",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "expected **<input#mars-text>** to have value **Hello Mars**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r3",
      "timeout": 0,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "#mars-text"
            }
          ]
        }
      ],
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-4",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "Hello Mars",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r3",
      "timeout": 4000,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "name": "before",
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "#mars-text"
            }
          ]
        },
        {
          "name": "after",
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "#mars-text"
            }
          ]
        }
      ],
      "timestamp": 100,
      "coords": {
        "top": 128,
        "left": 176.5,
        "topCenter": 138,
        "leftCenter": 250,
        "x": 250,
        "y": 138
      },
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-6",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "message": "<HelloMars ... />",
      "name": "mount",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r4",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": ":nth-child(1) > div"
            }
          ]
        }
      ],
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-7",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "message": "#mars-text",
      "name": "get",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r4",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "#mars-text"
            }
          ]
        }
      ],
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-9",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "message": "expected **<input#mars-text>** to have value **Where's Earth?**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r4",
      "timeout": 0,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "#mars-text"
            }
          ]
        }
      ],
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-8",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "message": "Where's Earth?",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r4",
      "timeout": 4000,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "name": "before",
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "#mars-text"
            }
          ]
        },
        {
          "name": "after",
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "#mars-text"
            }
          ]
        }
      ],
      "timestamp": 100,
      "coords": {
        "top": 128,
        "left": 176.5,
        "topCenter": 138,
        "leftCenter": 250,
        "x": 250,
        "y": 138
      },
      "highlightAttr": "data-cypress-el"
    }
  ],
  "viewportChanged": [],
  "urlChanged": [
    {
      "url": "http://localhost:2121/__cypress/iframes/index.html?specPath=/private/var/folders/6d/pqstcz093k1_xn80gfmlyy_c0000gn/T/cy-projects/protocol/src/components/HelloEarth.cy.jsx",
      "timestamp": 100
    },
    {
      "url": "http://localhost:2121/__cypress/iframes/index.html?specPath=/private/var/folders/6d/pqstcz093k1_xn80gfmlyy_c0000gn/T/cy-projects/protocol/src/components/HelloMars.cy.jsx",
      "timestamp": 100
    }
  ],
  "pageLoading": [],
  "resetTest": []
}
`

exports['component events - experimentalSingleTabRunMode: false'] = `
{
  "beforeSpec": [
    {
      "name": "/path/to/name",
      "open": true,
      "inTransaction": false,
      "readonly": false,
      "memory": false
    },
    {
      "name": "/path/to/name",
      "open": true,
      "inTransaction": false,
      "readonly": false,
      "memory": false
    }
  ],
  "afterSpec": [
    true,
    true
  ],
  "beforeTest": [
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {},
        "applied": "complete"
      },
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "pending": false,
      "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloEarth_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#earth-text').type('Hello Earth').should('have.value', 'Hello Earth');\\n  }",
      "type": "test",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "file": null,
      "invocationDetails": {
        "function": "Object.getInvocationDetails",
        "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
        "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
        "relativeFile": "../driver/src/cypress/stack_utils.ts",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 94,
        "column": 17,
        "whitespace": "    ",
        "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:333:85)\\n    at context.it.context.specify (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:88:13)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:17:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 250
    },
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {},
        "applied": "complete"
      },
      "id": "r4",
      "order": 2,
      "title": "test 2",
      "pending": false,
      "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloEarth_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#earth-text').type('Where\\\\'s Mars?').should('have.value', 'Where\\\\'s Mars?');\\n  }",
      "type": "test",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "file": null,
      "invocationDetails": {
        "function": "Object.getInvocationDetails",
        "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
        "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
        "relativeFile": "../driver/src/cypress/stack_utils.ts",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 94,
        "column": 17,
        "whitespace": "    ",
        "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:333:85)\\n    at context.it.context.specify (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:88:13)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:21:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 250
    },
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {},
        "applied": "complete"
      },
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "pending": false,
      "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloMars_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#mars-text').type('Hello Mars').should('have.value', 'Hello Mars');\\n  }",
      "type": "test",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "file": null,
      "invocationDetails": {
        "function": "Object.getInvocationDetails",
        "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
        "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
        "relativeFile": "../driver/src/cypress/stack_utils.ts",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 94,
        "column": 17,
        "whitespace": "    ",
        "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:333:85)\\n    at context.it.context.specify (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:88:13)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-1.js:17:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 250
    },
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {},
        "applied": "complete"
      },
      "id": "r4",
      "order": 2,
      "title": "test 2",
      "pending": false,
      "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloMars_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#mars-text').type('Where\\\\'s Earth?').should('have.value', 'Where\\\\'s Earth?');\\n  }",
      "type": "test",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "file": null,
      "invocationDetails": {
        "function": "Object.getInvocationDetails",
        "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
        "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
        "relativeFile": "../driver/src/cypress/stack_utils.ts",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 94,
        "column": 17,
        "whitespace": "    ",
        "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:333:85)\\n    at context.it.context.specify (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:88:13)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-1.js:21:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 250
    }
  ],
  "preAfterTest": [
    {
      "test": {
        "_testConfig": {
          "testConfigList": [],
          "unverifiedTestConfig": {},
          "applied": "complete"
        },
        "id": "r3",
        "order": 1,
        "title": "test 1",
        "state": "passed",
        "pending": false,
        "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloEarth_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#earth-text').type('Hello Earth').should('have.value', 'Hello Earth');\\n  }",
        "type": "test",
        "duration": 100,
        "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
        "timings": {
          "lifecycle": 100,
          "test": {
            "fnDuration": 100,
            "afterFnDuration": 100
          }
        },
        "file": null,
        "invocationDetails": {
          "function": "Object.getInvocationDetails",
          "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
          "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
          "relativeFile": "../driver/src/cypress/stack_utils.ts",
          "absoluteFile": "/path/to/absoluteFile",
          "line": 94,
          "column": 17,
          "whitespace": "    ",
          "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:333:85)\\n    at context.it.context.specify (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:88:13)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:17:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)"
        },
        "final": true,
        "currentRetry": 0,
        "retries": 0,
        "_slow": 250
      },
      "options": {
        "nextTestHasTestIsolationOn": true
      }
    },
    {
      "test": {
        "_testConfig": {
          "testConfigList": [],
          "unverifiedTestConfig": {},
          "applied": "complete"
        },
        "id": "r4",
        "order": 2,
        "title": "test 2",
        "state": "passed",
        "pending": false,
        "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloEarth_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#earth-text').type('Where\\\\'s Mars?').should('have.value', 'Where\\\\'s Mars?');\\n  }",
        "type": "test",
        "duration": 100,
        "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
        "timings": {
          "lifecycle": 100,
          "test": {
            "fnDuration": 100,
            "afterFnDuration": 100
          }
        },
        "file": null,
        "invocationDetails": {
          "function": "Object.getInvocationDetails",
          "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
          "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
          "relativeFile": "../driver/src/cypress/stack_utils.ts",
          "absoluteFile": "/path/to/absoluteFile",
          "line": 94,
          "column": 17,
          "whitespace": "    ",
          "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:333:85)\\n    at context.it.context.specify (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:88:13)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:21:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)"
        },
        "final": true,
        "currentRetry": 0,
        "retries": 0,
        "_slow": 250
      },
      "options": {
        "nextTestHasTestIsolationOn": true
      }
    },
    {
      "test": {
        "_testConfig": {
          "testConfigList": [],
          "unverifiedTestConfig": {},
          "applied": "complete"
        },
        "id": "r3",
        "order": 1,
        "title": "test 1",
        "state": "passed",
        "pending": false,
        "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloMars_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#mars-text').type('Hello Mars').should('have.value', 'Hello Mars');\\n  }",
        "type": "test",
        "duration": 100,
        "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
        "timings": {
          "lifecycle": 100,
          "test": {
            "fnDuration": 100,
            "afterFnDuration": 100
          }
        },
        "file": null,
        "invocationDetails": {
          "function": "Object.getInvocationDetails",
          "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
          "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
          "relativeFile": "../driver/src/cypress/stack_utils.ts",
          "absoluteFile": "/path/to/absoluteFile",
          "line": 94,
          "column": 17,
          "whitespace": "    ",
          "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:333:85)\\n    at context.it.context.specify (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:88:13)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-1.js:17:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)"
        },
        "final": true,
        "currentRetry": 0,
        "retries": 0,
        "_slow": 250
      },
      "options": {
        "nextTestHasTestIsolationOn": true
      }
    },
    {
      "test": {
        "_testConfig": {
          "testConfigList": [],
          "unverifiedTestConfig": {},
          "applied": "complete"
        },
        "id": "r4",
        "order": 2,
        "title": "test 2",
        "state": "passed",
        "pending": false,
        "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloMars_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#mars-text').type('Where\\\\'s Earth?').should('have.value', 'Where\\\\'s Earth?');\\n  }",
        "type": "test",
        "duration": 100,
        "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
        "timings": {
          "lifecycle": 100,
          "test": {
            "fnDuration": 100,
            "afterFnDuration": 100
          }
        },
        "file": null,
        "invocationDetails": {
          "function": "Object.getInvocationDetails",
          "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
          "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
          "relativeFile": "../driver/src/cypress/stack_utils.ts",
          "absoluteFile": "/path/to/absoluteFile",
          "line": 94,
          "column": 17,
          "whitespace": "    ",
          "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:333:85)\\n    at context.it.context.specify (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:88:13)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-1.js:21:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)"
        },
        "final": true,
        "currentRetry": 0,
        "retries": 0,
        "_slow": 250
      },
      "options": {
        "nextTestHasTestIsolationOn": true
      }
    }
  ],
  "afterTest": [
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {},
        "applied": "complete"
      },
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "state": "passed",
      "pending": false,
      "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloEarth_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#earth-text').type('Hello Earth').should('have.value', 'Hello Earth');\\n  }",
      "type": "test",
      "duration": 100,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "wallClockDuration": 100,
      "timings": {
        "lifecycle": 100,
        "test": {
          "fnDuration": 100,
          "afterFnDuration": 100
        }
      },
      "file": null,
      "invocationDetails": {
        "function": "Object.getInvocationDetails",
        "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
        "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
        "relativeFile": "../driver/src/cypress/stack_utils.ts",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 94,
        "column": 17,
        "whitespace": "    ",
        "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:333:85)\\n    at context.it.context.specify (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:88:13)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:17:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)"
      },
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 250
    },
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {},
        "applied": "complete"
      },
      "id": "r4",
      "order": 2,
      "title": "test 2",
      "state": "passed",
      "pending": false,
      "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloEarth_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#earth-text').type('Where\\\\'s Mars?').should('have.value', 'Where\\\\'s Mars?');\\n  }",
      "type": "test",
      "duration": 100,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "wallClockDuration": 100,
      "timings": {
        "lifecycle": 100,
        "test": {
          "fnDuration": 100,
          "afterFnDuration": 100
        }
      },
      "file": null,
      "invocationDetails": {
        "function": "Object.getInvocationDetails",
        "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
        "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
        "relativeFile": "../driver/src/cypress/stack_utils.ts",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 94,
        "column": 17,
        "whitespace": "    ",
        "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:333:85)\\n    at context.it.context.specify (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:88:13)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:21:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)"
      },
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 250
    },
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {},
        "applied": "complete"
      },
      "id": "r3",
      "order": 1,
      "title": "test 1",
      "state": "passed",
      "pending": false,
      "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloMars_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#mars-text').type('Hello Mars').should('have.value', 'Hello Mars');\\n  }",
      "type": "test",
      "duration": 100,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "wallClockDuration": 100,
      "timings": {
        "lifecycle": 100,
        "test": {
          "fnDuration": 100,
          "afterFnDuration": 100
        }
      },
      "file": null,
      "invocationDetails": {
        "function": "Object.getInvocationDetails",
        "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
        "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
        "relativeFile": "../driver/src/cypress/stack_utils.ts",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 94,
        "column": 17,
        "whitespace": "    ",
        "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:333:85)\\n    at context.it.context.specify (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:88:13)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-1.js:17:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)"
      },
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 250
    },
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {},
        "applied": "complete"
      },
      "id": "r4",
      "order": 2,
      "title": "test 2",
      "state": "passed",
      "pending": false,
      "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloMars_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#mars-text').type('Where\\\\'s Earth?').should('have.value', 'Where\\\\'s Earth?');\\n  }",
      "type": "test",
      "duration": 100,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "wallClockDuration": 100,
      "timings": {
        "lifecycle": 100,
        "test": {
          "fnDuration": 100,
          "afterFnDuration": 100
        }
      },
      "file": null,
      "invocationDetails": {
        "function": "Object.getInvocationDetails",
        "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
        "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
        "relativeFile": "../driver/src/cypress/stack_utils.ts",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 94,
        "column": 17,
        "whitespace": "    ",
        "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:333:85)\\n    at context.it.context.specify (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:88:13)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-1.js:21:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)"
      },
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 250
    }
  ],
  "addRunnables": [
    {
      "id": "r1",
      "title": "",
      "root": true,
      "pending": false,
      "type": "suite",
      "file": "src/components/HelloEarth.cy.jsx",
      "retries": -1,
      "_slow": 250,
      "hooks": [],
      "tests": [],
      "suites": [
        {
          "id": "r2",
          "title": "<HelloEarth />",
          "root": false,
          "pending": false,
          "type": "suite",
          "file": null,
          "invocationDetails": {
            "function": "Object.getInvocationDetails",
            "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
            "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
            "relativeFile": "../driver/src/cypress/stack_utils.ts",
            "absoluteFile": "/path/to/absoluteFile",
            "line": 94,
            "column": 17,
            "whitespace": "    ",
            "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addSuite (cypress:///../driver/src/cypress/mocha.ts:359:86)\\n    at Suite.create (cypress:///../driver/node_modules/mocha/lib/suite.js:33:10)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:123:27)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at ./src/components/HelloEarth.cy.jsx (http://localhost:2121/__cypress/src/spec-0.js:16:1)\\n    at Function.__webpack_require__ (http://localhost:2121/__cypress/src/main.js:114:42)"
          },
          "retries": -1,
          "_slow": 250,
          "hooks": [],
          "tests": [
            {
              "id": "r3",
              "title": "test 1",
              "pending": false,
              "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloEarth_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#earth-text').type('Hello Earth').should('have.value', 'Hello Earth');\\n  }",
              "type": "test",
              "file": null,
              "invocationDetails": {
                "function": "Object.getInvocationDetails",
                "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
                "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
                "relativeFile": "../driver/src/cypress/stack_utils.ts",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 94,
                "column": 17,
                "whitespace": "    ",
                "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:333:85)\\n    at context.it.context.specify (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:88:13)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:17:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)"
              },
              "currentRetry": 0,
              "retries": -1,
              "_slow": 250,
              "hooks": [],
              "_testConfig": {
                "testConfigList": [],
                "unverifiedTestConfig": {}
              },
              "_titlePath": [
                "<HelloEarth />",
                "test 1"
              ]
            },
            {
              "id": "r4",
              "title": "test 2",
              "pending": false,
              "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloEarth_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#earth-text').type('Where\\\\'s Mars?').should('have.value', 'Where\\\\'s Mars?');\\n  }",
              "type": "test",
              "file": null,
              "invocationDetails": {
                "function": "Object.getInvocationDetails",
                "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
                "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
                "relativeFile": "../driver/src/cypress/stack_utils.ts",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 94,
                "column": 17,
                "whitespace": "    ",
                "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:333:85)\\n    at context.it.context.specify (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:88:13)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:21:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)"
              },
              "currentRetry": 0,
              "retries": -1,
              "_slow": 250,
              "hooks": [],
              "_testConfig": {
                "testConfigList": [],
                "unverifiedTestConfig": {}
              },
              "_titlePath": [
                "<HelloEarth />",
                "test 2"
              ]
            }
          ],
          "suites": []
        }
      ],
      "runtimeConfig": {},
      "totalUnfilteredTests": 0
    },
    {
      "id": "r1",
      "title": "",
      "root": true,
      "pending": false,
      "type": "suite",
      "file": "src/components/HelloMars.cy.jsx",
      "retries": -1,
      "_slow": 250,
      "hooks": [],
      "tests": [],
      "suites": [
        {
          "id": "r2",
          "title": "<HelloMars />",
          "root": false,
          "pending": false,
          "type": "suite",
          "file": null,
          "invocationDetails": {
            "function": "Object.getInvocationDetails",
            "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
            "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
            "relativeFile": "../driver/src/cypress/stack_utils.ts",
            "absoluteFile": "/path/to/absoluteFile",
            "line": 94,
            "column": 17,
            "whitespace": "    ",
            "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addSuite (cypress:///../driver/src/cypress/mocha.ts:359:86)\\n    at Suite.create (cypress:///../driver/node_modules/mocha/lib/suite.js:33:10)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:123:27)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at ./src/components/HelloMars.cy.jsx (http://localhost:2121/__cypress/src/spec-1.js:16:1)\\n    at Function.__webpack_require__ (http://localhost:2121/__cypress/src/main.js:114:42)"
          },
          "retries": -1,
          "_slow": 250,
          "hooks": [],
          "tests": [
            {
              "id": "r3",
              "title": "test 1",
              "pending": false,
              "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloMars_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#mars-text').type('Hello Mars').should('have.value', 'Hello Mars');\\n  }",
              "type": "test",
              "file": null,
              "invocationDetails": {
                "function": "Object.getInvocationDetails",
                "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
                "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
                "relativeFile": "../driver/src/cypress/stack_utils.ts",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 94,
                "column": 17,
                "whitespace": "    ",
                "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:333:85)\\n    at context.it.context.specify (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:88:13)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-1.js:17:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)"
              },
              "currentRetry": 0,
              "retries": -1,
              "_slow": 250,
              "hooks": [],
              "_testConfig": {
                "testConfigList": [],
                "unverifiedTestConfig": {}
              },
              "_titlePath": [
                "<HelloMars />",
                "test 1"
              ]
            },
            {
              "id": "r4",
              "title": "test 2",
              "pending": false,
              "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloMars_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#mars-text').type('Where\\\\'s Earth?').should('have.value', 'Where\\\\'s Earth?');\\n  }",
              "type": "test",
              "file": null,
              "invocationDetails": {
                "function": "Object.getInvocationDetails",
                "fileUrl": "cypress:///../driver/src/cypress/stack_utils.ts",
                "originalFile": "cypress:///../driver/src/cypress/stack_utils.ts",
                "relativeFile": "../driver/src/cypress/stack_utils.ts",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 94,
                "column": 17,
                "whitespace": "    ",
                "stack": "Error\\n    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:94:17)\\n    at Suite.addTest (cypress:///../driver/src/cypress/mocha.ts:333:85)\\n    at context.it.context.specify (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:88:13)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-1.js:21:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:54:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:115:14)"
              },
              "currentRetry": 0,
              "retries": -1,
              "_slow": 250,
              "hooks": [],
              "_testConfig": {
                "testConfigList": [],
                "unverifiedTestConfig": {}
              },
              "_titlePath": [
                "<HelloMars />",
                "test 2"
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
    true,
    true
  ],
  "commandLogAdded": [
    {
      "id": "log-http://localhost:2121-1",
      "end": true,
      "event": true,
      "instrument": "command",
      "message": "http://localhost:2121/__cypress/iframes/index.html?specPath=/private/var/folders/6d/pqstcz093k1_xn80gfmlyy_c0000gn/T/cy-projects/protocol/src/components/HelloEarth.cy.jsx",
      "name": "new url",
      "renderProps": {},
      "state": "pending",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:2121/__cypress/iframes/index.html?specPath=/private/var/folders/6d/pqstcz093k1_xn80gfmlyy_c0000gn/T/cy-projects/protocol/src/components/HelloEarth.cy.jsx",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "snapshots": [
        {
          "timestamp": 100
        }
      ],
      "timestamp": 100
    },
    {
      "id": "log-http://localhost:2121-2",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "<HelloEarth ... />",
      "name": "mount",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-3",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "#earth-text",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100
    },
    {
      "id": "log-http://localhost:2121-4",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "Hello Earth",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 4000,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-5",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "expected **<input#earth-text>** to have value **Hello Earth**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 0,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-6",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "message": "<HelloEarth ... />",
      "name": "mount",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r4",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-7",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "message": "#earth-text",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r4",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100
    },
    {
      "id": "log-http://localhost:2121-8",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "message": "Where's Mars?",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r4",
      "timeout": 4000,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-9",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "message": "expected **<input#earth-text>** to have value **Where's Mars?**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r4",
      "timeout": 0,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-1",
      "end": true,
      "event": true,
      "instrument": "command",
      "message": "http://localhost:2121/__cypress/iframes/index.html?specPath=/private/var/folders/6d/pqstcz093k1_xn80gfmlyy_c0000gn/T/cy-projects/protocol/src/components/HelloMars.cy.jsx",
      "name": "new url",
      "renderProps": {},
      "state": "pending",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:2121/__cypress/iframes/index.html?specPath=/private/var/folders/6d/pqstcz093k1_xn80gfmlyy_c0000gn/T/cy-projects/protocol/src/components/HelloMars.cy.jsx",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "snapshots": [
        {
          "timestamp": 100
        }
      ],
      "timestamp": 100
    },
    {
      "id": "log-http://localhost:2121-2",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "<HelloMars ... />",
      "name": "mount",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-3",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "#mars-text",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100
    },
    {
      "id": "log-http://localhost:2121-4",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "Hello Mars",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 4000,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-5",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "expected **<input#mars-text>** to have value **Hello Mars**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 0,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-6",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "message": "<HelloMars ... />",
      "name": "mount",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r4",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-7",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "message": "#mars-text",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r4",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100
    },
    {
      "id": "log-http://localhost:2121-8",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "message": "Where's Earth?",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r4",
      "timeout": 4000,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-9",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "message": "expected **<input#mars-text>** to have value **Where's Earth?**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r4",
      "timeout": 0,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    }
  ],
  "commandLogChanged": [
    {
      "id": "log-http://localhost:2121-1",
      "end": true,
      "event": true,
      "instrument": "command",
      "message": "http://localhost:2121/__cypress/iframes/index.html?specPath=/private/var/folders/6d/pqstcz093k1_xn80gfmlyy_c0000gn/T/cy-projects/protocol/src/components/HelloEarth.cy.jsx",
      "name": "new url",
      "renderProps": {},
      "state": "passed",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:2121/__cypress/iframes/index.html?specPath=/private/var/folders/6d/pqstcz093k1_xn80gfmlyy_c0000gn/T/cy-projects/protocol/src/components/HelloEarth.cy.jsx",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "snapshots": [
        {
          "timestamp": 100
        }
      ],
      "timestamp": 100
    },
    {
      "id": "log-http://localhost:2121-2",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "<HelloEarth ... />",
      "name": "mount",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": ":nth-child(1) > div"
            }
          ]
        }
      ],
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-3",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "#earth-text",
      "name": "get",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "#earth-text"
            }
          ]
        }
      ],
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-5",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "expected **<input#earth-text>** to have value **Hello Earth**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r3",
      "timeout": 0,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "#earth-text"
            }
          ]
        }
      ],
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-4",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "Hello Earth",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r3",
      "timeout": 4000,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "name": "before",
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "#earth-text"
            }
          ]
        },
        {
          "name": "after",
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "#earth-text"
            }
          ]
        }
      ],
      "timestamp": 100,
      "coords": {
        "top": 128,
        "left": 176.5,
        "topCenter": 138,
        "leftCenter": 250,
        "x": 250,
        "y": 138
      },
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-6",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "message": "<HelloEarth ... />",
      "name": "mount",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r4",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": ":nth-child(1) > div"
            }
          ]
        }
      ],
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-7",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "message": "#earth-text",
      "name": "get",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r4",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "#earth-text"
            }
          ]
        }
      ],
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-9",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "message": "expected **<input#earth-text>** to have value **Where's Mars?**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r4",
      "timeout": 0,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "#earth-text"
            }
          ]
        }
      ],
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-8",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "message": "Where's Mars?",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r4",
      "timeout": 4000,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "name": "before",
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "#earth-text"
            }
          ]
        },
        {
          "name": "after",
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "#earth-text"
            }
          ]
        }
      ],
      "timestamp": 100,
      "coords": {
        "top": 128,
        "left": 176.5,
        "topCenter": 138,
        "leftCenter": 250,
        "x": 250,
        "y": 138
      },
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-1",
      "end": true,
      "event": true,
      "instrument": "command",
      "message": "http://localhost:2121/__cypress/iframes/index.html?specPath=/private/var/folders/6d/pqstcz093k1_xn80gfmlyy_c0000gn/T/cy-projects/protocol/src/components/HelloMars.cy.jsx",
      "name": "new url",
      "renderProps": {},
      "state": "passed",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:2121/__cypress/iframes/index.html?specPath=/private/var/folders/6d/pqstcz093k1_xn80gfmlyy_c0000gn/T/cy-projects/protocol/src/components/HelloMars.cy.jsx",
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "snapshots": [
        {
          "timestamp": 100
        }
      ],
      "timestamp": 100
    },
    {
      "id": "log-http://localhost:2121-2",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "<HelloMars ... />",
      "name": "mount",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": ":nth-child(1) > div"
            }
          ]
        }
      ],
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-3",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "#mars-text",
      "name": "get",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "#mars-text"
            }
          ]
        }
      ],
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-5",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "expected **<input#mars-text>** to have value **Hello Mars**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r3",
      "timeout": 0,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "#mars-text"
            }
          ]
        }
      ],
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-4",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "message": "Hello Mars",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r3",
      "timeout": 4000,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "name": "before",
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "#mars-text"
            }
          ]
        },
        {
          "name": "after",
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "#mars-text"
            }
          ]
        }
      ],
      "timestamp": 100,
      "coords": {
        "top": 128,
        "left": 176.5,
        "topCenter": 138,
        "leftCenter": 250,
        "x": 250,
        "y": 138
      },
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-6",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "message": "<HelloMars ... />",
      "name": "mount",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r4",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": ":nth-child(1) > div"
            }
          ]
        }
      ],
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-7",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "message": "#mars-text",
      "name": "get",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r4",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "#mars-text"
            }
          ]
        }
      ],
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-9",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "message": "expected **<input#mars-text>** to have value **Where's Earth?**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r4",
      "timeout": 0,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "#mars-text"
            }
          ]
        }
      ],
      "timestamp": 100,
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-8",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "message": "Where's Earth?",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r4",
      "timeout": 4000,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "2015-03-18T00:00:00.000Z",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "name": "before",
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "#mars-text"
            }
          ]
        },
        {
          "name": "after",
          "timestamp": 100,
          "elementsToHighlight": [
            {
              "selector": "#mars-text"
            }
          ]
        }
      ],
      "timestamp": 100,
      "coords": {
        "top": 128,
        "left": 176.5,
        "topCenter": 138,
        "leftCenter": 250,
        "x": 250,
        "y": 138
      },
      "highlightAttr": "data-cypress-el"
    }
  ],
  "viewportChanged": [],
  "urlChanged": [
    {
      "url": "http://localhost:2121/__cypress/iframes/index.html?specPath=/private/var/folders/6d/pqstcz093k1_xn80gfmlyy_c0000gn/T/cy-projects/protocol/src/components/HelloEarth.cy.jsx",
      "timestamp": 100
    },
    {
      "url": "http://localhost:2121/__cypress/iframes/index.html?specPath=/private/var/folders/6d/pqstcz093k1_xn80gfmlyy_c0000gn/T/cy-projects/protocol/src/components/HelloMars.cy.jsx",
      "timestamp": 100
    }
  ],
  "pageLoading": [],
  "resetTest": []
}
`
