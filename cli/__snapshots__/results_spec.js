exports['module api results'] = `
{
  "startedTestsAt": "2015-03-18T00:00:00.000Z",
  "endedTestsAt": "2015-03-18T00:00:00.000Z",
  "totalDuration": 100,
  "totalSuites": 2,
  "totalTests": 5,
  "totalPassed": 3,
  "totalPending": 0,
  "totalFailed": 2,
  "totalSkipped": 0,
  "runs": [
    {
      "stats": {
        "suites": 1,
        "tests": 3,
        "passes": 2,
        "pending": 0,
        "skipped": 0,
        "failures": 1,
        "duration": 100,
        "endedAt": "2015-03-18T00:00:00.000Z",
        "startedAt": "2015-03-18T00:00:00.000Z"
      },
      "reporter": "spec",
      "reporterStats": {
        "suites": 1,
        "tests": 3,
        "passes": 2,
        "pending": 0,
        "failures": 1,
        "start": "2015-03-18T00:00:00.000Z",
        "end": "2015-03-18T00:00:00.000Z",
        "duration": 100
      },
      "tests": [
        {
          "title": [
            "results spec 1",
            "test 1"
          ],
          "state": "passed",
          "displayError": null,
          "attempts": [
            {
              "state": "passed",
              "duration": 100,
              "startedAt": "2015-03-18T00:00:00.000Z"
            }
          ]
        },
        {
          "title": [
            "results spec 1",
            "test 2"
          ],
          "state": "passed",
          "displayError": null,
          "attempts": [
            {
              "state": "passed",
              "duration": 100,
              "startedAt": "2015-03-18T00:00:00.000Z"
            }
          ]
        },
        {
          "title": [
            "results spec 1",
            "test 3 (fails)"
          ],
          "state": "failed",
          "displayError": "AssertionError: Timed out retrying after 10ms: expected true to be false\\n    at Context.eval (webpack:///./cypress/e2e/spec-1.cy.js:23:18)",
          "attempts": [
            {
              "state": "failed",
              "duration": 100,
              "startedAt": "2015-03-18T00:00:00.000Z"
            },
            {
              "state": "failed",
              "duration": 100,
              "startedAt": "2015-03-18T00:00:00.000Z"
            }
          ]
        }
      ],
      "error": null,
      "video": null,
      "spec": {
        "name": "spec-1.cy.js",
        "relative": "cypress/e2e/spec-1.cy.js",
        "absolute": "/path/to/absolute"
      }
    },
    {
      "stats": {
        "suites": 1,
        "tests": 2,
        "passes": 1,
        "pending": 0,
        "skipped": 0,
        "failures": 1,
        "duration": 100,
        "endedAt": "2015-03-18T00:00:00.000Z",
        "startedAt": "2015-03-18T00:00:00.000Z"
      },
      "reporter": "spec",
      "reporterStats": {
        "suites": 1,
        "tests": 2,
        "passes": 1,
        "pending": 0,
        "failures": 1,
        "start": "2015-03-18T00:00:00.000Z",
        "end": "2015-03-18T00:00:00.000Z",
        "duration": 100
      },
      "tests": [
        {
          "title": [
            "results spec 1",
            "test 1 (fails)"
          ],
          "state": "failed",
          "displayError": "AssertionError: Timed out retrying after 10ms: expected true to be false\\n    at Context.eval (webpack:///./cypress/e2e/spec-2.cy.js:13:18)",
          "attempts": [
            {
              "state": "failed",
              "duration": 100,
              "startedAt": "2015-03-18T00:00:00.000Z"
            },
            {
              "state": "failed",
              "duration": 100,
              "startedAt": "2015-03-18T00:00:00.000Z"
            }
          ]
        },
        {
          "title": [
            "results spec 1",
            "test 2"
          ],
          "state": "passed",
          "displayError": null,
          "attempts": [
            {
              "state": "passed",
              "duration": 100,
              "startedAt": "2015-03-18T00:00:00.000Z"
            }
          ]
        }
      ],
      "error": null,
      "video": null,
      "spec": {
        "name": "spec-2.cy.js",
        "relative": "cypress/e2e/spec-2.cy.js",
        "absolute": "/path/to/absolute"
      }
    }
  ],
  "browserPath": "",
  "browserName": "electron",
  "browserVersion": "X.Y.Z",
  "osName": "linux",
  "osVersion": "X.Y.Z",
  "cypressVersion": "X.Y.Z",
  "config": {
    "supportFile": false,
    "projectRoot": "/path/to/projectRoot",
    "projectName": "results-project",
    "configFile": "cypress.config.js",
    "isTextTerminal": true,
    "animationDistanceThreshold": 5,
    "arch": "x64",
    "baseUrl": null,
    "blockHosts": null,
    "chromeWebSecurity": true,
    "clientCertificates": [],
    "defaultCommandTimeout": 4000,
    "downloadsFolder": "/path/to/downloadsFolder",
    "env": {},
    "execTimeout": 60000,
    "experimentalCspAllowList": false,
    "experimentalFetchPolyfill": false,
    "experimentalInteractiveRunEvents": false,
    "experimentalRunAllSpecs": false,
    "experimentalMemoryManagement": false,
    "experimentalModifyObstructiveThirdPartyCode": false,
    "experimentalSkipDomainInjection": null,
    "experimentalOriginDependencies": false,
    "experimentalSourceRewriting": false,
    "experimentalSingleTabRunMode": false,
    "experimentalStudio": false,
    "experimentalWebKitSupport": false,
    "fileServerFolder": "/path/to/fileServerFolder",
    "fixturesFolder": "/path/to/fixturesFolder",
    "excludeSpecPattern": "*.hot-update.js",
    "includeShadowDom": false,
    "keystrokeDelay": 0,
    "modifyObstructiveCode": true,
    "numTestsKeptInMemory": 0,
    "platform": "linux",
    "pageLoadTimeout": 60000,
    "port": 100,
    "projectId": null,
    "redirectionLimit": 20,
    "reporter": "spec",
    "reporterOptions": null,
    "requestTimeout": 5000,
    "resolvedNodePath": "/path/to/resolvedNodePath",
    "resolvedNodeVersion": "X.Y.Z",
    "responseTimeout": 30000,
    "retries": {
      "runMode": 0,
      "openMode": 0
    },
    "screenshotOnRunFailure": true,
    "screenshotsFolder": "/path/to/screenshotsFolder",
    "slowTestThreshold": 10000,
    "scrollBehavior": "top",
    "taskTimeout": 60000,
    "testIsolation": true,
    "trashAssetsBeforeRuns": true,
    "userAgent": null,
    "video": false,
    "videoCompression": false,
    "videosFolder": "/path/to/videosFolder",
    "viewportHeight": 660,
    "viewportWidth": 1000,
    "waitForAnimations": true,
    "watchForFileChanges": false,
    "specPattern": "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    "browsers": [
      {
        "name": "electron",
        "channel": "stable",
        "family": "chromium",
        "displayName": "Electron",
        "version": "X.Y.Z",
        "path": "",
        "majorVersion": "X"
      }
    ],
    "cypressBinaryRoot": "/path/to/cypressBinaryRoot",
    "hosts": null,
    "isInteractive": true,
    "version": "X.Y.Z",
    "protocolEnabled": false,
    "testingType": "e2e",
    "browser": null,
    "cypressInternalEnv": "development"
  },
  "screenshots": [
    {
      "name": "test 1 screenshot",
      "takenAt": "2015-03-18T00:00:00.000Z",
      "path": "/path/to/path",
      "height": 660,
      "width": 1000
    },
    {
      "name": "test 2 screenshot",
      "takenAt": "2015-03-18T00:00:00.000Z",
      "path": "/path/to/path",
      "height": 660,
      "width": 1000
    },
    {
      "name": null,
      "takenAt": "2015-03-18T00:00:00.000Z",
      "path": "/path/to/path",
      "height": 720,
      "width": 1280
    },
    {
      "name": null,
      "takenAt": "2015-03-18T00:00:00.000Z",
      "path": "/path/to/path",
      "height": 720,
      "width": 1280
    },
    {
      "name": null,
      "takenAt": "2015-03-18T00:00:00.000Z",
      "path": "/path/to/path",
      "height": 720,
      "width": 1280
    },
    {
      "name": null,
      "takenAt": "2015-03-18T00:00:00.000Z",
      "path": "/path/to/path",
      "height": 720,
      "width": 1280
    },
    {
      "name": "test 2 screenshot",
      "takenAt": "2015-03-18T00:00:00.000Z",
      "path": "/path/to/path",
      "height": 660,
      "width": 1000
    }
  ],
  "stats": {
    "duration": 100,
    "startedAt": "2015-03-18T00:00:00.000Z",
    "endedAt": "2015-03-18T00:00:00.000Z"
  }
}
`

