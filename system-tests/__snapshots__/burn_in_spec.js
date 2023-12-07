exports['burn-in modified/new test PASSED_BURN_IN 1'] = [
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "NONE"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": "PASSED_BURN_IN",
    "initialStrategy": "BURN_IN"
  }
]

exports['burn-in modified/new test PASSED_MET_THRESHOLD 1'] = [
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "NONE"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)",
      "codeFrame": {
        "line": 10,
        "column": 26,
        "originalFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "relativeFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "BURN_IN"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)",
      "codeFrame": {
        "line": 10,
        "column": 26,
        "originalFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "relativeFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": "PASSED_MET_THRESHOLD",
    "initialStrategy": "RETRY"
  }
]

exports['burn-in modified/new test FAILED_REACHED_MAX_RETRIES 1'] = [
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "NONE"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)",
      "codeFrame": {
        "line": 10,
        "column": 26,
        "originalFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "relativeFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "BURN_IN"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)",
      "codeFrame": {
        "line": 10,
        "column": 26,
        "originalFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "relativeFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)",
      "codeFrame": {
        "line": 10,
        "column": 26,
        "originalFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "relativeFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "passed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)",
      "codeFrame": {
        "line": 10,
        "column": 26,
        "originalFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "relativeFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": "FAILED_REACHED_MAX_RETRIES",
    "initialStrategy": "RETRY"
  }
]

exports['burn-in modified/new test FAILED_DID_NOT_MEET_THRESHOLD 1'] = [
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "NONE"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)",
      "codeFrame": {
        "line": 10,
        "column": 26,
        "originalFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "relativeFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "BURN_IN"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)",
      "codeFrame": {
        "line": 10,
        "column": 26,
        "originalFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "relativeFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)",
      "codeFrame": {
        "line": 10,
        "column": 26,
        "originalFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "relativeFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": "FAILED_DID_NOT_MEET_THRESHOLD",
    "initialStrategy": "RETRY"
  }
]

exports['burn-in modified/new test FAILED_STOPPED_ON_FLAKE 1'] = [
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "NONE"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)",
      "codeFrame": {
        "line": 10,
        "column": 26,
        "originalFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "relativeFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": "FAILED_STOPPED_ON_FLAKE",
    "initialStrategy": "BURN_IN"
  }
]

exports['burn-in failing without flake PASSED_BURN_IN 1'] = [
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "NONE"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": "PASSED_BURN_IN",
    "initialStrategy": "BURN_IN"
  }
]

exports['burn-in failing without flake PASSED_MET_THRESHOLD 1'] = [
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "NONE"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)",
      "codeFrame": {
        "line": 10,
        "column": 26,
        "originalFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "relativeFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "BURN_IN"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)",
      "codeFrame": {
        "line": 10,
        "column": 26,
        "originalFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "relativeFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": "PASSED_MET_THRESHOLD",
    "initialStrategy": "RETRY"
  }
]

exports['burn-in failing without flake FAILED_REACHED_MAX_RETRIES 1'] = [
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "NONE"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)",
      "codeFrame": {
        "line": 10,
        "column": 26,
        "originalFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "relativeFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "BURN_IN"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)",
      "codeFrame": {
        "line": 10,
        "column": 26,
        "originalFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "relativeFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)",
      "codeFrame": {
        "line": 10,
        "column": 26,
        "originalFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "relativeFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "passed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)",
      "codeFrame": {
        "line": 10,
        "column": 26,
        "originalFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "relativeFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": "FAILED_REACHED_MAX_RETRIES",
    "initialStrategy": "RETRY"
  }
]

exports['burn-in failing without flake FAILED_DID_NOT_MEET_THRESHOLD 1'] = [
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "NONE"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)",
      "codeFrame": {
        "line": 10,
        "column": 26,
        "originalFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "relativeFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "BURN_IN"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)",
      "codeFrame": {
        "line": 10,
        "column": 26,
        "originalFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "relativeFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)",
      "codeFrame": {
        "line": 10,
        "column": 26,
        "originalFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "relativeFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": "FAILED_DID_NOT_MEET_THRESHOLD",
    "initialStrategy": "RETRY"
  }
]

exports['burn-in failing without flake FAILED_STOPPED_ON_FLAKE 1'] = [
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "NONE"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)",
      "codeFrame": {
        "line": 10,
        "column": 26,
        "originalFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "relativeFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": "FAILED_STOPPED_ON_FLAKE",
    "initialStrategy": "BURN_IN"
  }
]

