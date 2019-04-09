exports['lib/reporter #stats has reporterName stats, reporterStats, etc 1'] = {
  "stats": {
    "suites": 2,
    "tests": 2,
    "passes": 0,
    "pending": 1,
    "skipped": 0,
    "failures": 1,
    "wallClockDuration": 0
  },
  "reporter": "foo",
  "reporterStats": {
    "suites": 0,
    "tests": 1,
    "passes": 0,
    "pending": 0,
    "failures": 1
  },
  "hooks": [],
  "tests": [
    {
      "testId": "r4",
      "title": [
        "TodoMVC - React",
        "When page is initially opened",
        "should focus on the todo input field"
      ],
      "state": "failed",
      "body": "",
      "stack": [
        1,
        2,
        3
      ],
      "error": "foo",
      "timings": null,
      "failedFromHookId": null,
      "wallClockStartedAt": null,
      "wallClockDuration": null,
      "videoTimestamp": null,
      "attemptIndex": 0
    },
    {
      "testId": "r5",
      "title": [
        "TodoMVC - React",
        "When page is initially opened",
        "does something good"
      ],
      "state": "pending",
      "body": "",
      "stack": null,
      "error": null,
      "timings": null,
      "failedFromHookId": null,
      "wallClockStartedAt": null,
      "wallClockDuration": null,
      "videoTimestamp": null,
      "attemptIndex": 0
    }
  ]
}
