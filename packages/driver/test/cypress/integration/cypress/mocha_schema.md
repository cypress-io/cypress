

## Events

A reporter should listen for events emitted from the `runner` (a singleton instance of [Runner]).

The event names are exported from the `constants` property of `Mocha.Runner`:

| Constant             | Event Name  | Event Arguments | Description                                                                                 |
|----------------------|-------------|-----------------|---------------------------------------------------------------------------------------------|
| `EVENT_RUN_BEGIN`    | `start`     | _(n/a)_         | Execution will begin.                                                                       |
| `EVENT_RUN_END`      | `end`       | _(n/a)_         | All [Suite]s, [Test]s and [Hook]s have completed execution.                                 |
| `EVENT_DELAY_BEGIN`  | `waiting`   | _(n/a)_         | Waiting for `global.run()` to be called; only emitted when [delay] option is `true`.        |
| `EVENT_DELAY_END`    | `ready`     | _(n/a)_         | User called `global.run()` and the root suite is ready to execute.                          |
| `EVENT_SUITE_BEGIN`  | `suite`     | `Suite`         | The [Hook]s and [Test]s within a [Suite] will be executed, including any nested [Suite]s.   |
| `EVENT_SUITE_END`    | `suite end` | `Suite`         | The [Hook]s, [Test]s, and nested [Suite]s within a [Suite] have completed execution.        |
| `EVENT_HOOK_BEGIN`   | `hook`      | `Hook`          | A [Hook] will be executed.                                                                  |
| `EVENT_HOOK_END`     | `hook end`  | `Hook`          | A [Hook] has completed execution.                                                           |
| `EVENT_TEST_BEGIN`   | `test`      | `Test`          | A [Test] will be executed.                                                                  |
| `EVENT_TEST_END`     | `test end`  | `Test`          | A [Test] has completed execution.                                                           |
| `EVENT_TEST_FAIL`    | `fail`      | `Test`, `Error` | A [Test] has failed or thrown an exception.                                                 |
| `EVENT_TEST_PASS`    | `pass`      | `Test`          | A [Test] has passed.                                                                        |
| `EVENT_TEST_PENDING` | `pending`   | `Test`          | A [Test] was skipped.                                                                       |
| `EVENT_TEST_RETRY`   | `retry`     | `Test`, `Error` | A [Test] failed, but is about to be retried; only emitted if the `retry` option is nonzero. |

**Please use these constants** instead of the event names in your own reporter! This will ensure compatibility with future versions of Mocha.

> It's important to understand that all `Suite` callbacks will be run _before_ the [Runner] emits `EVENT_RUN_BEGIN`. Hooks and tests, however, won't run until _after_ the [Runner] emits `EVENT_RUN_BEGIN`.

[runner]: /api/mocha.runner
[test]: /api/mocha.test
[hook]: /api/mocha.hook
[suite]: /api/mocha.suite
[base]: /api/mocha.reporters.base
[delay]: /#delayed-root-suite


Since we serialize events over the wire, we need to be able fully recreate the `mocha` instances via emitted events:


Here's how we re-create the mocha instance:
```js
createRunnable = (obj, parent) ->
  {body} = obj

  if body
    fn = ->
    fn.toString = -> body

  runnable = new Mocha.Test(obj.title, fn)
  runnable.timedOut = obj.timedOut
  runnable.async    = obj.async
  runnable.sync     = obj.sync
  runnable.duration = obj.duration
  runnable.state    = obj.state ? "skipped" ## skipped by default
  runnable.body     ?= body

  runnable.parent = parent if parent

  return runnable
```
since reporters can do `test.currentRetry()` and `test.retries()`, we need to add:
- `_currentRetry`
- `_retries`

no `final:boolean` property


### emit test runnable during events (serialized)



### Serialize state during run
in a similar format to what we yield to module API

