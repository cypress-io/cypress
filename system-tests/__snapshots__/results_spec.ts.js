exports['module api and after:run results'] = `
{
  "browserName": "electron",
  "browserPath": "",
  "browserVersion": "X.Y.Z",
  "config": {
    "supportFile": false,
    "projectRoot": "/path/to/projectRoot",
    "projectName": "results",
    "configFile": "cypress.config.js",
    "isTextTerminal": true,
    "retries": 2,
    "animationDistanceThreshold": 5,
    "arch": "x64",
    "baseUrl": null,
    "blockHosts": null,
    "chromeWebSecurity": true,
    "clientCertificates": [],
    "defaultBrowser": null,
    "defaultCommandTimeout": 4000,
    "downloadsFolder": "/path/to/downloadsFolder",
    "env": {},
    "execTimeout": 60000,
    "experimentalCspAllowList": false,
    "experimentalInteractiveRunEvents": false,
    "experimentalRunAllSpecs": false,
    "experimentalMemoryManagement": false,
    "experimentalModifyObstructiveThirdPartyCode": false,
    "injectDocumentDomain": false,
    "experimentalOriginDependencies": false,
    "experimentalSourceRewriting": false,
    "experimentalSingleTabRunMode": false,
    "experimentalStudio": false,
    "experimentalWebKitSupport": false,
    "fileServerFolder": "/path/to/fileServerFolder",
    "fixturesFolder": "/path/to/fixturesFolder",
    "excludeSpecPattern": "*.hot-update.js",
    "includeShadowDom": false,
    "justInTimeCompile": true,
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
    "resolvedNodePath": null,
    "resolvedNodeVersion": "X.Y.Z",
    "responseTimeout": 30000,
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
        "channel": "stable",
        "displayName": "Electron",
        "family": "chromium",
        "majorVersion": "X",
        "name": "electron",
        "path": "",
        "version": "X.Y.Z"
      }
    ],
    "cypressBinaryRoot": "/path/to/cypressBinaryRoot",
    "hosts": null,
    "isInteractive": true,
    "version": "X.Y.Z",
    "testingType": "e2e",
    "browser": null,
    "cypressInternalEnv": "test"
  },
  "cypressVersion": "X.Y.Z",
  "endedTestsAt": "2015-03-18T00:00:00.000Z",
  "osName": "linux",
  "osVersion": "X.Y.Z",
  "runs": [
    {
      "error": null,
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
      "screenshots": [
        {
          "height": 660,
          "name": "test 1 screenshot",
          "path": "/path/to/path",
          "takenAt": "2015-03-18T00:00:00.000Z",
          "width": 1000
        },
        {
          "height": 660,
          "name": "test 3 screenshot",
          "path": "/path/to/path",
          "takenAt": "2015-03-18T00:00:00.000Z",
          "width": 1000
        },
        {
          "height": 720,
          "name": null,
          "path": "/path/to/path",
          "takenAt": "2015-03-18T00:00:00.000Z",
          "width": 1280
        },
        {
          "height": 660,
          "name": "test 3 screenshot",
          "path": "/path/to/path",
          "takenAt": "2015-03-18T00:00:00.000Z",
          "width": 1000
        },
        {
          "height": 720,
          "name": null,
          "path": "/path/to/path",
          "takenAt": "2015-03-18T00:00:00.000Z",
          "width": 1280
        }
      ],
      "spec": {
        "absolute": "/path/to/absolute",
        "fileExtension": ".js",
        "fileName": "spec-1",
        "name": "spec-1.cy.js",
        "relative": "cypress/e2e/spec-1.cy.js"
      },
      "stats": {
        "duration": 100,
        "endedAt": "2015-03-18T00:00:00.000Z",
        "failures": 1,
        "passes": 2,
        "pending": 0,
        "skipped": 0,
        "startedAt": "2015-03-18T00:00:00.000Z",
        "suites": 1,
        "tests": 3
      },
      "tests": [
        {
          "attempts": [
            {
              "state": "passed"
            }
          ],
          "displayError": null,
          "duration": 100,
          "state": "passed",
          "title": [
            "results spec 1",
            "test 1"
          ]
        },
        {
          "attempts": [
            {
              "state": "passed"
            }
          ],
          "displayError": null,
          "duration": 100,
          "state": "passed",
          "title": [
            "results spec 1",
            "test 2"
          ]
        },
        {
          "attempts": [
            {
              "state": "failed"
            },
            {
              "state": "failed"
            }
          ],
          "displayError": "AssertionError: Timed out retrying after 10ms: expected true to be false <stack lines>",
          "duration": 100,
          "state": "failed",
          "title": [
            "results spec 1",
            "test 3 (fails)"
          ]
        }
      ],
      "video": null
    },
    {
      "error": null,
      "reporter": "spec",
      "reporterStats": {
        "suites": 2,
        "tests": 4,
        "passes": 1,
        "pending": 0,
        "failures": 2,
        "start": "2015-03-18T00:00:00.000Z",
        "end": "2015-03-18T00:00:00.000Z",
        "duration": 100
      },
      "screenshots": [
        {
          "height": 660,
          "name": "test 1 screenshot",
          "path": "/path/to/path",
          "takenAt": "2015-03-18T00:00:00.000Z",
          "width": 1000
        },
        {
          "height": 720,
          "name": null,
          "path": "/path/to/path",
          "takenAt": "2015-03-18T00:00:00.000Z",
          "width": 1280
        },
        {
          "height": 660,
          "name": "test 1 screenshot",
          "path": "/path/to/path",
          "takenAt": "2015-03-18T00:00:00.000Z",
          "width": 1000
        },
        {
          "height": 720,
          "name": null,
          "path": "/path/to/path",
          "takenAt": "2015-03-18T00:00:00.000Z",
          "width": 1280
        },
        {
          "height": 660,
          "name": "test 2 screenshot",
          "path": "/path/to/path",
          "takenAt": "2015-03-18T00:00:00.000Z",
          "width": 1000
        },
        {
          "height": 720,
          "name": null,
          "path": "/path/to/path",
          "takenAt": "2015-03-18T00:00:00.000Z",
          "width": 1280
        }
      ],
      "spec": {
        "absolute": "/path/to/absolute",
        "fileExtension": ".js",
        "fileName": "spec-2",
        "name": "spec-2.cy.js",
        "relative": "cypress/e2e/spec-2.cy.js"
      },
      "stats": {
        "duration": 100,
        "endedAt": "2015-03-18T00:00:00.000Z",
        "failures": 2,
        "passes": 1,
        "pending": 0,
        "skipped": 1,
        "startedAt": "2015-03-18T00:00:00.000Z",
        "suites": 2,
        "tests": 4
      },
      "tests": [
        {
          "attempts": [
            {
              "state": "failed"
            },
            {
              "state": "failed"
            }
          ],
          "displayError": "AssertionError: Timed out retrying after 10ms: expected true to be false <stack lines>",
          "duration": 100,
          "state": "failed",
          "title": [
            "results spec 1",
            "test 1 (fails)"
          ]
        },
        {
          "attempts": [
            {
              "state": "passed"
            }
          ],
          "displayError": null,
          "duration": 100,
          "state": "passed",
          "title": [
            "results spec 1",
            "test 2"
          ]
        },
        {
          "attempts": [
            {
              "state": "failed"
            }
          ],
          "displayError": "Error: failure in beforeEach\\n\\nBecause this error occurred during a \`before each\` hook we are skipping the remaining tests in the current suite: \`has skipped tests\` <stack lines>",
          "duration": 100,
          "state": "failed",
          "title": [
            "results spec 1",
            "has skipped tests",
            "will be skipped #1"
          ]
        },
        {
          "attempts": [
            {
              "state": "skipped"
            }
          ],
          "displayError": null,
          "duration": 100,
          "state": "skipped",
          "title": [
            "results spec 1",
            "has skipped tests",
            "will be skipped #2"
          ]
        }
      ],
      "video": null
    }
  ],
  "startedTestsAt": "2015-03-18T00:00:00.000Z",
  "totalDuration": 100,
  "totalFailed": 3,
  "totalPassed": 3,
  "totalPending": 0,
  "totalSkipped": 1,
  "totalSuites": 3,
  "totalTests": 7
}
`

