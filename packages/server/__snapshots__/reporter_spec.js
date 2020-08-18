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
      "displayError": "SomeError: foo\nat foo:1:1\nat bar:1:1\nat baz:1:1",
      "attempts": [
        {
          "state": "failed",
          "error": {
            "name": "SomeError",
            "message": "foo",
            "stack": "at foo:1:1\nat bar:1:1\nat baz:1:1"
          },
          "timings": null,
          "failedFromHookId": null,
          "wallClockStartedAt": null,
          "wallClockDuration": null,
          "videoTimestamp": null
        }
      ]
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
      "displayError": null,
      "attempts": [
        {
          "state": "pending",
          "error": null,
          "timings": null,
          "failedFromHookId": null,
          "wallClockStartedAt": null,
          "wallClockDuration": null,
          "videoTimestamp": null
        }
      ]
    }
  ]
}