exports['after:run results'] = `
{
  "startedTestsAt": "2015-03-18T00:00:00.000Z",
  "endedTestsAt": "2015-03-18T00:00:00.000Z",
  "totalDuration": 100,
  "totalSuites": 2,
  "totalTests": 5,
  "totalPassed": 3,
  "totalPending": 0,
  "totalFailed": 2,
  "totalSkipped": 0,
  "runs": [
    {
      "stats": {
        "suites": 1,
        "tests": 3,
        "passes": 2,
        "pending": 0,
        "skipped": 0,
        "failures": 1,
        "duration": 100,
        "endedAt": "2015-03-18T00:00:00.000Z",
        "startedAt": "2015-03-18T00:00:00.000Z"
      },
      "reporter": "spec",
      "reporterStats": {
        "suites": 1,
        "tests": 3,
        "passes": 2,
        "pending": 0,
        "failures": 1,
        "start": "2015-03-18T00:00:00.000Z",
        "end": "2015-03-18T00:00:00.000Z",
        "duration": 100
      },
      "tests": [
        {
          "title": [
            "results spec 1",
            "test 1"
          ],
          "state": "passed",
          "displayError": null,
          "attempts": [
            {
              "state": "passed",
              "duration": 100,
              "startedAt": "2015-03-18T00:00:00.000Z"
            }
          ]
        },
        {
          "title": [
            "results spec 1",
            "test 2"
          ],
          "state": "passed",
          "displayError": null,
          "attempts": [
            {
              "state": "passed",
              "duration": 100,
              "startedAt": "2015-03-18T00:00:00.000Z"
            }
          ]
        },
        {
          "title": [
            "results spec 1",
            "test 3 (fails)"
          ],
          "state": "failed",
          "displayError": "AssertionError: Timed out retrying after 10ms: expected true to be false\\n    at Context.eval (webpack:///./cypress/e2e/spec-1.cy.js:23:18)",
          "attempts": [
            {
              "state": "failed",
              "duration": 100,
              "startedAt": "2015-03-18T00:00:00.000Z"
            },
            {
              "state": "failed",
              "duration": 100,
              "startedAt": "2015-03-18T00:00:00.000Z"
            }
          ]
        }
      ],
      "error": null,
      "video": null,
      "spec": {
        "name": "spec-1.cy.js",
        "relative": "cypress/e2e/spec-1.cy.js",
        "absolute": "/path/to/absolute"
      }
    },
    {
      "stats": {
        "suites": 1,
        "tests": 2,
        "passes": 1,
        "pending": 0,
        "skipped": 0,
        "failures": 1,
        "duration": 100,
        "endedAt": "2015-03-18T00:00:00.000Z",
        "startedAt": "2015-03-18T00:00:00.000Z"
      },
      "reporter": "spec",
      "reporterStats": {
        "suites": 1,
        "tests": 2,
        "passes": 1,
        "pending": 0,
        "failures": 1,
        "start": "2015-03-18T00:00:00.000Z",
        "end": "2015-03-18T00:00:00.000Z",
        "duration": 100
      },
      "tests": [
        {
          "title": [
            "results spec 1",
            "test 1 (fails)"
          ],
          "state": "failed",
          "displayError": "AssertionError: Timed out retrying after 10ms: expected true to be false\\n    at Context.eval (webpack:///./cypress/e2e/spec-2.cy.js:13:18)",
          "attempts": [
            {
              "state": "failed",
              "duration": 100,
              "startedAt": "2015-03-18T00:00:00.000Z"
            },
            {
              "state": "failed",
              "duration": 100,
              "startedAt": "2015-03-18T00:00:00.000Z"
            }
          ]
        },
        {
          "title": [
            "results spec 1",
            "test 2"
          ],
          "state": "passed",
          "displayError": null,
          "attempts": [
            {
              "state": "passed",
              "duration": 100,
              "startedAt": "2015-03-18T00:00:00.000Z"
            }
          ]
        }
      ],
      "error": null,
      "video": null,
      "spec": {
        "name": "spec-2.cy.js",
        "relative": "cypress/e2e/spec-2.cy.js",
        "absolute": "/path/to/absolute"
      }
    }
  ],
  "browserPath": "",
  "browserName": "electron",
  "browserVersion": "X.Y.Z",
  "osName": "linux",
  "osVersion": "X.Y.Z",
  "cypressVersion": "X.Y.Z",
  "config": {
    "supportFile": false,
    "projectRoot": "/path/to/projectRoot",
    "projectName": "results-project",
    "configFile": "cypress.config.js",
    "isTextTerminal": true,
    "animationDistanceThreshold": 5,
    "arch": "x64",
    "baseUrl": null,
    "blockHosts": null,
    "chromeWebSecurity": true,
    "clientCertificates": [],
    "defaultCommandTimeout": 4000,
    "downloadsFolder": "/path/to/downloadsFolder",
    "env": {},
    "execTimeout": 60000,
    "experimentalCspAllowList": false,
    "experimentalFetchPolyfill": false,
    "experimentalInteractiveRunEvents": false,
    "experimentalRunAllSpecs": false,
    "experimentalMemoryManagement": false,
    "experimentalModifyObstructiveThirdPartyCode": false,
    "experimentalSkipDomainInjection": null,
    "experimentalOriginDependencies": false,
    "experimentalSourceRewriting": false,
    "experimentalSingleTabRunMode": false,
    "experimentalStudio": false,
    "experimentalWebKitSupport": false,
    "fileServerFolder": "/path/to/fileServerFolder",
    "fixturesFolder": "/path/to/fixturesFolder",
    "excludeSpecPattern": "*.hot-update.js",
    "includeShadowDom": false,
    "keystrokeDelay": 0,
    "modifyObstructiveCode": true,
    "numTestsKeptInMemory": 0,
    "platform": "linux",
    "pageLoadTimeout": 60000,
    "port": 100,
    "projectId": null,
    "redirectionLimit": 20,
    "reporter": "spec",
    "reporterOptions": null,
    "requestTimeout": 5000,
    "resolvedNodePath": "/path/to/resolvedNodePath",
    "resolvedNodeVersion": "X.Y.Z",
    "responseTimeout": 30000,
    "retries": {
      "runMode": 0,
      "openMode": 0
    },
    "screenshotOnRunFailure": true,
    "screenshotsFolder": "/path/to/screenshotsFolder",
    "slowTestThreshold": 10000,
    "scrollBehavior": "top",
    "taskTimeout": 60000,
    "testIsolation": true,
    "trashAssetsBeforeRuns": true,
    "userAgent": null,
    "video": false,
    "videoCompression": false,
    "videosFolder": "/path/to/videosFolder",
    "viewportHeight": 660,
    "viewportWidth": 1000,
    "waitForAnimations": true,
    "watchForFileChanges": false,
    "specPattern": "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    "browsers": [
      {
        "name": "electron",
        "channel": "stable",
        "family": "chromium",
        "displayName": "Electron",
        "version": "X.Y.Z",
        "path": "",
        "majorVersion": "X"
      }
    ],
    "cypressBinaryRoot": "/path/to/cypressBinaryRoot",
    "hosts": null,
    "isInteractive": true,
    "version": "X.Y.Z",
    "protocolEnabled": false,
    "testingType": "e2e",
    "browser": null,
    "cypressInternalEnv": "development"
  },
  "screenshots": [
    {
      "name": "test 1 screenshot",
      "takenAt": "2015-03-18T00:00:00.000Z",
      "path": "/path/to/path",
      "height": 660,
      "width": 1000
    },
    {
      "name": "test 2 screenshot",
      "takenAt": "2015-03-18T00:00:00.000Z",
      "path": "/path/to/path",
      "height": 660,
      "width": 1000
    },
    {
      "name": null,
      "takenAt": "2015-03-18T00:00:00.000Z",
      "path": "/path/to/path",
      "height": 720,
      "width": 1280
    },
    {
      "name": null,
      "takenAt": "2015-03-18T00:00:00.000Z",
      "path": "/path/to/path",
      "height": 720,
      "width": 1280
    },
    {
      "name": null,
      "takenAt": "2015-03-18T00:00:00.000Z",
      "path": "/path/to/path",
      "height": 720,
      "width": 1280
    },
    {
      "name": null,
      "takenAt": "2015-03-18T00:00:00.000Z",
      "path": "/path/to/path",
      "height": 720,
      "width": 1280
    },
    {
      "name": "test 2 screenshot",
      "takenAt": "2015-03-18T00:00:00.000Z",
      "path": "/path/to/path",
      "height": 660,
      "width": 1000
    }
  ],
  "stats": {
    "duration": 100,
    "startedAt": "2015-03-18T00:00:00.000Z",
    "endedAt": "2015-03-18T00:00:00.000Z"
  }
}
`

