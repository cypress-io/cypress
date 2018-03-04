exports['lib/reporter #stats has reporterName and failingTests in stats 1'] = {
  "stats": {
    "suites": 2,
    "tests": 2,
    "passes": 0,
    "pending": 1,
    "skipped": 0,
    "failures": 1
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
      "clientId": "r4",
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
      "error": "foo"
    },
    {
      "title": [
        "TodoMVC - React",
        "When page is initially opened",
        "does something good"
      ],
      "state": "pending",
      "body": ""
    }
  ]
}