exports['after:spec results'] = `
{
  "spec": {
    "absolute": "/path/to/absolute",
    "fileExtension": ".js",
    "fileName": "spec-2",
    "name": "spec-2.cy.js",
    "relative": "cypress/e2e/spec-2.cy.js"
  },
  "results": {
    "error": null,
    "reporter": "spec",
    "reporterStats": {
      "suites": 2,
      "tests": 4,
      "passes": 1,
      "pending": 0,
      "failures": 2,
      "start": "2015-03-18T00:00:00.000Z",
      "end": "2015-03-18T00:00:00.000Z",
      "duration": 100
    },
    "screenshots": [
      {
        "height": 660,
        "name": "test 1 screenshot",
        "path": "/path/to/path",
        "takenAt": "2015-03-18T00:00:00.000Z",
        "width": 1000
      },
      {
        "height": 720,
        "name": null,
        "path": "/path/to/path",
        "takenAt": "2015-03-18T00:00:00.000Z",
        "width": 1280
      },
      {
        "height": 660,
        "name": "test 1 screenshot",
        "path": "/path/to/path",
        "takenAt": "2015-03-18T00:00:00.000Z",
        "width": 1000
      },
      {
        "height": 720,
        "name": null,
        "path": "/path/to/path",
        "takenAt": "2015-03-18T00:00:00.000Z",
        "width": 1280
      },
      {
        "height": 660,
        "name": "test 2 screenshot",
        "path": "/path/to/path",
        "takenAt": "2015-03-18T00:00:00.000Z",
        "width": 1000
      },
      {
        "height": 720,
        "name": null,
        "path": "/path/to/path",
        "takenAt": "2015-03-18T00:00:00.000Z",
        "width": 1280
      }
    ],
    "spec": {
      "absolute": "/path/to/absolute",
      "fileExtension": ".js",
      "fileName": "spec-2",
      "name": "spec-2.cy.js",
      "relative": "cypress/e2e/spec-2.cy.js"
    },
    "stats": {
      "duration": 100,
      "endedAt": "2015-03-18T00:00:00.000Z",
      "failures": 2,
      "passes": 1,
      "pending": 0,
      "skipped": 1,
      "startedAt": "2015-03-18T00:00:00.000Z",
      "suites": 2,
      "tests": 4
    },
    "tests": [
      {
        "attempts": [
          {
            "state": "failed"
          },
          {
            "state": "failed"
          }
        ],
        "displayError": "AssertionError: Timed out retrying after 10ms: expected true to be false <stack lines>",
        "duration": 100,
        "state": "failed",
        "title": [
          "results spec 1",
          "test 1 (fails)"
        ]
      },
      {
        "attempts": [
          {
            "state": "passed"
          }
        ],
        "displayError": null,
        "duration": 100,
        "state": "passed",
        "title": [
          "results spec 1",
          "test 2"
        ]
      },
      {
        "attempts": [
          {
            "state": "failed"
          }
        ],
        "displayError": "Error: failure in beforeEach\\n\\nBecause this error occurred during a \`before each\` hook we are skipping the remaining tests in the current suite: \`has skipped tests\` <stack lines>",
        "duration": 100,
        "state": "failed",
        "title": [
          "results spec 1",
          "has skipped tests",
          "will be skipped #1"
        ]
      },
      {
        "attempts": [
          {
            "state": "skipped"
          }
        ],
        "displayError": null,
        "duration": 100,
        "state": "skipped",
        "title": [
          "results spec 1",
          "has skipped tests",
          "will be skipped #2"
        ]
      }
    ],
    "video": null
  }
}
`