```js
= {
  currentId: 'r6',
  tests: {
    r3: {
			id: 'r3',
      title: 'test 1',
      state: 'passed',
      body: 'stub',
      type: 'test',
      duration: 1,
      wallClockStartedAt: '1970-01-01T00:00:00.000Z',
			wallClockDuration: 1,
      timings: {
        lifecycle: 1,
        'before all': [
          {
            hookId: 'h1',
            fnDuration: 1,
            afterFnDuration: 1,
          },
        ],
        'before each': [
          {
            hookId: 'h2',
            fnDuration: 1,
            afterFnDuration: 1,
          },
        ],
        test: {
          fnDuration: 1,
          afterFnDuration: 1,
        },
        'after each': [
          {
            hookId: 'h3',
            fnDuration: 1,
            afterFnDuration: 1,
          },
        ],
        'after all': [
          {
            hookId: 'h4',
            fnDuration: 1,
            afterFnDuration: 1,
          },
        ],
			},
			// add this prop
			_currentRetry: 0,
			// add this prop
			_retries: 1,
      commands: [
        {
          actual: null,
          expected: undefined,
          end: true,
          snapshot: true,
          name: 'assert',
          message: 'before',
          passed: true,
          selector: undefined,
          type: 'parent',
          event: false,
          id: 1,
          state: 'passed',
          instrument: 'command',
          url: '',
          hookName: 'before all',
          testId: 'r3',
          testAttemptIndex: 0,
          viewportWidth: 1000,
          viewportHeight: 660,
          referencesAlias: undefined,
          alias: undefined,
          aliasType: undefined,
          snapshots: null,
          ended: true,
          err: null,
          consoleProps: {
            Command: 'assert',
            actual: null,
            expected: undefined,
            Message: 'before',
          },
          renderProps: {},
        },
        {
          actual: null,
          expected: undefined,
          end: true,
          snapshot: true,
          name: 'assert',
          message: 'beforeEach',
          passed: true,
          selector: undefined,
          type: 'parent',
          event: false,
          id: 2,
          state: 'passed',
          instrument: 'command',
          url: '',
          hookName: 'before each',
          testId: 'r3',
          testAttemptIndex: 0,
          viewportWidth: 1000,
          viewportHeight: 660,
          referencesAlias: undefined,
          alias: undefined,
          aliasType: undefined,
          snapshots: null,
          ended: true,
          err: null,
          consoleProps: {
            Command: 'assert',
            actual: null,
            expected: undefined,
            Message: 'beforeEach',
          },
          renderProps: {},
        },
        {
          actual: null,
          expected: undefined,
          end: true,
          snapshot: true,
          name: 'assert',
          message: 'afterEach',
          passed: true,
          selector: undefined,
          type: 'parent',
          event: false,
          id: 3,
          state: 'passed',
          instrument: 'command',
          url: '',
          hookName: 'after each',
          testId: 'r3',
          testAttemptIndex: 0,
          viewportWidth: 1000,
          viewportHeight: 660,
          referencesAlias: undefined,
          alias: undefined,
          aliasType: undefined,
          snapshots: null,
          ended: true,
          err: null,
          consoleProps: {
            Command: 'assert',
            actual: null,
            expected: undefined,
            Message: 'afterEach',
          },
          renderProps: {},
        },
        {
          actual: null,
          expected: undefined,
          end: true,
          snapshot: true,
          name: 'assert',
          message: 'after',
          passed: true,
          selector: undefined,
          type: 'parent',
          event: false,
          id: 4,
          state: 'passed',
          instrument: 'command',
          url: '',
          hookName: 'after all',
          testId: 'r3',
          testAttemptIndex: 0,
          viewportWidth: 1000,
          viewportHeight: 660,
          referencesAlias: undefined,
          alias: undefined,
          aliasType: undefined,
          snapshots: null,
          ended: true,
          err: null,
          consoleProps: {
            Command: 'assert',
            actual: null,
            expected: undefined,
            Message: 'after',
          },
          renderProps: {},
        },
			],
			// possibly undefined if no prevAttempts
      prevAttempts: [],
    },
    r5: {
      id: 'r5',
      title: 'test 1',
      state: 'passed',
      body: 'stub',
      type: 'test',
      duration: 1,
      wallClockStartedAt: '1970-01-01T00:00:00.000Z',
      wallClockDuration: 1,
      timings: {
        lifecycle: 1,
        test: {
          fnDuration: 1,
          afterFnDuration: 1,
        },
      },
			_currentRetry: 1,
			_retries: 1,
      prevAttempts: [
        {
          id: 'r5',
          title: 'test 1',
          err: {
            message: 'stub 2 fail',
            name: 'AssertionError',
            stack: '[err stack]',
            actual: null,
            expected: undefined,
            showDiff: false,
          },
          state: 'failed',
          body: 'stub',
          type: 'test',
          duration: 1,
          wallClockStartedAt: '1970-01-01T00:00:00.000Z',
          wallClockDuration: 1,
          timings: {
            lifecycle: 1,
            test: {
              fnDuration: 1,
              afterFnDuration: 1,
            },
					},
					_retries: 1
          _currentRetry: 0,
				}
			],
    },
  },
  startTime: '1970-01-01T00:00:00.000Z',
  emissions: {
    started: {
      r1: true,
      r2: true,
      r3: true,
      r4: true,
      r5: true,
      r6: true,
    },
    ended: {
      r3: true,
      r2: true,
      r5: true,
    },
  },
  passed: 2,
  failed: 0,
  pending: 0,
  numLogs: 4,
}
```




Our module API closely resembles a `JSON reporter`: https://github.com/mochajs/mocha/blob/master/lib/reporters/json.js