exports['after:spec results'] = `
{
  "spec": {
    "name": "spec-2.cy.js",
    "relative": "cypress/e2e/spec-2.cy.js",
    "absolute": "/path/to/absolute"
  },
  "results": {
    "stats": {
      "suites": 1,
      "tests": 2,
      "passes": 1,
      "pending": 0,
      "skipped": 0,
      "failures": 1,
      "duration": 100,
      "endedAt": "2015-03-18T00:00:00.000Z",
      "startedAt": "2015-03-18T00:00:00.000Z"
    },
    "reporter": "spec",
    "reporterStats": {
      "suites": 1,
      "tests": 2,
      "passes": 1,
      "pending": 0,
      "failures": 1,
      "start": "2015-03-18T00:00:00.000Z",
      "end": "2015-03-18T00:00:00.000Z",
      "duration": 100
    },
    "tests": [
      {
        "title": [
          "results spec 1",
          "test 1 (fails)"
        ],
        "state": "failed",
        "displayError": "AssertionError: Timed out retrying after 10ms: expected true to be false\\n    at Context.eval (webpack:///./cypress/e2e/spec-2.cy.js:13:18)",
        "attempts": [
          {
            "state": "failed",
            "duration": 100,
            "startedAt": "2015-03-18T00:00:00.000Z"
          },
          {
            "state": "failed",
            "duration": 100,
            "startedAt": "2015-03-18T00:00:00.000Z"
          }
        ]
      },
      {
        "title": [
          "results spec 1",
          "test 2"
        ],
        "state": "passed",
        "displayError": null,
        "attempts": [
          {
            "state": "passed",
            "duration": 100,
            "startedAt": "2015-03-18T00:00:00.000Z"
          }
        ]
      }
    ],
    "error": null,
    "video": null,
    "spec": {
      "name": "spec-2.cy.js",
      "relative": "cypress/e2e/spec-2.cy.js",
      "absolute": "/path/to/absolute"
    }
  }
}
`
