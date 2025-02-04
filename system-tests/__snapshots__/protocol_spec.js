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
      "wallClockStartedAt": "Any.ISODate",
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
        "stack": "Error\\n    at Suite.eval (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:16:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000,
      "timestamp": "Any.Number"
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
              "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:77:12)\\n    at eval (<anonymous>)"
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
              "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
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
      "body": "() => {\\n      cy.visit('cypress/fixtures/dom-with-browser-interactions.html');\\n      cy.wait(1000, {\\n        log: false\\n      });\\n      cy.get('#text-target').type('abc');\\n      cy.get('#text-target').should('have.value', 'abc');\\n    }",
      "type": "test",
      "wallClockStartedAt": "Any.ISODate",
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
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:17:5)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000,
      "timestamp": "Any.Number"
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
              "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:77:12)\\n    at eval (<anonymous>)"
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
              "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
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
      "body": "() => {\\n      cy.get('#text-target').type('def');\\n      cy.get('#text-target').should('have.value', 'abcdef');\\n    }",
      "type": "test",
      "wallClockStartedAt": "Any.ISODate",
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
        "relativeFile": "cypress/e2e/test-isolation.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 12,
        "column": 4,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:25:5)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000,
      "timestamp": "Any.Number"
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
              "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:77:12)\\n    at eval (<anonymous>)"
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
              "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
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
      "body": "() => {\\n      cy.get('#text-target').type('ghi');\\n      cy.get('#text-target').should('have.value', 'abcdefghi');\\n    }",
      "type": "test",
      "wallClockStartedAt": "Any.ISODate",
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
        "relativeFile": "cypress/e2e/test-isolation.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 17,
        "column": 4,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:29:5)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000,
      "timestamp": "Any.Number"
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
              "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:77:12)\\n    at eval (<anonymous>)"
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
              "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
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
      "body": "() => {\\n      cy.get('#text-target').type('!');\\n      cy.get('#text-target').should('have.value', 'abcdefghi!');\\n      cy.visit('cypress/fixtures/dom-with-browser-interactions.html');\\n      cy.wait(1000, {\\n        log: false\\n      });\\n      cy.get('#text-target').type('abc');\\n      cy.get('#text-target').should('have.value', 'abc');\\n    }",
      "type": "test",
      "wallClockStartedAt": "Any.ISODate",
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
        "relativeFile": "cypress/e2e/test-isolation.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 22,
        "column": 4,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:33:5)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000,
      "timestamp": "Any.Number"
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
              "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:77:12)\\n    at eval (<anonymous>)"
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
              "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
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
      "body": "() => {\\n      cy.get('#text-target').type('!');\\n      cy.get('#text-target').should('have.value', 'abc!');\\n    }",
      "type": "test",
      "wallClockStartedAt": "Any.ISODate",
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
        "relativeFile": "cypress/e2e/test-isolation.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 32,
        "column": 4,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:43:5)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000,
      "timestamp": "Any.Number"
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
              "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:77:12)\\n    at eval (<anonymous>)"
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
              "line": 38,
              "column": 2,
              "whitespace": "    ",
              "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:48:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
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
      "body": "() => {\\n      cy.visit('cypress/fixtures/dom-with-browser-interactions.html');\\n      cy.wait(1000, {\\n        log: false\\n      });\\n      cy.get('#text-target').type('abc');\\n      cy.get('#text-target').should('have.value', 'abc');\\n    }",
      "type": "test",
      "wallClockStartedAt": "Any.ISODate",
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
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:51:5)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000,
      "timestamp": "Any.Number"
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
              "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:77:12)\\n    at eval (<anonymous>)"
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
              "line": 38,
              "column": 2,
              "whitespace": "    ",
              "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:48:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
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
      "body": "() => {\\n      cy.visit('cypress/fixtures/dom-with-browser-interactions.html');\\n      cy.wait(1000, {\\n        log: false\\n      });\\n      cy.get('#text-target').type('def');\\n      cy.get('#text-target').should('have.value', 'def');\\n    }",
      "type": "test",
      "wallClockStartedAt": "Any.ISODate",
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
        "relativeFile": "cypress/e2e/test-isolation.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 46,
        "column": 4,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:59:5)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000,
      "timestamp": "Any.Number"
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
              "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:77:12)\\n    at eval (<anonymous>)"
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
              "line": 54,
              "column": 2,
              "whitespace": "    ",
              "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
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
      "body": "() => {\\n      cy.get('#text-target').type('abc');\\n      cy.get('#text-target').should('have.value', 'defabc');\\n    }",
      "type": "test",
      "wallClockStartedAt": "Any.ISODate",
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
        "relativeFile": "cypress/e2e/test-isolation.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 55,
        "column": 4,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:71:5)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000,
      "timestamp": "Any.Number"
    },
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {},
        "applied": "complete"
      },
      "id": "r3",
      "order": 1,
      "title": "has protocol events with shadow DOM selectors",
      "pending": false,
      "body": "() => {\\n    cy.visit('cypress/fixtures/shadow-dom.html');\\n    cy.get('#in-shadow', {\\n      includeShadowDom: true\\n    }).should('exist');\\n  }",
      "type": "test",
      "wallClockStartedAt": "Any.ISODate",
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/shadow-dom.cy.js",
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/shadow-dom.cy.js",
        "relativeFile": "cypress/e2e/shadow-dom.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 2,
        "column": 2,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/shadow-dom.cy.js:10:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000,
      "timestamp": "Any.Number"
    },
    {
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {},
        "applied": "complete"
      },
      "id": "r4",
      "order": 2,
      "title": "does not have cypress errors when visiting closed shadow roots",
      "pending": false,
      "body": "() => {\\n    cy.visit('cypress/fixtures/shadow-dom-closed.html');\\n    cy.get('#in-shadow', {\\n      includeShadowDom: true\\n    }).should('not.exist');\\n  }",
      "type": "test",
      "wallClockStartedAt": "Any.ISODate",
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/shadow-dom.cy.js",
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/shadow-dom.cy.js",
        "relativeFile": "cypress/e2e/shadow-dom.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 7,
        "column": 2,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/shadow-dom.cy.js:16:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000,
      "timestamp": "Any.Number"
    }
  ],
  "preAfterTest": [
    {
      "test": {
        "_cypressTestStatusInfo": {
          "strategy": "detect-flake-and-pass-on-threshold",
          "shouldAttemptsContinue": false,
          "attempts": 1,
          "outerStatus": "passed"
        },
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
        "duration": "Any.Number",
        "wallClockStartedAt": "Any.ISODate",
        "timings": {
          "lifecycle": "Any.Number",
          "before each": [
            {
              "hookId": "h1",
              "fnDuration": "Any.Number",
              "afterFnDuration": "Any.Number"
            }
          ],
          "test": {
            "fnDuration": "Any.Number",
            "afterFnDuration": "Any.Number"
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
          "stack": "Error\\n    at Suite.eval (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:16:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
        },
        "final": true,
        "currentRetry": 0,
        "retries": 0,
        "_slow": 10000
      },
      "options": {}
    },
    {
      "test": {
        "_cypressTestStatusInfo": {
          "strategy": "detect-flake-and-pass-on-threshold",
          "shouldAttemptsContinue": false,
          "attempts": 1,
          "outerStatus": "passed"
        },
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
                "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:77:12)\\n    at eval (<anonymous>)"
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
                "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
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
        "body": "() => {\\n      cy.visit('cypress/fixtures/dom-with-browser-interactions.html');\\n      cy.wait(1000, {\\n        log: false\\n      });\\n      cy.get('#text-target').type('abc');\\n      cy.get('#text-target').should('have.value', 'abc');\\n    }",
        "type": "test",
        "duration": "Any.Number",
        "wallClockStartedAt": "Any.ISODate",
        "timings": {
          "lifecycle": "Any.Number",
          "test": {
            "fnDuration": "Any.Number",
            "afterFnDuration": "Any.Number"
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
          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:17:5)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
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
        "_cypressTestStatusInfo": {
          "strategy": "detect-flake-and-pass-on-threshold",
          "shouldAttemptsContinue": false,
          "attempts": 1,
          "outerStatus": "passed"
        },
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
                "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:77:12)\\n    at eval (<anonymous>)"
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
                "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
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
        "body": "() => {\\n      cy.get('#text-target').type('def');\\n      cy.get('#text-target').should('have.value', 'abcdef');\\n    }",
        "type": "test",
        "duration": "Any.Number",
        "wallClockStartedAt": "Any.ISODate",
        "timings": {
          "lifecycle": "Any.Number",
          "test": {
            "fnDuration": "Any.Number",
            "afterFnDuration": "Any.Number"
          }
        },
        "file": null,
        "invocationDetails": {
          "function": "Suite.eval",
          "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
          "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
          "relativeFile": "cypress/e2e/test-isolation.cy.js",
          "absoluteFile": "/path/to/absoluteFile",
          "line": 12,
          "column": 4,
          "whitespace": "    ",
          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:25:5)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
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
        "_cypressTestStatusInfo": {
          "strategy": "detect-flake-and-pass-on-threshold",
          "shouldAttemptsContinue": false,
          "attempts": 1,
          "outerStatus": "passed"
        },
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
                "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:77:12)\\n    at eval (<anonymous>)"
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
                "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
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
        "body": "() => {\\n      cy.get('#text-target').type('ghi');\\n      cy.get('#text-target').should('have.value', 'abcdefghi');\\n    }",
        "type": "test",
        "duration": "Any.Number",
        "wallClockStartedAt": "Any.ISODate",
        "timings": {
          "lifecycle": "Any.Number",
          "test": {
            "fnDuration": "Any.Number",
            "afterFnDuration": "Any.Number"
          }
        },
        "file": null,
        "invocationDetails": {
          "function": "Suite.eval",
          "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
          "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
          "relativeFile": "cypress/e2e/test-isolation.cy.js",
          "absoluteFile": "/path/to/absoluteFile",
          "line": 17,
          "column": 4,
          "whitespace": "    ",
          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:29:5)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
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
        "_cypressTestStatusInfo": {
          "strategy": "detect-flake-and-pass-on-threshold",
          "shouldAttemptsContinue": false,
          "attempts": 1,
          "outerStatus": "passed"
        },
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
                "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:77:12)\\n    at eval (<anonymous>)"
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
                "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
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
        "body": "() => {\\n      cy.get('#text-target').type('!');\\n      cy.get('#text-target').should('have.value', 'abcdefghi!');\\n      cy.visit('cypress/fixtures/dom-with-browser-interactions.html');\\n      cy.wait(1000, {\\n        log: false\\n      });\\n      cy.get('#text-target').type('abc');\\n      cy.get('#text-target').should('have.value', 'abc');\\n    }",
        "type": "test",
        "duration": "Any.Number",
        "wallClockStartedAt": "Any.ISODate",
        "timings": {
          "lifecycle": "Any.Number",
          "test": {
            "fnDuration": "Any.Number",
            "afterFnDuration": "Any.Number"
          }
        },
        "file": null,
        "invocationDetails": {
          "function": "Suite.eval",
          "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
          "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
          "relativeFile": "cypress/e2e/test-isolation.cy.js",
          "absoluteFile": "/path/to/absoluteFile",
          "line": 22,
          "column": 4,
          "whitespace": "    ",
          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:33:5)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
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
        "_cypressTestStatusInfo": {
          "strategy": "detect-flake-and-pass-on-threshold",
          "shouldAttemptsContinue": false,
          "attempts": 1,
          "outerStatus": "passed"
        },
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
                "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:77:12)\\n    at eval (<anonymous>)"
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
                "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
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
        "body": "() => {\\n      cy.get('#text-target').type('!');\\n      cy.get('#text-target').should('have.value', 'abc!');\\n    }",
        "type": "test",
        "duration": "Any.Number",
        "wallClockStartedAt": "Any.ISODate",
        "timings": {
          "lifecycle": "Any.Number",
          "test": {
            "fnDuration": "Any.Number",
            "afterFnDuration": "Any.Number"
          }
        },
        "file": null,
        "invocationDetails": {
          "function": "Suite.eval",
          "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
          "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
          "relativeFile": "cypress/e2e/test-isolation.cy.js",
          "absoluteFile": "/path/to/absoluteFile",
          "line": 32,
          "column": 4,
          "whitespace": "    ",
          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:43:5)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
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
        "_cypressTestStatusInfo": {
          "strategy": "detect-flake-and-pass-on-threshold",
          "shouldAttemptsContinue": false,
          "attempts": 1,
          "outerStatus": "passed"
        },
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
                "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:77:12)\\n    at eval (<anonymous>)"
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
                "line": 38,
                "column": 2,
                "whitespace": "    ",
                "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:48:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
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
        "body": "() => {\\n      cy.visit('cypress/fixtures/dom-with-browser-interactions.html');\\n      cy.wait(1000, {\\n        log: false\\n      });\\n      cy.get('#text-target').type('abc');\\n      cy.get('#text-target').should('have.value', 'abc');\\n    }",
        "type": "test",
        "duration": "Any.Number",
        "wallClockStartedAt": "Any.ISODate",
        "timings": {
          "lifecycle": "Any.Number",
          "test": {
            "fnDuration": "Any.Number",
            "afterFnDuration": "Any.Number"
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
          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:51:5)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
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
        "_cypressTestStatusInfo": {
          "strategy": "detect-flake-and-pass-on-threshold",
          "shouldAttemptsContinue": false,
          "attempts": 1,
          "outerStatus": "passed"
        },
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
                "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:77:12)\\n    at eval (<anonymous>)"
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
                "line": 38,
                "column": 2,
                "whitespace": "    ",
                "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:48:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
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
        "body": "() => {\\n      cy.visit('cypress/fixtures/dom-with-browser-interactions.html');\\n      cy.wait(1000, {\\n        log: false\\n      });\\n      cy.get('#text-target').type('def');\\n      cy.get('#text-target').should('have.value', 'def');\\n    }",
        "type": "test",
        "duration": "Any.Number",
        "wallClockStartedAt": "Any.ISODate",
        "timings": {
          "lifecycle": "Any.Number",
          "test": {
            "fnDuration": "Any.Number",
            "afterFnDuration": "Any.Number"
          }
        },
        "file": null,
        "invocationDetails": {
          "function": "Suite.eval",
          "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
          "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
          "relativeFile": "cypress/e2e/test-isolation.cy.js",
          "absoluteFile": "/path/to/absoluteFile",
          "line": 46,
          "column": 4,
          "whitespace": "    ",
          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:59:5)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
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
        "_cypressTestStatusInfo": {
          "strategy": "detect-flake-and-pass-on-threshold",
          "shouldAttemptsContinue": false,
          "attempts": 1,
          "outerStatus": "passed"
        },
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
                "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:77:12)\\n    at eval (<anonymous>)"
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
                "line": 54,
                "column": 2,
                "whitespace": "    ",
                "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
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
        "body": "() => {\\n      cy.get('#text-target').type('abc');\\n      cy.get('#text-target').should('have.value', 'defabc');\\n    }",
        "type": "test",
        "duration": "Any.Number",
        "wallClockStartedAt": "Any.ISODate",
        "timings": {
          "lifecycle": "Any.Number",
          "test": {
            "fnDuration": "Any.Number",
            "afterFnDuration": "Any.Number"
          }
        },
        "file": null,
        "invocationDetails": {
          "function": "Suite.eval",
          "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
          "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
          "relativeFile": "cypress/e2e/test-isolation.cy.js",
          "absoluteFile": "/path/to/absoluteFile",
          "line": 55,
          "column": 4,
          "whitespace": "    ",
          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:71:5)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
        },
        "final": true,
        "currentRetry": 0,
        "retries": 0,
        "_slow": 10000
      },
      "options": {}
    },
    {
      "test": {
        "_cypressTestStatusInfo": {
          "strategy": "detect-flake-and-pass-on-threshold",
          "shouldAttemptsContinue": false,
          "attempts": 1,
          "outerStatus": "passed"
        },
        "_testConfig": {
          "testConfigList": [],
          "unverifiedTestConfig": {},
          "applied": "complete"
        },
        "id": "r3",
        "order": 1,
        "title": "has protocol events with shadow DOM selectors",
        "state": "passed",
        "pending": false,
        "body": "() => {\\n    cy.visit('cypress/fixtures/shadow-dom.html');\\n    cy.get('#in-shadow', {\\n      includeShadowDom: true\\n    }).should('exist');\\n  }",
        "type": "test",
        "duration": "Any.Number",
        "wallClockStartedAt": "Any.ISODate",
        "timings": {
          "lifecycle": "Any.Number",
          "test": {
            "fnDuration": "Any.Number",
            "afterFnDuration": "Any.Number"
          }
        },
        "file": null,
        "invocationDetails": {
          "function": "Suite.eval",
          "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/shadow-dom.cy.js",
          "originalFile": "webpack://protocol-sample-project/./cypress/e2e/shadow-dom.cy.js",
          "relativeFile": "cypress/e2e/shadow-dom.cy.js",
          "absoluteFile": "/path/to/absoluteFile",
          "line": 2,
          "column": 2,
          "whitespace": "    ",
          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/shadow-dom.cy.js:10:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
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
        "_cypressTestStatusInfo": {
          "strategy": "detect-flake-and-pass-on-threshold",
          "shouldAttemptsContinue": false,
          "attempts": 1,
          "outerStatus": "passed"
        },
        "_testConfig": {
          "testConfigList": [],
          "unverifiedTestConfig": {},
          "applied": "complete"
        },
        "id": "r4",
        "order": 2,
        "title": "does not have cypress errors when visiting closed shadow roots",
        "state": "passed",
        "pending": false,
        "body": "() => {\\n    cy.visit('cypress/fixtures/shadow-dom-closed.html');\\n    cy.get('#in-shadow', {\\n      includeShadowDom: true\\n    }).should('not.exist');\\n  }",
        "type": "test",
        "duration": "Any.Number",
        "wallClockStartedAt": "Any.ISODate",
        "timings": {
          "lifecycle": "Any.Number",
          "test": {
            "fnDuration": "Any.Number",
            "afterFnDuration": "Any.Number"
          }
        },
        "file": null,
        "invocationDetails": {
          "function": "Suite.eval",
          "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/shadow-dom.cy.js",
          "originalFile": "webpack://protocol-sample-project/./cypress/e2e/shadow-dom.cy.js",
          "relativeFile": "cypress/e2e/shadow-dom.cy.js",
          "absoluteFile": "/path/to/absoluteFile",
          "line": 7,
          "column": 2,
          "whitespace": "    ",
          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/shadow-dom.cy.js:16:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
        },
        "final": true,
        "currentRetry": 0,
        "retries": 0,
        "_slow": 10000
      },
      "options": {}
    }
  ],
  "afterTest": [
    {
      "_cypressTestStatusInfo": {
        "strategy": "detect-flake-and-pass-on-threshold",
        "shouldAttemptsContinue": false,
        "attempts": 1,
        "outerStatus": "passed"
      },
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
      "duration": "Any.Number",
      "wallClockStartedAt": "Any.ISODate",
      "wallClockDuration": "Any.Number",
      "timings": {
        "lifecycle": "Any.Number",
        "before each": [
          {
            "hookId": "h1",
            "fnDuration": "Any.Number",
            "afterFnDuration": "Any.Number"
          }
        ],
        "test": {
          "fnDuration": "Any.Number",
          "afterFnDuration": "Any.Number"
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
        "stack": "Error\\n    at Suite.eval (http://localhost:3131/__cypress/tests?p=cypress/e2e/protocol.cy.js:16:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
      },
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    },
    {
      "_cypressTestStatusInfo": {
        "strategy": "detect-flake-and-pass-on-threshold",
        "shouldAttemptsContinue": false,
        "attempts": 1,
        "outerStatus": "passed"
      },
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
              "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:77:12)\\n    at eval (<anonymous>)"
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
              "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
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
      "body": "() => {\\n      cy.visit('cypress/fixtures/dom-with-browser-interactions.html');\\n      cy.wait(1000, {\\n        log: false\\n      });\\n      cy.get('#text-target').type('abc');\\n      cy.get('#text-target').should('have.value', 'abc');\\n    }",
      "type": "test",
      "duration": "Any.Number",
      "wallClockStartedAt": "Any.ISODate",
      "wallClockDuration": "Any.Number",
      "timings": {
        "lifecycle": "Any.Number",
        "test": {
          "fnDuration": "Any.Number",
          "afterFnDuration": "Any.Number"
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
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:17:5)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
      },
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    },
    {
      "_cypressTestStatusInfo": {
        "strategy": "detect-flake-and-pass-on-threshold",
        "shouldAttemptsContinue": false,
        "attempts": 1,
        "outerStatus": "passed"
      },
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
              "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:77:12)\\n    at eval (<anonymous>)"
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
              "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
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
      "body": "() => {\\n      cy.get('#text-target').type('def');\\n      cy.get('#text-target').should('have.value', 'abcdef');\\n    }",
      "type": "test",
      "duration": "Any.Number",
      "wallClockStartedAt": "Any.ISODate",
      "wallClockDuration": "Any.Number",
      "timings": {
        "lifecycle": "Any.Number",
        "test": {
          "fnDuration": "Any.Number",
          "afterFnDuration": "Any.Number"
        }
      },
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
        "relativeFile": "cypress/e2e/test-isolation.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 12,
        "column": 4,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:25:5)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
      },
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    },
    {
      "_cypressTestStatusInfo": {
        "strategy": "detect-flake-and-pass-on-threshold",
        "shouldAttemptsContinue": false,
        "attempts": 1,
        "outerStatus": "passed"
      },
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
              "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:77:12)\\n    at eval (<anonymous>)"
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
              "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
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
      "body": "() => {\\n      cy.get('#text-target').type('ghi');\\n      cy.get('#text-target').should('have.value', 'abcdefghi');\\n    }",
      "type": "test",
      "duration": "Any.Number",
      "wallClockStartedAt": "Any.ISODate",
      "wallClockDuration": "Any.Number",
      "timings": {
        "lifecycle": "Any.Number",
        "test": {
          "fnDuration": "Any.Number",
          "afterFnDuration": "Any.Number"
        }
      },
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
        "relativeFile": "cypress/e2e/test-isolation.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 17,
        "column": 4,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:29:5)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
      },
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    },
    {
      "_cypressTestStatusInfo": {
        "strategy": "detect-flake-and-pass-on-threshold",
        "shouldAttemptsContinue": false,
        "attempts": 1,
        "outerStatus": "passed"
      },
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
              "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:77:12)\\n    at eval (<anonymous>)"
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
              "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
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
      "body": "() => {\\n      cy.get('#text-target').type('!');\\n      cy.get('#text-target').should('have.value', 'abcdefghi!');\\n      cy.visit('cypress/fixtures/dom-with-browser-interactions.html');\\n      cy.wait(1000, {\\n        log: false\\n      });\\n      cy.get('#text-target').type('abc');\\n      cy.get('#text-target').should('have.value', 'abc');\\n    }",
      "type": "test",
      "duration": "Any.Number",
      "wallClockStartedAt": "Any.ISODate",
      "wallClockDuration": "Any.Number",
      "timings": {
        "lifecycle": "Any.Number",
        "test": {
          "fnDuration": "Any.Number",
          "afterFnDuration": "Any.Number"
        }
      },
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
        "relativeFile": "cypress/e2e/test-isolation.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 22,
        "column": 4,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:33:5)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
      },
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    },
    {
      "_cypressTestStatusInfo": {
        "strategy": "detect-flake-and-pass-on-threshold",
        "shouldAttemptsContinue": false,
        "attempts": 1,
        "outerStatus": "passed"
      },
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
              "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:77:12)\\n    at eval (<anonymous>)"
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
              "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
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
      "body": "() => {\\n      cy.get('#text-target').type('!');\\n      cy.get('#text-target').should('have.value', 'abc!');\\n    }",
      "type": "test",
      "duration": "Any.Number",
      "wallClockStartedAt": "Any.ISODate",
      "wallClockDuration": "Any.Number",
      "timings": {
        "lifecycle": "Any.Number",
        "test": {
          "fnDuration": "Any.Number",
          "afterFnDuration": "Any.Number"
        }
      },
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
        "relativeFile": "cypress/e2e/test-isolation.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 32,
        "column": 4,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:43:5)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
      },
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    },
    {
      "_cypressTestStatusInfo": {
        "strategy": "detect-flake-and-pass-on-threshold",
        "shouldAttemptsContinue": false,
        "attempts": 1,
        "outerStatus": "passed"
      },
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
              "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:77:12)\\n    at eval (<anonymous>)"
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
              "line": 38,
              "column": 2,
              "whitespace": "    ",
              "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:48:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
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
      "body": "() => {\\n      cy.visit('cypress/fixtures/dom-with-browser-interactions.html');\\n      cy.wait(1000, {\\n        log: false\\n      });\\n      cy.get('#text-target').type('abc');\\n      cy.get('#text-target').should('have.value', 'abc');\\n    }",
      "type": "test",
      "duration": "Any.Number",
      "wallClockStartedAt": "Any.ISODate",
      "wallClockDuration": "Any.Number",
      "timings": {
        "lifecycle": "Any.Number",
        "test": {
          "fnDuration": "Any.Number",
          "afterFnDuration": "Any.Number"
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
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:51:5)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
      },
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    },
    {
      "_cypressTestStatusInfo": {
        "strategy": "detect-flake-and-pass-on-threshold",
        "shouldAttemptsContinue": false,
        "attempts": 1,
        "outerStatus": "passed"
      },
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
              "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:77:12)\\n    at eval (<anonymous>)"
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
              "line": 38,
              "column": 2,
              "whitespace": "    ",
              "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:48:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
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
      "body": "() => {\\n      cy.visit('cypress/fixtures/dom-with-browser-interactions.html');\\n      cy.wait(1000, {\\n        log: false\\n      });\\n      cy.get('#text-target').type('def');\\n      cy.get('#text-target').should('have.value', 'def');\\n    }",
      "type": "test",
      "duration": "Any.Number",
      "wallClockStartedAt": "Any.ISODate",
      "wallClockDuration": "Any.Number",
      "timings": {
        "lifecycle": "Any.Number",
        "test": {
          "fnDuration": "Any.Number",
          "afterFnDuration": "Any.Number"
        }
      },
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
        "relativeFile": "cypress/e2e/test-isolation.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 46,
        "column": 4,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:59:5)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
      },
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    },
    {
      "_cypressTestStatusInfo": {
        "strategy": "detect-flake-and-pass-on-threshold",
        "shouldAttemptsContinue": false,
        "attempts": 1,
        "outerStatus": "passed"
      },
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
              "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:77:12)\\n    at eval (<anonymous>)"
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
              "line": 54,
              "column": 2,
              "whitespace": "    ",
              "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
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
      "body": "() => {\\n      cy.get('#text-target').type('abc');\\n      cy.get('#text-target').should('have.value', 'defabc');\\n    }",
      "type": "test",
      "duration": "Any.Number",
      "wallClockStartedAt": "Any.ISODate",
      "wallClockDuration": "Any.Number",
      "timings": {
        "lifecycle": "Any.Number",
        "test": {
          "fnDuration": "Any.Number",
          "afterFnDuration": "Any.Number"
        }
      },
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
        "relativeFile": "cypress/e2e/test-isolation.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 55,
        "column": 4,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:71:5)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
      },
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    },
    {
      "_cypressTestStatusInfo": {
        "strategy": "detect-flake-and-pass-on-threshold",
        "shouldAttemptsContinue": false,
        "attempts": 1,
        "outerStatus": "passed"
      },
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {},
        "applied": "complete"
      },
      "id": "r3",
      "order": 1,
      "title": "has protocol events with shadow DOM selectors",
      "state": "passed",
      "pending": false,
      "body": "() => {\\n    cy.visit('cypress/fixtures/shadow-dom.html');\\n    cy.get('#in-shadow', {\\n      includeShadowDom: true\\n    }).should('exist');\\n  }",
      "type": "test",
      "duration": "Any.Number",
      "wallClockStartedAt": "Any.ISODate",
      "wallClockDuration": "Any.Number",
      "timings": {
        "lifecycle": "Any.Number",
        "test": {
          "fnDuration": "Any.Number",
          "afterFnDuration": "Any.Number"
        }
      },
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/shadow-dom.cy.js",
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/shadow-dom.cy.js",
        "relativeFile": "cypress/e2e/shadow-dom.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 2,
        "column": 2,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/shadow-dom.cy.js:10:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
      },
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 10000
    },
    {
      "_cypressTestStatusInfo": {
        "strategy": "detect-flake-and-pass-on-threshold",
        "shouldAttemptsContinue": false,
        "attempts": 1,
        "outerStatus": "passed"
      },
      "_testConfig": {
        "testConfigList": [],
        "unverifiedTestConfig": {},
        "applied": "complete"
      },
      "id": "r4",
      "order": 2,
      "title": "does not have cypress errors when visiting closed shadow roots",
      "state": "passed",
      "pending": false,
      "body": "() => {\\n    cy.visit('cypress/fixtures/shadow-dom-closed.html');\\n    cy.get('#in-shadow', {\\n      includeShadowDom: true\\n    }).should('not.exist');\\n  }",
      "type": "test",
      "duration": "Any.Number",
      "wallClockStartedAt": "Any.ISODate",
      "wallClockDuration": "Any.Number",
      "timings": {
        "lifecycle": "Any.Number",
        "test": {
          "fnDuration": "Any.Number",
          "afterFnDuration": "Any.Number"
        }
      },
      "file": null,
      "invocationDetails": {
        "function": "Suite.eval",
        "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/shadow-dom.cy.js",
        "originalFile": "webpack://protocol-sample-project/./cypress/e2e/shadow-dom.cy.js",
        "relativeFile": "cypress/e2e/shadow-dom.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 7,
        "column": 2,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/shadow-dom.cy.js:16:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
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
                "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:12:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
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
                "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/protocol.cy.js:16:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
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
            "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:77:12)\\n    at eval (<anonymous>)"
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
                "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
              },
              "retries": -1,
              "_slow": 10000,
              "hooks": [],
              "tests": [
                {
                  "id": "r4",
                  "title": "test 1",
                  "pending": false,
                  "body": "() => {\\n      cy.visit('cypress/fixtures/dom-with-browser-interactions.html');\\n      cy.wait(1000, {\\n        log: false\\n      });\\n      cy.get('#text-target').type('abc');\\n      cy.get('#text-target').should('have.value', 'abc');\\n    }",
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
                    "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:17:5)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
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
                          "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:77:12)\\n    at eval (<anonymous>)"
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
                          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
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
                  "body": "() => {\\n      cy.get('#text-target').type('def');\\n      cy.get('#text-target').should('have.value', 'abcdef');\\n    }",
                  "type": "test",
                  "file": null,
                  "invocationDetails": {
                    "function": "Suite.eval",
                    "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                    "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                    "relativeFile": "cypress/e2e/test-isolation.cy.js",
                    "absoluteFile": "/path/to/absoluteFile",
                    "line": 12,
                    "column": 4,
                    "whitespace": "    ",
                    "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:25:5)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
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
                          "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:77:12)\\n    at eval (<anonymous>)"
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
                          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
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
                  "body": "() => {\\n      cy.get('#text-target').type('ghi');\\n      cy.get('#text-target').should('have.value', 'abcdefghi');\\n    }",
                  "type": "test",
                  "file": null,
                  "invocationDetails": {
                    "function": "Suite.eval",
                    "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                    "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                    "relativeFile": "cypress/e2e/test-isolation.cy.js",
                    "absoluteFile": "/path/to/absoluteFile",
                    "line": 17,
                    "column": 4,
                    "whitespace": "    ",
                    "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:29:5)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
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
                          "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:77:12)\\n    at eval (<anonymous>)"
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
                          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
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
                  "body": "() => {\\n      cy.get('#text-target').type('!');\\n      cy.get('#text-target').should('have.value', 'abcdefghi!');\\n      cy.visit('cypress/fixtures/dom-with-browser-interactions.html');\\n      cy.wait(1000, {\\n        log: false\\n      });\\n      cy.get('#text-target').type('abc');\\n      cy.get('#text-target').should('have.value', 'abc');\\n    }",
                  "type": "test",
                  "file": null,
                  "invocationDetails": {
                    "function": "Suite.eval",
                    "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                    "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                    "relativeFile": "cypress/e2e/test-isolation.cy.js",
                    "absoluteFile": "/path/to/absoluteFile",
                    "line": 22,
                    "column": 4,
                    "whitespace": "    ",
                    "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:33:5)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
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
                          "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:77:12)\\n    at eval (<anonymous>)"
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
                          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
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
                  "body": "() => {\\n      cy.get('#text-target').type('!');\\n      cy.get('#text-target').should('have.value', 'abc!');\\n    }",
                  "type": "test",
                  "file": null,
                  "invocationDetails": {
                    "function": "Suite.eval",
                    "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                    "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                    "relativeFile": "cypress/e2e/test-isolation.cy.js",
                    "absoluteFile": "/path/to/absoluteFile",
                    "line": 32,
                    "column": 4,
                    "whitespace": "    ",
                    "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:43:5)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
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
                          "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:77:12)\\n    at eval (<anonymous>)"
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
                          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:14:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
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
                "line": 38,
                "column": 2,
                "whitespace": "    ",
                "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:48:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
              },
              "retries": -1,
              "_slow": 10000,
              "hooks": [],
              "tests": [
                {
                  "id": "r10",
                  "title": "test 6",
                  "pending": false,
                  "body": "() => {\\n      cy.visit('cypress/fixtures/dom-with-browser-interactions.html');\\n      cy.wait(1000, {\\n        log: false\\n      });\\n      cy.get('#text-target').type('abc');\\n      cy.get('#text-target').should('have.value', 'abc');\\n    }",
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
                    "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:51:5)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
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
                          "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:77:12)\\n    at eval (<anonymous>)"
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
                          "line": 38,
                          "column": 2,
                          "whitespace": "    ",
                          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:48:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
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
                  "body": "() => {\\n      cy.visit('cypress/fixtures/dom-with-browser-interactions.html');\\n      cy.wait(1000, {\\n        log: false\\n      });\\n      cy.get('#text-target').type('def');\\n      cy.get('#text-target').should('have.value', 'def');\\n    }",
                  "type": "test",
                  "file": null,
                  "invocationDetails": {
                    "function": "Suite.eval",
                    "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                    "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                    "relativeFile": "cypress/e2e/test-isolation.cy.js",
                    "absoluteFile": "/path/to/absoluteFile",
                    "line": 46,
                    "column": 4,
                    "whitespace": "    ",
                    "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:59:5)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
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
                          "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:77:12)\\n    at eval (<anonymous>)"
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
                          "line": 38,
                          "column": 2,
                          "whitespace": "    ",
                          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:48:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
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
                "line": 54,
                "column": 2,
                "whitespace": "    ",
                "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
              },
              "retries": -1,
              "_slow": 10000,
              "hooks": [],
              "tests": [
                {
                  "id": "r13",
                  "title": "test 8",
                  "pending": false,
                  "body": "() => {\\n      cy.get('#text-target').type('abc');\\n      cy.get('#text-target').should('have.value', 'defabc');\\n    }",
                  "type": "test",
                  "file": null,
                  "invocationDetails": {
                    "function": "Suite.eval",
                    "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js",
                    "originalFile": "webpack://protocol-sample-project/./cypress/e2e/test-isolation.cy.js",
                    "relativeFile": "cypress/e2e/test-isolation.cy.js",
                    "absoluteFile": "/path/to/absoluteFile",
                    "line": 55,
                    "column": 4,
                    "whitespace": "    ",
                    "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:71:5)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:185:16)"
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
                          "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:11:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:77:12)\\n    at eval (<anonymous>)"
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
                          "line": 54,
                          "column": 2,
                          "whitespace": "    ",
                          "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/test-isolation.cy.js:68:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)"
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
    },
    {
      "id": "r1",
      "title": "",
      "root": true,
      "pending": false,
      "type": "suite",
      "file": "cypress/e2e/shadow-dom.cy.js",
      "retries": -1,
      "_slow": 10000,
      "hooks": [],
      "tests": [],
      "suites": [
        {
          "id": "r2",
          "title": "protocol events w/ shadow DOM",
          "root": false,
          "pending": false,
          "type": "suite",
          "file": null,
          "invocationDetails": {
            "function": "eval",
            "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/shadow-dom.cy.js",
            "originalFile": "webpack://protocol-sample-project/./cypress/e2e/shadow-dom.cy.js",
            "relativeFile": "cypress/e2e/shadow-dom.cy.js",
            "absoluteFile": "/path/to/absoluteFile",
            "line": 1,
            "column": 0,
            "whitespace": "    ",
            "stack": "Error\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/shadow-dom.cy.js:9:1)\\n    at eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/shadow-dom.cy.js:23:12)\\n    at eval (<anonymous>)"
          },
          "retries": -1,
          "_slow": 10000,
          "hooks": [],
          "tests": [
            {
              "id": "r3",
              "title": "has protocol events with shadow DOM selectors",
              "pending": false,
              "body": "() => {\\n    cy.visit('cypress/fixtures/shadow-dom.html');\\n    cy.get('#in-shadow', {\\n      includeShadowDom: true\\n    }).should('exist');\\n  }",
              "type": "test",
              "file": null,
              "invocationDetails": {
                "function": "Suite.eval",
                "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/shadow-dom.cy.js",
                "originalFile": "webpack://protocol-sample-project/./cypress/e2e/shadow-dom.cy.js",
                "relativeFile": "cypress/e2e/shadow-dom.cy.js",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 2,
                "column": 2,
                "whitespace": "    ",
                "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/shadow-dom.cy.js:10:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
              },
              "currentRetry": 0,
              "retries": -1,
              "_slow": 10000,
              "hooks": [],
              "_testConfig": {
                "testConfigList": [],
                "unverifiedTestConfig": {}
              },
              "_titlePath": [
                "protocol events w/ shadow DOM",
                "has protocol events with shadow DOM selectors"
              ]
            },
            {
              "id": "r4",
              "title": "does not have cypress errors when visiting closed shadow roots",
              "pending": false,
              "body": "() => {\\n    cy.visit('cypress/fixtures/shadow-dom-closed.html');\\n    cy.get('#in-shadow', {\\n      includeShadowDom: true\\n    }).should('not.exist');\\n  }",
              "type": "test",
              "file": null,
              "invocationDetails": {
                "function": "Suite.eval",
                "fileUrl": "http://localhost:2121/__cypress/tests?p=cypress/e2e/shadow-dom.cy.js",
                "originalFile": "webpack://protocol-sample-project/./cypress/e2e/shadow-dom.cy.js",
                "relativeFile": "cypress/e2e/shadow-dom.cy.js",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 7,
                "column": 2,
                "whitespace": "    ",
                "stack": "Error\\n    at Suite.eval (http://localhost:2121/__cypress/tests?p=cypress/e2e/shadow-dom.cy.js:16:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
              },
              "currentRetry": 0,
              "retries": -1,
              "_slow": 10000,
              "hooks": [],
              "_testConfig": {
                "testConfigList": [],
                "unverifiedTestConfig": {}
              },
              "_titlePath": [
                "protocol events w/ shadow DOM",
                "does not have cypress errors when visiting closed shadow roots"
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
    true,
    true
  ],
  "commandLogAdded": [
    {
      "id": "log-http://localhost:3131-1",
      "event": false,
      "hookId": "h1",
      "instrument": "command",
      "hidden": false,
      "message": "http://localhost:3131/index.html",
      "name": "visit",
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 60000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:3131-2",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
      "message": "300, 200",
      "name": "viewport",
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:3131/index.html",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:3131-3",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
      "message": "hi",
      "name": "contains",
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 4000,
      "type": "child",
      "url": "http://localhost:3131/index.html",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:3131-4",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:3131-5",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
      "message": "http://foobar.com",
      "name": "origin",
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:3131/index.html",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://foobar.com-6",
      "event": false,
      "groupLevel": 1,
      "hookId": "r3",
      "instrument": "command",
      "group": "log-http://localhost:3131-5",
      "hidden": false,
      "message": "400, 500",
      "name": "viewport",
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-1",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
      "message": "cypress/fixtures/dom-with-browser-interactions.html",
      "name": "visit",
      "renderProps": {},
      "state": "pending",
      "testId": "r4",
      "timeout": 60000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-3",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r4",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-4",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
      "message": "abc",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r4",
      "timeout": 4000,
      "type": "child",
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-5",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r4",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-6",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
      "message": "expected **<input#text-target>** to have value **abc**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r4",
      "timeout": 0,
      "type": "child",
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-7",
      "event": false,
      "hookId": "r5",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r5",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-8",
      "event": false,
      "hookId": "r5",
      "instrument": "command",
      "hidden": false,
      "message": "def",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r5",
      "timeout": 4000,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-9",
      "event": false,
      "hookId": "r5",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r5",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-10",
      "event": false,
      "hookId": "r5",
      "instrument": "command",
      "hidden": false,
      "message": "expected **<input#text-target>** to have value **abcdef**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r5",
      "timeout": 0,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-11",
      "event": false,
      "hookId": "r6",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r6",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-12",
      "event": false,
      "hookId": "r6",
      "instrument": "command",
      "hidden": false,
      "message": "ghi",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r6",
      "timeout": 4000,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-13",
      "event": false,
      "hookId": "r6",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r6",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-14",
      "event": false,
      "hookId": "r6",
      "instrument": "command",
      "hidden": false,
      "message": "expected **<input#text-target>** to have value **abcdefghi**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r6",
      "timeout": 0,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-15",
      "event": false,
      "hookId": "r7",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r7",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-16",
      "event": false,
      "hookId": "r7",
      "instrument": "command",
      "hidden": false,
      "message": "!",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r7",
      "timeout": 4000,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-17",
      "event": false,
      "hookId": "r7",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r7",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-18",
      "event": false,
      "hookId": "r7",
      "instrument": "command",
      "hidden": false,
      "message": "expected **<input#text-target>** to have value **abcdefghi!**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r7",
      "timeout": 0,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-19",
      "event": false,
      "hookId": "r7",
      "instrument": "command",
      "hidden": false,
      "message": "cypress/fixtures/dom-with-browser-interactions.html",
      "name": "visit",
      "renderProps": {},
      "state": "pending",
      "testId": "r7",
      "timeout": 60000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-21",
      "event": false,
      "hookId": "r7",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r7",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-22",
      "event": false,
      "hookId": "r7",
      "instrument": "command",
      "hidden": false,
      "message": "abc",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r7",
      "timeout": 4000,
      "type": "child",
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-23",
      "event": false,
      "hookId": "r7",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r7",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-24",
      "event": false,
      "hookId": "r7",
      "instrument": "command",
      "hidden": false,
      "message": "expected **<input#text-target>** to have value **abc**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r7",
      "timeout": 0,
      "type": "child",
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-25",
      "event": false,
      "hookId": "r8",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r8",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-26",
      "event": false,
      "hookId": "r8",
      "instrument": "command",
      "hidden": false,
      "message": "!",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r8",
      "timeout": 4000,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-27",
      "event": false,
      "hookId": "r8",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r8",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-28",
      "event": false,
      "hookId": "r8",
      "instrument": "command",
      "hidden": false,
      "message": "expected **<input#text-target>** to have value **abc!**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r8",
      "timeout": 0,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-29",
      "event": false,
      "hookId": "r10",
      "instrument": "command",
      "hidden": false,
      "message": "cypress/fixtures/dom-with-browser-interactions.html",
      "name": "visit",
      "renderProps": {},
      "state": "pending",
      "testId": "r10",
      "timeout": 60000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-31",
      "event": false,
      "hookId": "r10",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r10",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-32",
      "event": false,
      "hookId": "r10",
      "instrument": "command",
      "hidden": false,
      "message": "abc",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r10",
      "timeout": 4000,
      "type": "child",
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-33",
      "event": false,
      "hookId": "r10",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r10",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-34",
      "event": false,
      "hookId": "r10",
      "instrument": "command",
      "hidden": false,
      "message": "expected **<input#text-target>** to have value **abc**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r10",
      "timeout": 0,
      "type": "child",
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-35",
      "event": false,
      "hookId": "r11",
      "instrument": "command",
      "hidden": false,
      "message": "cypress/fixtures/dom-with-browser-interactions.html",
      "name": "visit",
      "renderProps": {},
      "state": "pending",
      "testId": "r11",
      "timeout": 60000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-37",
      "event": false,
      "hookId": "r11",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r11",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-38",
      "event": false,
      "hookId": "r11",
      "instrument": "command",
      "hidden": false,
      "message": "def",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r11",
      "timeout": 4000,
      "type": "child",
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-39",
      "event": false,
      "hookId": "r11",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r11",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-40",
      "event": false,
      "hookId": "r11",
      "instrument": "command",
      "hidden": false,
      "message": "expected **<input#text-target>** to have value **def**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r11",
      "timeout": 0,
      "type": "child",
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-41",
      "event": false,
      "hookId": "r13",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r13",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-42",
      "event": false,
      "hookId": "r13",
      "instrument": "command",
      "hidden": false,
      "message": "abc",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r13",
      "timeout": 4000,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-43",
      "event": false,
      "hookId": "r13",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r13",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-44",
      "event": false,
      "hookId": "r13",
      "instrument": "command",
      "hidden": false,
      "message": "expected **<input#text-target>** to have value **defabc**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r13",
      "timeout": 0,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-1",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
      "message": "cypress/fixtures/shadow-dom.html",
      "name": "visit",
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 60000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-2",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
      "message": "#in-shadow",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:2121/cypress/fixtures/shadow-dom.html",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-3",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
      "message": "expected **<div#in-shadow>** to exist in the DOM",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 0,
      "type": "child",
      "url": "http://localhost:2121/cypress/fixtures/shadow-dom.html",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-4",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
      "message": "cypress/fixtures/shadow-dom-closed.html",
      "name": "visit",
      "renderProps": {},
      "state": "pending",
      "testId": "r4",
      "timeout": 60000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-5",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
      "message": "#in-shadow",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r4",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:2121/cypress/fixtures/shadow-dom-closed.html",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-6",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
      "message": "expected **#in-shadow** not to exist in the DOM",
      "name": "assert",
      "renderProps": {},
      "state": "pending",
      "testId": "r4",
      "timeout": 0,
      "type": "child",
      "url": "http://localhost:2121/cypress/fixtures/shadow-dom-closed.html",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    }
  ],
  "commandLogChanged": [
    {
      "id": "log-http://foobar.com-6",
      "event": false,
      "groupLevel": 1,
      "hookId": "r3",
      "instrument": "command",
      "group": "log-http://localhost:3131-5",
      "hidden": false,
      "message": "400, 500",
      "name": "viewport",
      "renderProps": {},
      "state": "passed",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-1",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
      "message": "cypress/fixtures/dom-with-browser-interactions.html",
      "name": "visit",
      "renderProps": {},
      "state": "passed",
      "testId": "r4",
      "timeout": 60000,
      "type": "parent",
      "url": "cypress/fixtures/dom-with-browser-interactions.html",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-1",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
      "message": "cypress/fixtures/shadow-dom.html",
      "name": "visit",
      "renderProps": {},
      "state": "passed",
      "testId": "r3",
      "timeout": 60000,
      "type": "parent",
      "url": "cypress/fixtures/shadow-dom.html",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-10",
      "event": false,
      "hookId": "r5",
      "instrument": "command",
      "hidden": false,
      "message": "expected **<input#text-target>** to have value **abcdef**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r5",
      "timeout": 0,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-11",
      "event": false,
      "hookId": "r6",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r6",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-12",
      "event": false,
      "hookId": "r6",
      "instrument": "command",
      "hidden": false,
      "message": "ghi",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r6",
      "timeout": 4000,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "name": "before",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        },
        {
          "name": "after",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-13",
      "event": false,
      "hookId": "r6",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r6",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-14",
      "event": false,
      "hookId": "r6",
      "instrument": "command",
      "hidden": false,
      "message": "expected **<input#text-target>** to have value **abcdefghi**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r6",
      "timeout": 0,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-15",
      "event": false,
      "hookId": "r7",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r7",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-16",
      "event": false,
      "hookId": "r7",
      "instrument": "command",
      "hidden": false,
      "message": "!",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r7",
      "timeout": 4000,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "name": "before",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        },
        {
          "name": "after",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-17",
      "event": false,
      "hookId": "r7",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r7",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-18",
      "event": false,
      "hookId": "r7",
      "instrument": "command",
      "hidden": false,
      "message": "expected **<input#text-target>** to have value **abcdefghi!**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r7",
      "timeout": 0,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-19",
      "event": false,
      "hookId": "r7",
      "instrument": "command",
      "hidden": false,
      "message": "cypress/fixtures/dom-with-browser-interactions.html",
      "name": "visit",
      "renderProps": {},
      "state": "passed",
      "testId": "r7",
      "timeout": 60000,
      "type": "parent",
      "url": "cypress/fixtures/dom-with-browser-interactions.html",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-2",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
      "message": "#in-shadow",
      "name": "get",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:2121/cypress/fixtures/shadow-dom.html",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-21",
      "event": false,
      "hookId": "r7",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r7",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-22",
      "event": false,
      "hookId": "r7",
      "instrument": "command",
      "hidden": false,
      "message": "abc",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r7",
      "timeout": 4000,
      "type": "child",
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "name": "before",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        },
        {
          "name": "after",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "coords": {
        "top": "Any.Number",
        "left": "Any.Number",
        "topCenter": "Any.Number",
        "leftCenter": "Any.Number",
        "x": "Any.Number",
        "y": "Any.Number"
      },
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-23",
      "event": false,
      "hookId": "r7",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r7",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-24",
      "event": false,
      "hookId": "r7",
      "instrument": "command",
      "hidden": false,
      "message": "expected **<input#text-target>** to have value **abc**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r7",
      "timeout": 0,
      "type": "child",
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-25",
      "event": false,
      "hookId": "r8",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r8",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-26",
      "event": false,
      "hookId": "r8",
      "instrument": "command",
      "hidden": false,
      "message": "!",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r8",
      "timeout": 4000,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "name": "before",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        },
        {
          "name": "after",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-27",
      "event": false,
      "hookId": "r8",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r8",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-28",
      "event": false,
      "hookId": "r8",
      "instrument": "command",
      "hidden": false,
      "message": "expected **<input#text-target>** to have value **abc!**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r8",
      "timeout": 0,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-29",
      "event": false,
      "hookId": "r10",
      "instrument": "command",
      "hidden": false,
      "message": "cypress/fixtures/dom-with-browser-interactions.html",
      "name": "visit",
      "renderProps": {},
      "state": "passed",
      "testId": "r10",
      "timeout": 60000,
      "type": "parent",
      "url": "cypress/fixtures/dom-with-browser-interactions.html",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-3",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r4",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-3",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
      "message": "expected **<div#in-shadow>** to exist in the DOM",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r3",
      "timeout": 0,
      "type": "child",
      "url": "http://localhost:2121/cypress/fixtures/shadow-dom.html",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-31",
      "event": false,
      "hookId": "r10",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r10",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-32",
      "event": false,
      "hookId": "r10",
      "instrument": "command",
      "hidden": false,
      "message": "abc",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r10",
      "timeout": 4000,
      "type": "child",
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "name": "before",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        },
        {
          "name": "after",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "coords": {
        "top": "Any.Number",
        "left": "Any.Number",
        "topCenter": "Any.Number",
        "leftCenter": "Any.Number",
        "x": "Any.Number",
        "y": "Any.Number"
      },
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-33",
      "event": false,
      "hookId": "r10",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r10",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-34",
      "event": false,
      "hookId": "r10",
      "instrument": "command",
      "hidden": false,
      "message": "expected **<input#text-target>** to have value **abc**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r10",
      "timeout": 0,
      "type": "child",
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-35",
      "event": false,
      "hookId": "r11",
      "instrument": "command",
      "hidden": false,
      "message": "cypress/fixtures/dom-with-browser-interactions.html",
      "name": "visit",
      "renderProps": {},
      "state": "passed",
      "testId": "r11",
      "timeout": 60000,
      "type": "parent",
      "url": "cypress/fixtures/dom-with-browser-interactions.html",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-37",
      "event": false,
      "hookId": "r11",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r11",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-38",
      "event": false,
      "hookId": "r11",
      "instrument": "command",
      "hidden": false,
      "message": "def",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r11",
      "timeout": 4000,
      "type": "child",
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "name": "before",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        },
        {
          "name": "after",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "coords": {
        "top": "Any.Number",
        "left": "Any.Number",
        "topCenter": "Any.Number",
        "leftCenter": "Any.Number",
        "x": "Any.Number",
        "y": "Any.Number"
      },
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-39",
      "event": false,
      "hookId": "r11",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r11",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-4",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
      "message": "abc",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r4",
      "timeout": 4000,
      "type": "child",
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "name": "before",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        },
        {
          "name": "after",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "coords": {
        "top": "Any.Number",
        "left": "Any.Number",
        "topCenter": "Any.Number",
        "leftCenter": "Any.Number",
        "x": "Any.Number",
        "y": "Any.Number"
      },
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-4",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
      "message": "cypress/fixtures/shadow-dom-closed.html",
      "name": "visit",
      "renderProps": {},
      "state": "passed",
      "testId": "r4",
      "timeout": 60000,
      "type": "parent",
      "url": "cypress/fixtures/shadow-dom-closed.html",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-40",
      "event": false,
      "hookId": "r11",
      "instrument": "command",
      "hidden": false,
      "message": "expected **<input#text-target>** to have value **def**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r11",
      "timeout": 0,
      "type": "child",
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-41",
      "event": false,
      "hookId": "r13",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r13",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-42",
      "event": false,
      "hookId": "r13",
      "instrument": "command",
      "hidden": false,
      "message": "abc",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r13",
      "timeout": 4000,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "name": "before",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        },
        {
          "name": "after",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-43",
      "event": false,
      "hookId": "r13",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r13",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-44",
      "event": false,
      "hookId": "r13",
      "instrument": "command",
      "hidden": false,
      "message": "expected **<input#text-target>** to have value **defabc**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r13",
      "timeout": 0,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-5",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r4",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-5",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
      "message": "#in-shadow",
      "name": "get",
      "numElements": 0,
      "renderProps": {},
      "state": "passed",
      "testId": "r4",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:2121/cypress/fixtures/shadow-dom-closed.html",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-6",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
      "message": "expected **<input#text-target>** to have value **abc**",
      "name": "assert",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r4",
      "timeout": 0,
      "type": "child",
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-6",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
      "message": "expected **#in-shadow** not to exist in the DOM",
      "name": "assert",
      "renderProps": {},
      "state": "passed",
      "testId": "r4",
      "timeout": 0,
      "type": "child",
      "url": "http://localhost:2121/cypress/fixtures/shadow-dom-closed.html",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-7",
      "event": false,
      "hookId": "r5",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r5",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-8",
      "event": false,
      "hookId": "r5",
      "instrument": "command",
      "hidden": false,
      "message": "def",
      "name": "type",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r5",
      "timeout": 4000,
      "type": "child",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "name": "before",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        },
        {
          "name": "after",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-9",
      "event": false,
      "hookId": "r5",
      "instrument": "command",
      "hidden": false,
      "message": "#text-target",
      "name": "get",
      "numElements": 1,
      "renderProps": {},
      "state": "passed",
      "testId": "r5",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "visible": true,
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:3131-1",
      "event": false,
      "hookId": "h1",
      "instrument": "command",
      "hidden": false,
      "message": "http://localhost:3131/index.html",
      "name": "visit",
      "renderProps": {},
      "state": "passed",
      "testId": "r3",
      "timeout": 60000,
      "type": "parent",
      "url": "http://localhost:3131/index.html",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:3131-2",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
      "message": "300, 200",
      "name": "viewport",
      "renderProps": {},
      "state": "passed",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:3131/index.html",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:3131-3",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:3131-4",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "name": "before",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        },
        {
          "name": "after",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "coords": {
        "top": "Any.Number",
        "left": "Any.Number",
        "topCenter": "Any.Number",
        "leftCenter": "Any.Number",
        "x": "Any.Number",
        "y": "Any.Number"
      },
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:3131-5",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
      "message": "http://foobar.com",
      "name": "origin",
      "renderProps": {},
      "state": "passed",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "http://localhost:3131/index.html",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    }
  ],
  "viewportChanged": [
    {
      "viewport": {
        "width": 300,
        "height": 200
      },
      "timestamp": "Any.Number"
    },
    {
      "viewport": {
        "width": 400,
        "height": 500
      },
      "timestamp": "Any.Number"
    }
  ],
  "urlChanged": [
    {
      "url": "http://localhost:3131/index.html",
      "timestamp": "Any.Number"
    },
    {
      "url": "",
      "timestamp": "Any.Number"
    },
    {
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "timestamp": "Any.Number"
    },
    {
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "timestamp": "Any.Number"
    },
    {
      "url": "",
      "timestamp": "Any.Number"
    },
    {
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "timestamp": "Any.Number"
    },
    {
      "url": "",
      "timestamp": "Any.Number"
    },
    {
      "url": "http://localhost:2121/cypress/fixtures/dom-with-browser-interactions.html",
      "timestamp": "Any.Number"
    },
    {
      "url": "",
      "timestamp": "Any.Number"
    },
    {
      "url": "http://localhost:2121/cypress/fixtures/shadow-dom.html",
      "timestamp": "Any.Number"
    },
    {
      "url": "",
      "timestamp": "Any.Number"
    },
    {
      "url": "http://localhost:2121/cypress/fixtures/shadow-dom-closed.html",
      "timestamp": "Any.Number"
    },
    {
      "url": "",
      "timestamp": "Any.Number"
    }
  ],
  "pageLoading": [
    {
      "loading": true,
      "timestamp": "Any.Number"
    },
    {
      "loading": false,
      "timestamp": "Any.Number"
    },
    {
      "loading": true,
      "timestamp": "Any.Number"
    },
    {
      "loading": false,
      "timestamp": "Any.Number"
    },
    {
      "loading": true,
      "timestamp": "Any.Number"
    },
    {
      "loading": false,
      "timestamp": "Any.Number"
    },
    {
      "loading": true,
      "timestamp": "Any.Number"
    },
    {
      "loading": false,
      "timestamp": "Any.Number"
    },
    {
      "loading": true,
      "timestamp": "Any.Number"
    },
    {
      "loading": false,
      "timestamp": "Any.Number"
    },
    {
      "loading": true,
      "timestamp": "Any.Number"
    },
    {
      "loading": false,
      "timestamp": "Any.Number"
    },
    {
      "loading": true,
      "timestamp": "Any.Number"
    },
    {
      "loading": false,
      "timestamp": "Any.Number"
    },
    {
      "loading": true,
      "timestamp": "Any.Number"
    },
    {
      "loading": false,
      "timestamp": "Any.Number"
    },
    {
      "loading": true,
      "timestamp": "Any.Number"
    },
    {
      "loading": false,
      "timestamp": "Any.Number"
    },
    {
      "loading": true,
      "timestamp": "Any.Number"
    },
    {
      "loading": false,
      "timestamp": "Any.Number"
    },
    {
      "loading": true,
      "timestamp": "Any.Number"
    },
    {
      "loading": false,
      "timestamp": "Any.Number"
    },
    {
      "loading": true,
      "timestamp": "Any.Number"
    },
    {
      "loading": false,
      "timestamp": "Any.Number"
    },
    {
      "loading": true,
      "timestamp": "Any.Number"
    },
    {
      "loading": false,
      "timestamp": "Any.Number"
    }
  ],
  "resetTest": [
    "r3"
  ],
  "responseEndedWithEmptyBody": [],
  "responseStreamTimedOut": []
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
      "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloEarth_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#earth-text').type('Hello Earth');\\n    cy.get('#earth-text').should('have.value', 'Hello Earth');\\n  }",
      "type": "test",
      "wallClockStartedAt": "Any.ISODate",
      "file": null,
      "invocationDetails": {
        "function": "Suite.<anonymous>",
        "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
        "originalFile": "webpack://protocol-sample-project/./src/components/HelloEarth.cy.jsx",
        "relativeFile": "src/components/HelloEarth.cy.jsx",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 5,
        "column": 2,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:17:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 250,
      "timestamp": "Any.Number"
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
      "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloEarth_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#earth-text').type('Where\\\\'s Mars?');\\n    cy.get('#earth-text').should('have.value', 'Where\\\\'s Mars?');\\n  }",
      "type": "test",
      "wallClockStartedAt": "Any.ISODate",
      "file": null,
      "invocationDetails": {
        "function": "Suite.<anonymous>",
        "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
        "originalFile": "webpack://protocol-sample-project/./src/components/HelloEarth.cy.jsx",
        "relativeFile": "src/components/HelloEarth.cy.jsx",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 11,
        "column": 2,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:22:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 250,
      "timestamp": "Any.Number"
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
      "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloMars_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#mars-text').type('Hello Mars');\\n    cy.get('#mars-text').should('have.value', 'Hello Mars');\\n  }",
      "type": "test",
      "wallClockStartedAt": "Any.ISODate",
      "file": null,
      "invocationDetails": {
        "function": "Suite.<anonymous>",
        "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
        "originalFile": "webpack://protocol-sample-project/./src/components/HelloMars.cy.jsx",
        "relativeFile": "src/components/HelloMars.cy.jsx",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 5,
        "column": 2,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:17:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 250,
      "timestamp": "Any.Number"
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
      "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloMars_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#mars-text').type('Where\\\\'s Earth?');\\n    cy.get('#mars-text').should('have.value', 'Where\\\\'s Earth?');\\n  }",
      "type": "test",
      "wallClockStartedAt": "Any.ISODate",
      "file": null,
      "invocationDetails": {
        "function": "Suite.<anonymous>",
        "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
        "originalFile": "webpack://protocol-sample-project/./src/components/HelloMars.cy.jsx",
        "relativeFile": "src/components/HelloMars.cy.jsx",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 11,
        "column": 2,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:22:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 250,
      "timestamp": "Any.Number"
    }
  ],
  "preAfterTest": [
    {
      "test": {
        "_cypressTestStatusInfo": {
          "strategy": "detect-flake-and-pass-on-threshold",
          "shouldAttemptsContinue": false,
          "attempts": 1,
          "outerStatus": "passed"
        },
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
        "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloEarth_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#earth-text').type('Hello Earth');\\n    cy.get('#earth-text').should('have.value', 'Hello Earth');\\n  }",
        "type": "test",
        "duration": "Any.Number",
        "wallClockStartedAt": "Any.ISODate",
        "timings": {
          "lifecycle": "Any.Number",
          "test": {
            "fnDuration": "Any.Number",
            "afterFnDuration": "Any.Number"
          }
        },
        "file": null,
        "invocationDetails": {
          "function": "Suite.<anonymous>",
          "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
          "originalFile": "webpack://protocol-sample-project/./src/components/HelloEarth.cy.jsx",
          "relativeFile": "src/components/HelloEarth.cy.jsx",
          "absoluteFile": "/path/to/absoluteFile",
          "line": 5,
          "column": 2,
          "whitespace": "    ",
          "stack": "Error\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:17:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
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
        "_cypressTestStatusInfo": {
          "strategy": "detect-flake-and-pass-on-threshold",
          "shouldAttemptsContinue": false,
          "attempts": 1,
          "outerStatus": "passed"
        },
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
        "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloEarth_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#earth-text').type('Where\\\\'s Mars?');\\n    cy.get('#earth-text').should('have.value', 'Where\\\\'s Mars?');\\n  }",
        "type": "test",
        "duration": "Any.Number",
        "wallClockStartedAt": "Any.ISODate",
        "timings": {
          "lifecycle": "Any.Number",
          "test": {
            "fnDuration": "Any.Number",
            "afterFnDuration": "Any.Number"
          }
        },
        "file": null,
        "invocationDetails": {
          "function": "Suite.<anonymous>",
          "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
          "originalFile": "webpack://protocol-sample-project/./src/components/HelloEarth.cy.jsx",
          "relativeFile": "src/components/HelloEarth.cy.jsx",
          "absoluteFile": "/path/to/absoluteFile",
          "line": 11,
          "column": 2,
          "whitespace": "    ",
          "stack": "Error\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:22:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
        },
        "final": true,
        "currentRetry": 0,
        "retries": 0,
        "_slow": 250
      },
      "options": {}
    },
    {
      "test": {
        "_cypressTestStatusInfo": {
          "strategy": "detect-flake-and-pass-on-threshold",
          "shouldAttemptsContinue": false,
          "attempts": 1,
          "outerStatus": "passed"
        },
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
        "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloMars_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#mars-text').type('Hello Mars');\\n    cy.get('#mars-text').should('have.value', 'Hello Mars');\\n  }",
        "type": "test",
        "duration": "Any.Number",
        "wallClockStartedAt": "Any.ISODate",
        "timings": {
          "lifecycle": "Any.Number",
          "test": {
            "fnDuration": "Any.Number",
            "afterFnDuration": "Any.Number"
          }
        },
        "file": null,
        "invocationDetails": {
          "function": "Suite.<anonymous>",
          "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
          "originalFile": "webpack://protocol-sample-project/./src/components/HelloMars.cy.jsx",
          "relativeFile": "src/components/HelloMars.cy.jsx",
          "absoluteFile": "/path/to/absoluteFile",
          "line": 5,
          "column": 2,
          "whitespace": "    ",
          "stack": "Error\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:17:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
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
        "_cypressTestStatusInfo": {
          "strategy": "detect-flake-and-pass-on-threshold",
          "shouldAttemptsContinue": false,
          "attempts": 1,
          "outerStatus": "passed"
        },
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
        "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloMars_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#mars-text').type('Where\\\\'s Earth?');\\n    cy.get('#mars-text').should('have.value', 'Where\\\\'s Earth?');\\n  }",
        "type": "test",
        "duration": "Any.Number",
        "wallClockStartedAt": "Any.ISODate",
        "timings": {
          "lifecycle": "Any.Number",
          "test": {
            "fnDuration": "Any.Number",
            "afterFnDuration": "Any.Number"
          }
        },
        "file": null,
        "invocationDetails": {
          "function": "Suite.<anonymous>",
          "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
          "originalFile": "webpack://protocol-sample-project/./src/components/HelloMars.cy.jsx",
          "relativeFile": "src/components/HelloMars.cy.jsx",
          "absoluteFile": "/path/to/absoluteFile",
          "line": 11,
          "column": 2,
          "whitespace": "    ",
          "stack": "Error\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:22:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
        },
        "final": true,
        "currentRetry": 0,
        "retries": 0,
        "_slow": 250
      },
      "options": {}
    }
  ],
  "afterTest": [
    {
      "_cypressTestStatusInfo": {
        "strategy": "detect-flake-and-pass-on-threshold",
        "shouldAttemptsContinue": false,
        "attempts": 1,
        "outerStatus": "passed"
      },
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
      "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloEarth_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#earth-text').type('Hello Earth');\\n    cy.get('#earth-text').should('have.value', 'Hello Earth');\\n  }",
      "type": "test",
      "duration": "Any.Number",
      "wallClockStartedAt": "Any.ISODate",
      "wallClockDuration": "Any.Number",
      "timings": {
        "lifecycle": "Any.Number",
        "test": {
          "fnDuration": "Any.Number",
          "afterFnDuration": "Any.Number"
        }
      },
      "file": null,
      "invocationDetails": {
        "function": "Suite.<anonymous>",
        "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
        "originalFile": "webpack://protocol-sample-project/./src/components/HelloEarth.cy.jsx",
        "relativeFile": "src/components/HelloEarth.cy.jsx",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 5,
        "column": 2,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:17:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
      },
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 250
    },
    {
      "_cypressTestStatusInfo": {
        "strategy": "detect-flake-and-pass-on-threshold",
        "shouldAttemptsContinue": false,
        "attempts": 1,
        "outerStatus": "passed"
      },
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
      "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloEarth_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#earth-text').type('Where\\\\'s Mars?');\\n    cy.get('#earth-text').should('have.value', 'Where\\\\'s Mars?');\\n  }",
      "type": "test",
      "duration": "Any.Number",
      "wallClockStartedAt": "Any.ISODate",
      "wallClockDuration": "Any.Number",
      "timings": {
        "lifecycle": "Any.Number",
        "test": {
          "fnDuration": "Any.Number",
          "afterFnDuration": "Any.Number"
        }
      },
      "file": null,
      "invocationDetails": {
        "function": "Suite.<anonymous>",
        "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
        "originalFile": "webpack://protocol-sample-project/./src/components/HelloEarth.cy.jsx",
        "relativeFile": "src/components/HelloEarth.cy.jsx",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 11,
        "column": 2,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:22:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
      },
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 250
    },
    {
      "_cypressTestStatusInfo": {
        "strategy": "detect-flake-and-pass-on-threshold",
        "shouldAttemptsContinue": false,
        "attempts": 1,
        "outerStatus": "passed"
      },
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
      "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloMars_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#mars-text').type('Hello Mars');\\n    cy.get('#mars-text').should('have.value', 'Hello Mars');\\n  }",
      "type": "test",
      "duration": "Any.Number",
      "wallClockStartedAt": "Any.ISODate",
      "wallClockDuration": "Any.Number",
      "timings": {
        "lifecycle": "Any.Number",
        "test": {
          "fnDuration": "Any.Number",
          "afterFnDuration": "Any.Number"
        }
      },
      "file": null,
      "invocationDetails": {
        "function": "Suite.<anonymous>",
        "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
        "originalFile": "webpack://protocol-sample-project/./src/components/HelloMars.cy.jsx",
        "relativeFile": "src/components/HelloMars.cy.jsx",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 5,
        "column": 2,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:17:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
      },
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 250
    },
    {
      "_cypressTestStatusInfo": {
        "strategy": "detect-flake-and-pass-on-threshold",
        "shouldAttemptsContinue": false,
        "attempts": 1,
        "outerStatus": "passed"
      },
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
      "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloMars_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#mars-text').type('Where\\\\'s Earth?');\\n    cy.get('#mars-text').should('have.value', 'Where\\\\'s Earth?');\\n  }",
      "type": "test",
      "duration": "Any.Number",
      "wallClockStartedAt": "Any.ISODate",
      "wallClockDuration": "Any.Number",
      "timings": {
        "lifecycle": "Any.Number",
        "test": {
          "fnDuration": "Any.Number",
          "afterFnDuration": "Any.Number"
        }
      },
      "file": null,
      "invocationDetails": {
        "function": "Suite.<anonymous>",
        "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
        "originalFile": "webpack://protocol-sample-project/./src/components/HelloMars.cy.jsx",
        "relativeFile": "src/components/HelloMars.cy.jsx",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 11,
        "column": 2,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:22:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
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
            "function": "./src/components/HelloEarth.cy.jsx",
            "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
            "originalFile": "webpack://protocol-sample-project/./src/components/HelloEarth.cy.jsx",
            "relativeFile": "src/components/HelloEarth.cy.jsx",
            "absoluteFile": "/path/to/absoluteFile",
            "line": 4,
            "column": 0,
            "whitespace": "    ",
            "stack": "Error\\n    at ./src/components/HelloEarth.cy.jsx (http://localhost:2121/__cypress/src/spec-0.js:16:1)\\n    at Function.__webpack_require__ (http://localhost:2121/__cypress/src/main.js:108:42)"
          },
          "retries": -1,
          "_slow": 250,
          "hooks": [],
          "tests": [
            {
              "id": "r3",
              "title": "test 1",
              "pending": false,
              "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloEarth_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#earth-text').type('Hello Earth');\\n    cy.get('#earth-text').should('have.value', 'Hello Earth');\\n  }",
              "type": "test",
              "file": null,
              "invocationDetails": {
                "function": "Suite.<anonymous>",
                "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
                "originalFile": "webpack://protocol-sample-project/./src/components/HelloEarth.cy.jsx",
                "relativeFile": "src/components/HelloEarth.cy.jsx",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 5,
                "column": 2,
                "whitespace": "    ",
                "stack": "Error\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:17:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
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
              "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloEarth_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#earth-text').type('Where\\\\'s Mars?');\\n    cy.get('#earth-text').should('have.value', 'Where\\\\'s Mars?');\\n  }",
              "type": "test",
              "file": null,
              "invocationDetails": {
                "function": "Suite.<anonymous>",
                "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
                "originalFile": "webpack://protocol-sample-project/./src/components/HelloEarth.cy.jsx",
                "relativeFile": "src/components/HelloEarth.cy.jsx",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 11,
                "column": 2,
                "whitespace": "    ",
                "stack": "Error\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:22:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
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
            "function": "./src/components/HelloMars.cy.jsx",
            "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
            "originalFile": "webpack://protocol-sample-project/./src/components/HelloMars.cy.jsx",
            "relativeFile": "src/components/HelloMars.cy.jsx",
            "absoluteFile": "/path/to/absoluteFile",
            "line": 4,
            "column": 0,
            "whitespace": "    ",
            "stack": "Error\\n    at ./src/components/HelloMars.cy.jsx (http://localhost:2121/__cypress/src/spec-0.js:16:1)\\n    at Function.__webpack_require__ (http://localhost:2121/__cypress/src/main.js:108:42)"
          },
          "retries": -1,
          "_slow": 250,
          "hooks": [],
          "tests": [
            {
              "id": "r3",
              "title": "test 1",
              "pending": false,
              "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloMars_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#mars-text').type('Hello Mars');\\n    cy.get('#mars-text').should('have.value', 'Hello Mars');\\n  }",
              "type": "test",
              "file": null,
              "invocationDetails": {
                "function": "Suite.<anonymous>",
                "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
                "originalFile": "webpack://protocol-sample-project/./src/components/HelloMars.cy.jsx",
                "relativeFile": "src/components/HelloMars.cy.jsx",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 5,
                "column": 2,
                "whitespace": "    ",
                "stack": "Error\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:17:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
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
              "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloMars_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#mars-text').type('Where\\\\'s Earth?');\\n    cy.get('#mars-text').should('have.value', 'Where\\\\'s Earth?');\\n  }",
              "type": "test",
              "file": null,
              "invocationDetails": {
                "function": "Suite.<anonymous>",
                "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
                "originalFile": "webpack://protocol-sample-project/./src/components/HelloMars.cy.jsx",
                "relativeFile": "src/components/HelloMars.cy.jsx",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 11,
                "column": 2,
                "whitespace": "    ",
                "stack": "Error\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:22:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
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
      "id": "log-http://localhost:2121-7",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-8",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
      "message": "#earth-text",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-9",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-10",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
      "message": "#earth-text",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-11",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-15",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-16",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
      "message": "#earth-text",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r4",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-17",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-18",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
      "message": "#earth-text",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r4",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-19",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-7",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-8",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
      "message": "#mars-text",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-9",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-10",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
      "message": "#mars-text",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-11",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-15",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-16",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
      "message": "#mars-text",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r4",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-17",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-18",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
      "message": "#mars-text",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r4",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-19",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    }
  ],
  "commandLogChanged": [
    {
      "id": "log-http://localhost:2121-10",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-10",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-11",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-11",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-15",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-15",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-16",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-16",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-17",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "name": "before",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        },
        {
          "name": "after",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "coords": {
        "top": "Any.Number",
        "left": "Any.Number",
        "topCenter": "Any.Number",
        "leftCenter": "Any.Number",
        "x": "Any.Number",
        "y": "Any.Number"
      },
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-17",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "name": "before",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        },
        {
          "name": "after",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "coords": {
        "top": "Any.Number",
        "left": "Any.Number",
        "topCenter": "Any.Number",
        "leftCenter": "Any.Number",
        "x": "Any.Number",
        "y": "Any.Number"
      },
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-18",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-18",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-19",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-19",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-7",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-7",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-8",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-8",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-9",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "name": "before",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        },
        {
          "name": "after",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "coords": {
        "top": "Any.Number",
        "left": "Any.Number",
        "topCenter": "Any.Number",
        "leftCenter": "Any.Number",
        "x": "Any.Number",
        "y": "Any.Number"
      },
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-9",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "name": "before",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        },
        {
          "name": "after",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "coords": {
        "top": "Any.Number",
        "left": "Any.Number",
        "topCenter": "Any.Number",
        "leftCenter": "Any.Number",
        "x": "Any.Number",
        "y": "Any.Number"
      },
      "highlightAttr": "data-cypress-el"
    }
  ],
  "viewportChanged": [],
  "urlChanged": [
    {
      "url": "http://localhost:2121/__cypress/iframes/index.html?specPath=/protocol/src/components/HelloEarth.cy.jsx",
      "timestamp": "Any.Number"
    },
    {
      "url": "http://localhost:2121/__cypress/iframes/index.html?specPath=/protocol/src/components/HelloMars.cy.jsx",
      "timestamp": "Any.Number"
    }
  ],
  "pageLoading": [],
  "resetTest": [],
  "responseEndedWithEmptyBody": [],
  "responseStreamTimedOut": []
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
      "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloEarth_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#earth-text').type('Hello Earth');\\n    cy.get('#earth-text').should('have.value', 'Hello Earth');\\n  }",
      "type": "test",
      "wallClockStartedAt": "Any.ISODate",
      "file": null,
      "invocationDetails": {
        "function": "Suite.<anonymous>",
        "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
        "originalFile": "webpack://protocol-sample-project/./src/components/HelloEarth.cy.jsx",
        "relativeFile": "src/components/HelloEarth.cy.jsx",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 5,
        "column": 2,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:17:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 250,
      "timestamp": "Any.Number"
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
      "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloEarth_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#earth-text').type('Where\\\\'s Mars?');\\n    cy.get('#earth-text').should('have.value', 'Where\\\\'s Mars?');\\n  }",
      "type": "test",
      "wallClockStartedAt": "Any.ISODate",
      "file": null,
      "invocationDetails": {
        "function": "Suite.<anonymous>",
        "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
        "originalFile": "webpack://protocol-sample-project/./src/components/HelloEarth.cy.jsx",
        "relativeFile": "src/components/HelloEarth.cy.jsx",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 11,
        "column": 2,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:22:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 250,
      "timestamp": "Any.Number"
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
      "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloMars_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#mars-text').type('Hello Mars');\\n    cy.get('#mars-text').should('have.value', 'Hello Mars');\\n  }",
      "type": "test",
      "wallClockStartedAt": "Any.ISODate",
      "file": null,
      "invocationDetails": {
        "function": "Suite.<anonymous>",
        "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
        "originalFile": "webpack://protocol-sample-project/./src/components/HelloMars.cy.jsx",
        "relativeFile": "src/components/HelloMars.cy.jsx",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 5,
        "column": 2,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:17:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 250,
      "timestamp": "Any.Number"
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
      "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloMars_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#mars-text').type('Where\\\\'s Earth?');\\n    cy.get('#mars-text').should('have.value', 'Where\\\\'s Earth?');\\n  }",
      "type": "test",
      "wallClockStartedAt": "Any.ISODate",
      "file": null,
      "invocationDetails": {
        "function": "Suite.<anonymous>",
        "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
        "originalFile": "webpack://protocol-sample-project/./src/components/HelloMars.cy.jsx",
        "relativeFile": "src/components/HelloMars.cy.jsx",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 11,
        "column": 2,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:22:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
      },
      "currentRetry": 0,
      "retries": 0,
      "_slow": 250,
      "timestamp": "Any.Number"
    }
  ],
  "preAfterTest": [
    {
      "test": {
        "_cypressTestStatusInfo": {
          "strategy": "detect-flake-and-pass-on-threshold",
          "shouldAttemptsContinue": false,
          "attempts": 1,
          "outerStatus": "passed"
        },
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
        "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloEarth_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#earth-text').type('Hello Earth');\\n    cy.get('#earth-text').should('have.value', 'Hello Earth');\\n  }",
        "type": "test",
        "duration": "Any.Number",
        "wallClockStartedAt": "Any.ISODate",
        "timings": {
          "lifecycle": "Any.Number",
          "test": {
            "fnDuration": "Any.Number",
            "afterFnDuration": "Any.Number"
          }
        },
        "file": null,
        "invocationDetails": {
          "function": "Suite.<anonymous>",
          "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
          "originalFile": "webpack://protocol-sample-project/./src/components/HelloEarth.cy.jsx",
          "relativeFile": "src/components/HelloEarth.cy.jsx",
          "absoluteFile": "/path/to/absoluteFile",
          "line": 5,
          "column": 2,
          "whitespace": "    ",
          "stack": "Error\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:17:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
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
        "_cypressTestStatusInfo": {
          "strategy": "detect-flake-and-pass-on-threshold",
          "shouldAttemptsContinue": false,
          "attempts": 1,
          "outerStatus": "passed"
        },
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
        "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloEarth_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#earth-text').type('Where\\\\'s Mars?');\\n    cy.get('#earth-text').should('have.value', 'Where\\\\'s Mars?');\\n  }",
        "type": "test",
        "duration": "Any.Number",
        "wallClockStartedAt": "Any.ISODate",
        "timings": {
          "lifecycle": "Any.Number",
          "test": {
            "fnDuration": "Any.Number",
            "afterFnDuration": "Any.Number"
          }
        },
        "file": null,
        "invocationDetails": {
          "function": "Suite.<anonymous>",
          "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
          "originalFile": "webpack://protocol-sample-project/./src/components/HelloEarth.cy.jsx",
          "relativeFile": "src/components/HelloEarth.cy.jsx",
          "absoluteFile": "/path/to/absoluteFile",
          "line": 11,
          "column": 2,
          "whitespace": "    ",
          "stack": "Error\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:22:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
        },
        "final": true,
        "currentRetry": 0,
        "retries": 0,
        "_slow": 250
      },
      "options": {}
    },
    {
      "test": {
        "_cypressTestStatusInfo": {
          "strategy": "detect-flake-and-pass-on-threshold",
          "shouldAttemptsContinue": false,
          "attempts": 1,
          "outerStatus": "passed"
        },
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
        "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloMars_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#mars-text').type('Hello Mars');\\n    cy.get('#mars-text').should('have.value', 'Hello Mars');\\n  }",
        "type": "test",
        "duration": "Any.Number",
        "wallClockStartedAt": "Any.ISODate",
        "timings": {
          "lifecycle": "Any.Number",
          "test": {
            "fnDuration": "Any.Number",
            "afterFnDuration": "Any.Number"
          }
        },
        "file": null,
        "invocationDetails": {
          "function": "Suite.<anonymous>",
          "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
          "originalFile": "webpack://protocol-sample-project/./src/components/HelloMars.cy.jsx",
          "relativeFile": "src/components/HelloMars.cy.jsx",
          "absoluteFile": "/path/to/absoluteFile",
          "line": 5,
          "column": 2,
          "whitespace": "    ",
          "stack": "Error\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:17:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
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
        "_cypressTestStatusInfo": {
          "strategy": "detect-flake-and-pass-on-threshold",
          "shouldAttemptsContinue": false,
          "attempts": 1,
          "outerStatus": "passed"
        },
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
        "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloMars_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#mars-text').type('Where\\\\'s Earth?');\\n    cy.get('#mars-text').should('have.value', 'Where\\\\'s Earth?');\\n  }",
        "type": "test",
        "duration": "Any.Number",
        "wallClockStartedAt": "Any.ISODate",
        "timings": {
          "lifecycle": "Any.Number",
          "test": {
            "fnDuration": "Any.Number",
            "afterFnDuration": "Any.Number"
          }
        },
        "file": null,
        "invocationDetails": {
          "function": "Suite.<anonymous>",
          "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
          "originalFile": "webpack://protocol-sample-project/./src/components/HelloMars.cy.jsx",
          "relativeFile": "src/components/HelloMars.cy.jsx",
          "absoluteFile": "/path/to/absoluteFile",
          "line": 11,
          "column": 2,
          "whitespace": "    ",
          "stack": "Error\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:22:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
        },
        "final": true,
        "currentRetry": 0,
        "retries": 0,
        "_slow": 250
      },
      "options": {}
    }
  ],
  "afterTest": [
    {
      "_cypressTestStatusInfo": {
        "strategy": "detect-flake-and-pass-on-threshold",
        "shouldAttemptsContinue": false,
        "attempts": 1,
        "outerStatus": "passed"
      },
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
      "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloEarth_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#earth-text').type('Hello Earth');\\n    cy.get('#earth-text').should('have.value', 'Hello Earth');\\n  }",
      "type": "test",
      "duration": "Any.Number",
      "wallClockStartedAt": "Any.ISODate",
      "wallClockDuration": "Any.Number",
      "timings": {
        "lifecycle": "Any.Number",
        "test": {
          "fnDuration": "Any.Number",
          "afterFnDuration": "Any.Number"
        }
      },
      "file": null,
      "invocationDetails": {
        "function": "Suite.<anonymous>",
        "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
        "originalFile": "webpack://protocol-sample-project/./src/components/HelloEarth.cy.jsx",
        "relativeFile": "src/components/HelloEarth.cy.jsx",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 5,
        "column": 2,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:17:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
      },
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 250
    },
    {
      "_cypressTestStatusInfo": {
        "strategy": "detect-flake-and-pass-on-threshold",
        "shouldAttemptsContinue": false,
        "attempts": 1,
        "outerStatus": "passed"
      },
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
      "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloEarth_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#earth-text').type('Where\\\\'s Mars?');\\n    cy.get('#earth-text').should('have.value', 'Where\\\\'s Mars?');\\n  }",
      "type": "test",
      "duration": "Any.Number",
      "wallClockStartedAt": "Any.ISODate",
      "wallClockDuration": "Any.Number",
      "timings": {
        "lifecycle": "Any.Number",
        "test": {
          "fnDuration": "Any.Number",
          "afterFnDuration": "Any.Number"
        }
      },
      "file": null,
      "invocationDetails": {
        "function": "Suite.<anonymous>",
        "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
        "originalFile": "webpack://protocol-sample-project/./src/components/HelloEarth.cy.jsx",
        "relativeFile": "src/components/HelloEarth.cy.jsx",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 11,
        "column": 2,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:22:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
      },
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 250
    },
    {
      "_cypressTestStatusInfo": {
        "strategy": "detect-flake-and-pass-on-threshold",
        "shouldAttemptsContinue": false,
        "attempts": 1,
        "outerStatus": "passed"
      },
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
      "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloMars_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#mars-text').type('Hello Mars');\\n    cy.get('#mars-text').should('have.value', 'Hello Mars');\\n  }",
      "type": "test",
      "duration": "Any.Number",
      "wallClockStartedAt": "Any.ISODate",
      "wallClockDuration": "Any.Number",
      "timings": {
        "lifecycle": "Any.Number",
        "test": {
          "fnDuration": "Any.Number",
          "afterFnDuration": "Any.Number"
        }
      },
      "file": null,
      "invocationDetails": {
        "function": "Suite.<anonymous>",
        "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
        "originalFile": "webpack://protocol-sample-project/./src/components/HelloMars.cy.jsx",
        "relativeFile": "src/components/HelloMars.cy.jsx",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 5,
        "column": 2,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:17:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
      },
      "final": true,
      "currentRetry": 0,
      "retries": 0,
      "_slow": 250
    },
    {
      "_cypressTestStatusInfo": {
        "strategy": "detect-flake-and-pass-on-threshold",
        "shouldAttemptsContinue": false,
        "attempts": 1,
        "outerStatus": "passed"
      },
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
      "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloMars_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#mars-text').type('Where\\\\'s Earth?');\\n    cy.get('#mars-text').should('have.value', 'Where\\\\'s Earth?');\\n  }",
      "type": "test",
      "duration": "Any.Number",
      "wallClockStartedAt": "Any.ISODate",
      "wallClockDuration": "Any.Number",
      "timings": {
        "lifecycle": "Any.Number",
        "test": {
          "fnDuration": "Any.Number",
          "afterFnDuration": "Any.Number"
        }
      },
      "file": null,
      "invocationDetails": {
        "function": "Suite.<anonymous>",
        "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
        "originalFile": "webpack://protocol-sample-project/./src/components/HelloMars.cy.jsx",
        "relativeFile": "src/components/HelloMars.cy.jsx",
        "absoluteFile": "/path/to/absoluteFile",
        "line": 11,
        "column": 2,
        "whitespace": "    ",
        "stack": "Error\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:22:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
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
            "function": "./src/components/HelloEarth.cy.jsx",
            "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
            "originalFile": "webpack://protocol-sample-project/./src/components/HelloEarth.cy.jsx",
            "relativeFile": "src/components/HelloEarth.cy.jsx",
            "absoluteFile": "/path/to/absoluteFile",
            "line": 4,
            "column": 0,
            "whitespace": "    ",
            "stack": "Error\\n    at ./src/components/HelloEarth.cy.jsx (http://localhost:2121/__cypress/src/spec-0.js:16:1)\\n    at Function.__webpack_require__ (http://localhost:2121/__cypress/src/main.js:108:42)"
          },
          "retries": -1,
          "_slow": 250,
          "hooks": [],
          "tests": [
            {
              "id": "r3",
              "title": "test 1",
              "pending": false,
              "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloEarth_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#earth-text').type('Hello Earth');\\n    cy.get('#earth-text').should('have.value', 'Hello Earth');\\n  }",
              "type": "test",
              "file": null,
              "invocationDetails": {
                "function": "Suite.<anonymous>",
                "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
                "originalFile": "webpack://protocol-sample-project/./src/components/HelloEarth.cy.jsx",
                "relativeFile": "src/components/HelloEarth.cy.jsx",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 5,
                "column": 2,
                "whitespace": "    ",
                "stack": "Error\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:17:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
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
              "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloEarth_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#earth-text').type('Where\\\\'s Mars?');\\n    cy.get('#earth-text').should('have.value', 'Where\\\\'s Mars?');\\n  }",
              "type": "test",
              "file": null,
              "invocationDetails": {
                "function": "Suite.<anonymous>",
                "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
                "originalFile": "webpack://protocol-sample-project/./src/components/HelloEarth.cy.jsx",
                "relativeFile": "src/components/HelloEarth.cy.jsx",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 11,
                "column": 2,
                "whitespace": "    ",
                "stack": "Error\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:22:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
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
            "function": "./src/components/HelloMars.cy.jsx",
            "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
            "originalFile": "webpack://protocol-sample-project/./src/components/HelloMars.cy.jsx",
            "relativeFile": "src/components/HelloMars.cy.jsx",
            "absoluteFile": "/path/to/absoluteFile",
            "line": 4,
            "column": 0,
            "whitespace": "    ",
            "stack": "Error\\n    at ./src/components/HelloMars.cy.jsx (http://localhost:2121/__cypress/src/spec-0.js:16:1)\\n    at Function.__webpack_require__ (http://localhost:2121/__cypress/src/main.js:108:42)"
          },
          "retries": -1,
          "_slow": 250,
          "hooks": [],
          "tests": [
            {
              "id": "r3",
              "title": "test 1",
              "pending": false,
              "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloMars_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#mars-text').type('Hello Mars');\\n    cy.get('#mars-text').should('have.value', 'Hello Mars');\\n  }",
              "type": "test",
              "file": null,
              "invocationDetails": {
                "function": "Suite.<anonymous>",
                "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
                "originalFile": "webpack://protocol-sample-project/./src/components/HelloMars.cy.jsx",
                "relativeFile": "src/components/HelloMars.cy.jsx",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 5,
                "column": 2,
                "whitespace": "    ",
                "stack": "Error\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:17:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
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
              "body": "function () {\\n    cy.mount( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_HelloMars_jsx__WEBPACK_IMPORTED_MODULE_1__[\\"default\\"], null));\\n    cy.get('#mars-text').type('Where\\\\'s Earth?');\\n    cy.get('#mars-text').should('have.value', 'Where\\\\'s Earth?');\\n  }",
              "type": "test",
              "file": null,
              "invocationDetails": {
                "function": "Suite.<anonymous>",
                "fileUrl": "http://localhost:2121/__cypress/src/spec-0.js",
                "originalFile": "webpack://protocol-sample-project/./src/components/HelloMars.cy.jsx",
                "relativeFile": "src/components/HelloMars.cy.jsx",
                "absoluteFile": "/path/to/absoluteFile",
                "line": 11,
                "column": 2,
                "whitespace": "    ",
                "stack": "Error\\n    at Suite.<anonymous> (http://localhost:2121/__cypress/src/spec-0.js:22:3)\\n    at Object.create (cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:140:19)\\n    at context.describe.context.context (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:41:27)\\n    at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)\\n    at eval (cypress:///../driver/src/cypress/mocha.ts:187:14)"
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
      "id": "log-http://localhost:2121-7",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-8",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
      "message": "#earth-text",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-9",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-10",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
      "message": "#earth-text",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-11",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-15",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-16",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
      "message": "#earth-text",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r4",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-17",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-18",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
      "message": "#earth-text",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r4",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-19",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-7",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-8",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
      "message": "#mars-text",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-9",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-10",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
      "message": "#mars-text",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r3",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-11",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-15",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-16",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
      "message": "#mars-text",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r4",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-17",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-18",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
      "message": "#mars-text",
      "name": "get",
      "renderProps": {},
      "state": "pending",
      "testId": "r4",
      "timeout": 4000,
      "type": "parent",
      "url": "",
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number"
    },
    {
      "id": "log-http://localhost:2121-19",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    }
  ],
  "commandLogChanged": [
    {
      "id": "log-http://localhost:2121-10",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-10",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-11",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-11",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-15",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-15",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-16",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-16",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-17",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "name": "before",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        },
        {
          "name": "after",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "coords": {
        "top": "Any.Number",
        "left": "Any.Number",
        "topCenter": "Any.Number",
        "leftCenter": "Any.Number",
        "x": "Any.Number",
        "y": "Any.Number"
      },
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-17",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "name": "before",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        },
        {
          "name": "after",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "coords": {
        "top": "Any.Number",
        "left": "Any.Number",
        "topCenter": "Any.Number",
        "leftCenter": "Any.Number",
        "x": "Any.Number",
        "y": "Any.Number"
      },
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-18",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-18",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-19",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-19",
      "event": false,
      "hookId": "r4",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-7",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-7",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-8",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-8",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-9",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "name": "before",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        },
        {
          "name": "after",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "coords": {
        "top": "Any.Number",
        "left": "Any.Number",
        "topCenter": "Any.Number",
        "leftCenter": "Any.Number",
        "x": "Any.Number",
        "y": "Any.Number"
      },
      "highlightAttr": "data-cypress-el"
    },
    {
      "id": "log-http://localhost:2121-9",
      "event": false,
      "hookId": "r3",
      "instrument": "command",
      "hidden": false,
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
      "wallClockStartedAt": "Any.ISODate",
      "testCurrentRetry": 0,
      "snapshots": [
        {
          "name": "before",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        },
        {
          "name": "after",
          "timestamp": "Any.Number",
          "htmlAttrs": {},
          "body": {}
        }
      ],
      "createdAtTimestamp": "Any.Number",
      "updatedAtTimestamp": "Any.Number",
      "coords": {
        "top": "Any.Number",
        "left": "Any.Number",
        "topCenter": "Any.Number",
        "leftCenter": "Any.Number",
        "x": "Any.Number",
        "y": "Any.Number"
      },
      "highlightAttr": "data-cypress-el"
    }
  ],
  "viewportChanged": [],
  "urlChanged": [
    {
      "url": "http://localhost:2121/__cypress/iframes/index.html?specPath=/protocol/src/components/HelloEarth.cy.jsx",
      "timestamp": "Any.Number"
    },
    {
      "url": "http://localhost:2121/__cypress/iframes/index.html?specPath=/protocol/src/components/HelloMars.cy.jsx",
      "timestamp": "Any.Number"
    }
  ],
  "pageLoading": [],
  "resetTest": [],
  "responseEndedWithEmptyBody": [],
  "responseStreamTimedOut": []
}
`