exports['burn-in flaky test PASSED_BURN_IN 1'] = [
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "NONE"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "BURN_IN"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "BURN_IN"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": "PASSED_BURN_IN",
    "initialStrategy": "BURN_IN"
  }
]

exports['burn-in flaky test PASSED_MET_THRESHOLD 1'] = [
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "NONE"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)",
      "codeFrame": {
        "line": 10,
        "column": 26,
        "originalFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "relativeFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "BURN_IN"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)",
      "codeFrame": {
        "line": 10,
        "column": 26,
        "originalFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "relativeFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": "PASSED_MET_THRESHOLD",
    "initialStrategy": "RETRY"
  }
]

exports['burn-in flaky test FAILED_REACHED_MAX_RETRIES 1'] = [
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "NONE"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)",
      "codeFrame": {
        "line": 10,
        "column": 26,
        "originalFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "relativeFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "BURN_IN"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)",
      "codeFrame": {
        "line": 10,
        "column": 26,
        "originalFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "relativeFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)",
      "codeFrame": {
        "line": 10,
        "column": 26,
        "originalFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "relativeFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "passed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)",
      "codeFrame": {
        "line": 10,
        "column": 26,
        "originalFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "relativeFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": "FAILED_REACHED_MAX_RETRIES",
    "initialStrategy": "RETRY"
  }
]

exports['burn-in flaky test FAILED_DID_NOT_MEET_THRESHOLD 1'] = [
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "NONE"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)",
      "codeFrame": {
        "line": 10,
        "column": 26,
        "originalFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "relativeFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "BURN_IN"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)",
      "codeFrame": {
        "line": 10,
        "column": 26,
        "originalFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "relativeFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)",
      "codeFrame": {
        "line": 10,
        "column": 26,
        "originalFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "relativeFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": "FAILED_DID_NOT_MEET_THRESHOLD",
    "initialStrategy": "RETRY"
  }
]

exports['burn-in flaky test FAILED_STOPPED_ON_FLAKE 1'] = [
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "NONE"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/passes-first-attempt-flaky.cy.js:10:25)",
      "codeFrame": {
        "line": 10,
        "column": 26,
        "originalFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "relativeFile": "cypress/e2e/passes-first-attempt-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "   8 |     // fifth attempt (PASS)...\n   9 |     if (this.test.currentRetry() % 2) {\n> 10 |       expect(true).to.be.false\n     |                          ^\n  11 |     } else {\n  12 |       expect(true).to.be.true\n  13 |     }",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": "FAILED_STOPPED_ON_FLAKE",
    "initialStrategy": "BURN_IN"
  }
]

exports['burn-in cloud could not determine score PASSED_FIRST_ATTEMPT 1'] = [
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": "PASSED_FIRST_ATTEMPT",
    "initialStrategy": "NONE"
  }
]