need to resolve with:
```js
{
  "startedTestsAt": "2018-02-01T20:14:19.323Z",
  "endedTestsAt": "2018-02-01T20:14:19.323Z",
  "totalDuration": 5555,
  "totalSuites": 8,
  "totalTests": 12,
  "totalFailed": 5,
  "totalPassed": 5,
  "totalPending": 1,
  "totalSkipped": 1,
  "runs": [
    {
      "stats": {
        "suites": 5,
        "tests": 6,
        "passes": 1,
        "pending": 1,
        "skipped": 1,
				"failures": 3,
				// add a "retried" stat
  			"retried": 0,
        "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
        "wallClockEndedAt": "2018-02-01T20:14:19.323Z",
        "wallClockDuration": 1234,
      },
      "reporter": "spec",
      "reporterStats": {
        "suites": 5,
        "tests": 4,
        "passes": 3,
        "pending": 1,
        "failures": 3,
        "start": "2018-02-01T20:14:19.323Z",
        "end": "2018-02-01T20:14:19.323Z",
        "duration": 1234
      },
      "hooks": [
        {
          "hookId": "h1",
          "hookName": "before each",
          "title": [
            "\"before each\" hook"
          ],
          "body": "function () {\n      throw new Error(\"fail1\");\n    }"
        },
        {
          "hookId": "h2",
          "hookName": "after each",
          "title": [
            "\"after each\" hook"
          ],
          "body": "function () {\n      throw new Error(\"fail2\");\n    }"
        },
        {
          "hookId": "h3",
          "hookName": "after all",
          "title": [
            "\"after all\" hook"
          ],
          "body": "function () {\n      throw new Error(\"fail3\");\n    }"
        }
      ],
      "tests": [
        {
          "testId": "r4",
          "title": [
            "simple failing hook spec",
            "beforeEach hooks",
            "never gets here"
					],
					"state": "passed",
					"body": "",
					"stack": null,
					"error": null,
					"failedFromHookId": null,
          "timings": {
            "lifecycle": 100,
            "before each": [
              {
                "hookId": "h1",
                "fnDuration": 400,
                "afterFnDuration": 200
              }
            ]
          },
          "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
          "wallClockDuration": 1234,
					"videoTimestamp": 9999,
					// Add "attemptIndex" to test runnables
					// we don't really need attemptIndex b/c it's the length of prevAttempts
					"attemptIndex": 1,
					// Add "prevAttempts" to test runnables
					"prevAttempts": [
							// don't really need attemptIndex
							"attemptIndex": 0,
              "failedFromHookId": "h1",
              "stack": "Error: fail1\n\nBecause this error occurred during a 'before each' hook we are skipping the remaining tests in the current suite: 'beforeEach hooks'\n    at stack trace line",
							"error": "fail1\n\nBecause this error occurred during a 'before each' hook we are skipping the remaining tests in the current suite: 'beforeEach hooks'",
  	          "wallClockStartedAt": "2018-02-01T20:14:19.323Z",
							"wallClockDuration": 1234,
              "timings": {
              "lifecycle": 100,
              "before each": [
								{
									"hookId": "h1",
									"fnDuration": 400,
									"afterFnDuration": 200
								}
              ]
            },
					]
        },
        {
          "testId": "r6",
          "title": [
            "simple failing hook spec",
            "pending",
            "is pending"
          ],
          "state": "passed",
          "body": "",
          "stack": null,
          "error": null,
          "timings": null,
          "failedFromHookId": null,
          "wallClockStartedAt": null,
          "wallClockDuration": null,
          "videoTimestamp": null,
          "attemptIndex": 0
      ],
      "error": null,
      "video": "/foo/bar/.projects/e2e/cypress/videos/abc123.mp4",
      "screenshots": [
        {
          "screenshotId": "some-random-id",
          "name": null,
          "testId": "r4",
          "takenAt": "2018-02-01T20:14:19.323Z",
          "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- beforeEach hooks -- never gets here -- before each hook (failed).png",
          "height": 720,
          "width": 1280
        },
        {
          "screenshotId": "some-random-id",
          "name": null,
          "testId": "r8",
          "takenAt": "2018-02-01T20:14:19.323Z",
          "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- afterEach hooks -- runs this -- after each hook (failed).png",
          "height": 720,
          "width": 1280
        },
        {
          "screenshotId": "some-random-id",
          "name": null,
          "testId": "r12",
          "takenAt": "2018-02-01T20:14:19.323Z",
          "path": "/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook_spec.coffee/simple failing hook spec -- after hooks -- fails on this -- after all hook (failed).png",
          "height": 720,
          "width": 1280
        }
      ],
      "spec": {
        "name": "simple_failing_hook_spec.coffee",
        "relative": "cypress/integration/simple_failing_hook_spec.coffee",
        "absolute": "/foo/bar/.projects/e2e/cypress/integration/simple_failing_hook_spec.coffee"
      },
      "shouldUploadVideo": true
    },
  ],
  "browserPath": "path/to/browser",
  "browserName": "FooBrowser",
  "browserVersion": "88",
  "osName": "FooOS",
  "osVersion": "1234",
  "cypressVersion": "9.9.9",
  "config": {}
}
```


