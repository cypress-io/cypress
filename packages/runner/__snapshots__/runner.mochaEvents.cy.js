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
      "overwrite": false,
      "startTime": "1970-01-01T00:00:00.000Z"
    }
  ]
]