exports['burn-in cloud could not determine score PASSED_MET_THRESHOLD 1'] = [
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)",
      "codeFrame": {
        "line": 12,
        "column": 26,
        "originalFile": "cypress/e2e/deterministic-flaky.cy.js",
        "relativeFile": "cypress/e2e/deterministic-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "NONE"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)",
      "codeFrame": {
        "line": 12,
        "column": 26,
        "originalFile": "cypress/e2e/deterministic-flaky.cy.js",
        "relativeFile": "cypress/e2e/deterministic-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)",
      "codeFrame": {
        "line": 12,
        "column": 26,
        "originalFile": "cypress/e2e/deterministic-flaky.cy.js",
        "relativeFile": "cypress/e2e/deterministic-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": "PASSED_MET_THRESHOLD",
    "initialStrategy": "RETRY"
  }
]

exports['burn-in cloud could not determine score FAILED_REACHED_MAX_RETRIES 1'] = [
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)",
      "codeFrame": {
        "line": 12,
        "column": 26,
        "originalFile": "cypress/e2e/deterministic-flaky.cy.js",
        "relativeFile": "cypress/e2e/deterministic-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "NONE"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)",
      "codeFrame": {
        "line": 12,
        "column": 26,
        "originalFile": "cypress/e2e/deterministic-flaky.cy.js",
        "relativeFile": "cypress/e2e/deterministic-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)",
      "codeFrame": {
        "line": 12,
        "column": 26,
        "originalFile": "cypress/e2e/deterministic-flaky.cy.js",
        "relativeFile": "cypress/e2e/deterministic-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)",
      "codeFrame": {
        "line": 12,
        "column": 26,
        "originalFile": "cypress/e2e/deterministic-flaky.cy.js",
        "relativeFile": "cypress/e2e/deterministic-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": "FAILED_REACHED_MAX_RETRIES",
    "initialStrategy": "RETRY"
  }
]

exports['burn-in cloud could not determine score FAILED_DID_NOT_MEET_THRESHOLD 1'] = [
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)",
      "codeFrame": {
        "line": 12,
        "column": 26,
        "originalFile": "cypress/e2e/deterministic-flaky.cy.js",
        "relativeFile": "cypress/e2e/deterministic-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "NONE"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)",
      "codeFrame": {
        "line": 12,
        "column": 26,
        "originalFile": "cypress/e2e/deterministic-flaky.cy.js",
        "relativeFile": "cypress/e2e/deterministic-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)",
      "codeFrame": {
        "line": 12,
        "column": 26,
        "originalFile": "cypress/e2e/deterministic-flaky.cy.js",
        "relativeFile": "cypress/e2e/deterministic-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": "FAILED_DID_NOT_MEET_THRESHOLD",
    "initialStrategy": "RETRY"
  }
]

exports['burn-in cloud could not determine score FAILED_STOPPED_ON_FLAKE 1'] = [
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)",
      "codeFrame": {
        "line": 12,
        "column": 26,
        "originalFile": "cypress/e2e/deterministic-flaky.cy.js",
        "relativeFile": "cypress/e2e/deterministic-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "NONE"
  },
  {
    "state": "passed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)",
      "codeFrame": {
        "line": 12,
        "column": 26,
        "originalFile": "cypress/e2e/deterministic-flaky.cy.js",
        "relativeFile": "cypress/e2e/deterministic-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": "FAILED_STOPPED_ON_FLAKE",
    "initialStrategy": "RETRY"
  }
]

exports['burn-in test is already burned-in PASSED_FIRST_ATTEMPT 1'] = [
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": "PASSED_FIRST_ATTEMPT",
    "initialStrategy": "NONE"
  }
]

exports['burn-in test is already burned-in PASSED_MET_THRESHOLD 1'] = [
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)",
      "codeFrame": {
        "line": 12,
        "column": 26,
        "originalFile": "cypress/e2e/deterministic-flaky.cy.js",
        "relativeFile": "cypress/e2e/deterministic-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "NONE"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)",
      "codeFrame": {
        "line": 12,
        "column": 26,
        "originalFile": "cypress/e2e/deterministic-flaky.cy.js",
        "relativeFile": "cypress/e2e/deterministic-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)",
      "codeFrame": {
        "line": 12,
        "column": 26,
        "originalFile": "cypress/e2e/deterministic-flaky.cy.js",
        "relativeFile": "cypress/e2e/deterministic-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": "PASSED_MET_THRESHOLD",
    "initialStrategy": "RETRY"
  }
]

exports['burn-in test is already burned-in FAILED_REACHED_MAX_RETRIES 1'] = [
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)",
      "codeFrame": {
        "line": 12,
        "column": 26,
        "originalFile": "cypress/e2e/deterministic-flaky.cy.js",
        "relativeFile": "cypress/e2e/deterministic-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "NONE"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)",
      "codeFrame": {
        "line": 12,
        "column": 26,
        "originalFile": "cypress/e2e/deterministic-flaky.cy.js",
        "relativeFile": "cypress/e2e/deterministic-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)",
      "codeFrame": {
        "line": 12,
        "column": 26,
        "originalFile": "cypress/e2e/deterministic-flaky.cy.js",
        "relativeFile": "cypress/e2e/deterministic-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)",
      "codeFrame": {
        "line": 12,
        "column": 26,
        "originalFile": "cypress/e2e/deterministic-flaky.cy.js",
        "relativeFile": "cypress/e2e/deterministic-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": "FAILED_REACHED_MAX_RETRIES",
    "initialStrategy": "RETRY"
  }
]

exports['burn-in test is already burned-in FAILED_DID_NOT_MEET_THRESHOLD 1'] = [
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)",
      "codeFrame": {
        "line": 12,
        "column": 26,
        "originalFile": "cypress/e2e/deterministic-flaky.cy.js",
        "relativeFile": "cypress/e2e/deterministic-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "NONE"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)",
      "codeFrame": {
        "line": 12,
        "column": 26,
        "originalFile": "cypress/e2e/deterministic-flaky.cy.js",
        "relativeFile": "cypress/e2e/deterministic-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "RETRY"
  },
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)",
      "codeFrame": {
        "line": 12,
        "column": 26,
        "originalFile": "cypress/e2e/deterministic-flaky.cy.js",
        "relativeFile": "cypress/e2e/deterministic-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": "FAILED_DID_NOT_MEET_THRESHOLD",
    "initialStrategy": "RETRY"
  }
]

exports['burn-in test is already burned-in FAILED_STOPPED_ON_FLAKE 1'] = [
  {
    "state": "failed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)",
      "codeFrame": {
        "line": 12,
        "column": 26,
        "originalFile": "cypress/e2e/deterministic-flaky.cy.js",
        "relativeFile": "cypress/e2e/deterministic-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "NONE"
  },
  {
    "state": "passed",
    "error": {
      "name": "AssertionError",
      "message": "expected true to be false",
      "stack": "    at Context.eval (webpack:///./cypress/e2e/deterministic-flaky.cy.js:12:25)",
      "codeFrame": {
        "line": 12,
        "column": 26,
        "originalFile": "cypress/e2e/deterministic-flaky.cy.js",
        "relativeFile": "cypress/e2e/deterministic-flaky.cy.js",
        "absoluteFile": "/path/to/absoluteFile",
        "frame": "  10 |       expect(true).to.be.true\n  11 |     } else {\n> 12 |       expect(true).to.be.false\n     |                          ^\n  13 |     }\n  14 |   })\n  15 | })",
        "language": "js"
      }
    },
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": "FAILED_STOPPED_ON_FLAKE",
    "initialStrategy": "RETRY"
  }
]

exports['burn-in override default burn-in config PASSED_BURN_IN 1'] = [
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "NONE"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": null,
    "initialStrategy": "BURN_IN"
  },
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": "PASSED_BURN_IN",
    "initialStrategy": "BURN_IN"
  }
]

exports['burn-in override burn-in not allowed PASSED_FIRST_ATTEMPT 1'] = [
  {
    "state": "passed",
    "error": null,
    "timings": {
      "lifecycle": "Any.Number",
      "test": {
        "fnDuration": "Any.Number",
        "afterFnDuration": "Any.Number"
      }
    },
    "failedFromHookId": null,
    "wallClockStartedAt": "Any.ISODate",
    "wallClockDuration": "Any.Number",
    "videoTimestamp": null,
    "reasonToStop": "PASSED_FIRST_ATTEMPT",
    "initialStrategy": "NONE"
  }
]

exports['burn-in modified/new test FAILED_HOOK_FAILED with all failing hooks 1'] = [
  [
    {
      "state": "failed",
      "error": {
        "name": "AssertionError",
        "message": "before - before hooks\n\nBecause this error occurred during a `before all` hook we are skipping the remaining tests in the current suite: `before hooks`",
        "stack": "    at Context.eval (webpack:///./cypress/e2e/support/generate-mocha-tests.js:55:14)",
        "codeFrame": {
          "line": 55,
          "column": 15,
          "originalFile": "cypress/e2e/support/generate-mocha-tests.js",
          "relativeFile": "cypress/e2e/support/generate-mocha-tests.js",
          "absoluteFile": "/path/to/absoluteFile",
          "frame": "  53 |           debug(`hook fail: ${type}`)\n  54 | \n> 55 |           win.assert(false, message)\n     |               ^\n  56 | \n  57 |           throw new Error(`hook failed: ${type}`)\n  58 |         }",
          "language": "js"
        }
      },
      "timings": {
        "lifecycle": "Any.Number",
        "before all": [
          {
            "hookId": "h1",
            "fnDuration": "Any.Number",
            "afterFnDuration": "Any.Number"
          }
        ]
      },
      "failedFromHookId": "h1",
      "wallClockStartedAt": "Any.ISODate",
      "wallClockDuration": "Any.Number",
      "videoTimestamp": null,
      "reasonToStop": "FAILED_HOOK_FAILED",
      "initialStrategy": "NONE"
    }
  ],
  [
    {
      "state": "failed",
      "error": {
        "name": "AssertionError",
        "message": "beforeEach - beforeEach hooks\n\nBecause this error occurred during a `before each` hook we are skipping the remaining tests in the current suite: `beforeEach hooks`",
        "stack": "    at Context.eval (webpack:///./cypress/e2e/support/generate-mocha-tests.js:55:14)",
        "codeFrame": {
          "line": 55,
          "column": 15,
          "originalFile": "cypress/e2e/support/generate-mocha-tests.js",
          "relativeFile": "cypress/e2e/support/generate-mocha-tests.js",
          "absoluteFile": "/path/to/absoluteFile",
          "frame": "  53 |           debug(`hook fail: ${type}`)\n  54 | \n> 55 |           win.assert(false, message)\n     |               ^\n  56 | \n  57 |           throw new Error(`hook failed: ${type}`)\n  58 |         }",
          "language": "js"
        }
      },
      "timings": {
        "lifecycle": "Any.Number",
        "before each": [
          {
            "hookId": "h2",
            "fnDuration": "Any.Number",
            "afterFnDuration": "Any.Number"
          }
        ]
      },
      "failedFromHookId": "h2",
      "wallClockStartedAt": "Any.ISODate",
      "wallClockDuration": "Any.Number",
      "videoTimestamp": null,
      "reasonToStop": "FAILED_HOOK_FAILED",
      "initialStrategy": "NONE"
    }
  ],
  [
    {
      "state": "failed",
      "error": {
        "name": "AssertionError",
        "message": "afterEach - afterEach hooks\n\nBecause this error occurred during a `after each` hook we are skipping the remaining tests in the current suite: `afterEach hooks`",
        "stack": "    at Context.eval (webpack:///./cypress/e2e/support/generate-mocha-tests.js:55:14)",
        "codeFrame": {
          "line": 55,
          "column": 15,
          "originalFile": "cypress/e2e/support/generate-mocha-tests.js",
          "relativeFile": "cypress/e2e/support/generate-mocha-tests.js",
          "absoluteFile": "/path/to/absoluteFile",
          "frame": "  53 |           debug(`hook fail: ${type}`)\n  54 | \n> 55 |           win.assert(false, message)\n     |               ^\n  56 | \n  57 |           throw new Error(`hook failed: ${type}`)\n  58 |         }",
          "language": "js"
        }
      },
      "timings": {
        "lifecycle": "Any.Number",
        "test": {
          "fnDuration": "Any.Number",
          "afterFnDuration": "Any.Number"
        },
        "after each": [
          {
            "hookId": "h3",
            "fnDuration": "Any.Number",
            "afterFnDuration": "Any.Number"
          }
        ]
      },
      "failedFromHookId": "h3",
      "wallClockStartedAt": "Any.ISODate",
      "wallClockDuration": "Any.Number",
      "videoTimestamp": null,
      "reasonToStop": "FAILED_HOOK_FAILED",
      "initialStrategy": "NONE"
    }
  ],
  [
    {
      "state": "skipped",
      "error": null,
      "timings": null,
      "failedFromHookId": null,
      "wallClockStartedAt": null,
      "wallClockDuration": null,
      "videoTimestamp": null,
      "reasonToStop": null,
      "initialStrategy": null
    }
  ],
  [
    {
      "state": "passed",
      "error": null,
      "timings": {
        "lifecycle": "Any.Number",
        "test": {
          "fnDuration": "Any.Number",
          "afterFnDuration": "Any.Number"
        }
      },
      "failedFromHookId": null,
      "wallClockStartedAt": "Any.ISODate",
      "wallClockDuration": "Any.Number",
      "videoTimestamp": null,
      "reasonToStop": "PASSED_FIRST_ATTEMPT",
      "initialStrategy": "NONE"
    }
  ],
  [
    {
      "state": "failed",
      "error": {
        "name": "AssertionError",
        "message": "after - after hooks\n\nBecause this error occurred during a `after all` hook we are skipping the remaining tests in the current suite: `after hooks`",
        "stack": "    at Context.eval (webpack:///./cypress/e2e/support/generate-mocha-tests.js:55:14)",
        "codeFrame": {
          "line": 55,
          "column": 15,
          "originalFile": "cypress/e2e/support/generate-mocha-tests.js",
          "relativeFile": "cypress/e2e/support/generate-mocha-tests.js",
          "absoluteFile": "/path/to/absoluteFile",
          "frame": "  53 |           debug(`hook fail: ${type}`)\n  54 | \n> 55 |           win.assert(false, message)\n     |               ^\n  56 | \n  57 |           throw new Error(`hook failed: ${type}`)\n  58 |         }",
          "language": "js"
        }
      },
      "timings": {
        "lifecycle": "Any.Number",
        "test": {
          "fnDuration": "Any.Number",
          "afterFnDuration": "Any.Number"
        },
        "after all": [
          {
            "hookId": "h4",
            "fnDuration": "Any.Number",
            "afterFnDuration": "Any.Number"
          }
        ]
      },
      "failedFromHookId": "h4",
      "wallClockStartedAt": "Any.ISODate",
      "wallClockDuration": "Any.Number",
      "videoTimestamp": null,
      "reasonToStop": "FAILED_HOOK_FAILED",
      "initialStrategy": "NONE"
    }
  ]
]
