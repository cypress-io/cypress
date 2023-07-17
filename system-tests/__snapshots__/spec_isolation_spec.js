exports['e2e spec_isolation / failing with retries enabled'] = `

====================================================================================================

  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:    1.2.3                                                                              │
  │ Browser:    FooBrowser 88                                                                      │
  │ Specs:      2 found (simple_failing_hook.cy.js, simple_retrying.cy.js)                         │
  │ Searched:   cypress/e2e/simple_failing_hook.cy.js, cypress/e2e/simple_retrying.cy.js           │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  simple_failing_hook.cy.js                                                       (1 of 2)


  simple failing hook spec
    beforeEach hooks
      (Attempt 1 of 2) never gets here
      1) "before each" hook for "never gets here"
    pending
      - is pending
    afterEach hooks
      (Attempt 1 of 2) runs this
      2) "after each" hook for "runs this"
    after hooks
      ✓ runs this
      3) "after all" hook for "fails on this"


  1 passing
  1 pending
  3 failing

  1) simple failing hook spec
       beforeEach hooks
         "before each" hook for "never gets here":
     Error: fail1

Because this error occurred during a \`before each\` hook we are skipping the remaining tests in the current suite: \`beforeEach hooks\`
      [stack trace lines]

  2) simple failing hook spec
       afterEach hooks
         "after each" hook for "runs this":
     Error: fail2

Because this error occurred during a \`after each\` hook we are skipping the remaining tests in the current suite: \`afterEach hooks\`
      [stack trace lines]

  3) simple failing hook spec
       after hooks
         "after all" hook for "fails on this":
     Error: fail3

Because this error occurred during a \`after all\` hook we are skipping the remaining tests in the current suite: \`after hooks\`

Although you have test retries enabled, we do not retry tests when \`before all\` or \`after all\` hooks fail
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        6                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      3                                                                                │
  │ Pending:      1                                                                                │
  │ Skipped:      1                                                                                │
  │ Screenshots:  5                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     simple_failing_hook.cy.js                                                        │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook s     (1280x720)
     pec -- beforeEach hooks -- never gets here (failed).png                                        
  -  /XXX/XXX/XXX/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook s     (1280x720)
     pec -- beforeEach hooks -- never gets here -- before each hook (failed) (attempt               
      2).png                                                                                        
  -  /XXX/XXX/XXX/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook s     (1280x720)
     pec -- afterEach hooks -- runs this -- after each hook (failed).png                            
  -  /XXX/XXX/XXX/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook s     (1280x720)
     pec -- afterEach hooks -- runs this -- after each hook (failed) (attempt 2).png                
  -  /XXX/XXX/XXX/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook s     (1280x720)
     pec -- after hooks -- fails on this -- after all hook (failed).png                             


────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                    
  Running:  simple_retrying.cy.js                                                           (2 of 2)


  simple retrying spec
    (Attempt 1 of 2) t1
    1) t1
    ✓ t2


  1 passing
  1 failing

  1) simple retrying spec
       t1:
     Error: t1 attempt #1
      [stack trace lines]




  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      1                                                                                │
  │ Failing:      1                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  2                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     X seconds                                                                        │
  │ Spec Ran:     simple_retrying.cy.js                                                            │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


  (Screenshots)

  -  /XXX/XXX/XXX/cypress/screenshots/simple_retrying.cy.js/simple retrying spec -- t     (1280x720)
     1 (failed).png                                                                                 
  -  /XXX/XXX/XXX/cypress/screenshots/simple_retrying.cy.js/simple retrying spec -- t     (1280x720)
     1 (failed) (attempt 2).png                                                                     


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✖  simple_failing_hook.cy.js                XX:XX        6        1        3        1        1 │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✖  simple_retrying.cy.js                    XX:XX        2        1        1        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✖  2 of 2 failed (100%)                     XX:XX        8        2        4        1        1  


`

exports['e2e spec_isolation fails [electron] 1'] = {
  'browserName': 'FooBrowser',
  'browserPath': 'path/to/browser',
  'browserVersion': '88',
  'config': {},
  'cypressVersion': '9.9.9',
  'endedTestsAt': '2018-02-01T20:14:19.323Z',
  'osName': 'FooOS',
  'osVersion': '1234',
  'runs': [
    {
      'error': null,
      'reporter': 'spec',
      'reporterStats': {
        'suites': 1,
        'tests': 1,
        'passes': 1,
        'pending': 0,
        'failures': 0,
        'start': '2018-02-01T20:14:19.323Z',
        'end': '2018-02-01T20:14:19.323Z',
        'duration': 1234,
      },
      'screenshots': [],
      'spec': {
        'absolute': '/foo/bar/.projects/e2e/cypress/e2e/simple_passing.cy.js',
        'fileExtension': '.js',
        'fileName': 'simple_passing',
        'name': 'simple_passing.cy.js',
        'relative': 'cypress/e2e/simple_passing.cy.js',
      },
      'stats': {
        'duration': 1234,
        'end': '2018-02-01T20:14:19.323Z',
        'failures': 0,
        'passes': 1,
        'pending': 0,
        'start': '2018-02-01T20:14:19.323Z',
        'suites': 1,
        'tests': 1,
      },
      'tests': [
        {
          'attempts': [
            {
              'state': 'passed',
            },
          ],
          'displayError': null,
          'duration': 1072,
          'state': 'passed',
          'title': [
            'simple passing spec',
            'passes',
          ],
        },
      ],
      'video': null,
    },
    {
      'error': null,
      'reporter': 'spec',
      'reporterStats': {
        'suites': 1,
        'tests': 3,
        'passes': 3,
        'pending': 0,
        'failures': 0,
        'start': '2018-02-01T20:14:19.323Z',
        'end': '2018-02-01T20:14:19.323Z',
        'duration': 1234,
      },
      'screenshots': [],
      'spec': {
        'absolute': '/foo/bar/.projects/e2e/cypress/e2e/simple_hooks.cy.js',
        'fileExtension': '.js',
        'fileName': 'simple_hooks',
        'name': 'simple_hooks.cy.js',
        'relative': 'cypress/e2e/simple_hooks.cy.js',
      },
      'stats': {
        'duration': 1234,
        'end': '2018-02-01T20:14:19.323Z',
        'failures': 0,
        'passes': 3,
        'pending': 0,
        'start': '2018-02-01T20:14:19.323Z',
        'suites': 1,
        'tests': 3,
      },
      'tests': [
        {
          'attempts': [
            {
              'state': 'passed',
            },
          ],
          'displayError': null,
          'duration': 573,
          'state': 'passed',
          'title': [
            'simple hooks spec',
            't1',
          ],
        },
        {
          'attempts': [
            {
              'state': 'passed',
            },
          ],
          'displayError': null,
          'duration': 460,
          'state': 'passed',
          'title': [
            'simple hooks spec',
            't2',
          ],
        },
        {
          'attempts': [
            {
              'state': 'passed',
            },
          ],
          'displayError': null,
          'duration': 541,
          'state': 'passed',
          'title': [
            'simple hooks spec',
            't3',
          ],
        },
      ],
      'video': null,
    },
    {
      'error': null,
      'reporter': 'spec',
      'reporterStats': {
        'suites': 1,
        'tests': 2,
        'passes': 0,
        'pending': 0,
        'failures': 2,
        'start': '2018-02-01T20:14:19.323Z',
        'end': '2018-02-01T20:14:19.323Z',
        'duration': 1234,
      },
      'screenshots': [
        {
          'height': 720,
          'name': null,
          'path': '/foo/bar/.projects/e2e/cypress/screenshots/simple_failing.cy.js/simple failing spec -- fails1 (failed).png',
          'takenAt': '2018-02-01T20:14:19.323Z',
          'width': 1280,
        },
        {
          'height': 720,
          'name': null,
          'path': '/foo/bar/.projects/e2e/cypress/screenshots/simple_failing.cy.js/simple failing spec -- fails2 (failed).png',
          'takenAt': '2018-02-01T20:14:19.323Z',
          'width': 1280,
        },
      ],
      'spec': {
        'absolute': '/foo/bar/.projects/e2e/cypress/e2e/simple_failing.cy.js',
        'fileExtension': '.js',
        'fileName': 'simple_failing',
        'name': 'simple_failing.cy.js',
        'relative': 'cypress/e2e/simple_failing.cy.js',
      },
      'stats': {
        'duration': 1234,
        'end': '2018-02-01T20:14:19.323Z',
        'failures': 2,
        'passes': 0,
        'pending': 0,
        'start': '2018-02-01T20:14:19.323Z',
        'suites': 1,
        'tests': 2,
      },
      'tests': [
        {
          'attempts': [
            {
              'state': 'failed',
            },
          ],
          'displayError': 'AssertionError: Timed out retrying after 100ms: expected true to be false\n      [stack trace lines]',
          'duration': 212,
          'state': 'failed',
          'title': [
            'simple failing spec',
            'fails1',
          ],
        },
        {
          'attempts': [
            {
              'state': 'failed',
            },
          ],
          'displayError': 'Error: fails2\n      [stack trace lines]',
          'duration': 91,
          'state': 'failed',
          'title': [
            'simple failing spec',
            'fails2',
          ],
        },
      ],
      'video': null,
    },
    {
      'error': null,
      'reporter': 'spec',
      'reporterStats': {
        'suites': 5,
        'tests': 5,
        'passes': 1,
        'pending': 1,
        'failures': 3,
        'start': '2018-02-01T20:14:19.323Z',
        'end': '2018-02-01T20:14:19.323Z',
        'duration': 1234,
      },
      'screenshots': [
        {
          'height': 720,
          'name': null,
          'path': '/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- beforeEach hooks -- never gets here -- before each hook (failed).png',
          'takenAt': '2018-02-01T20:14:19.323Z',
          'width': 1280,
        },
        {
          'height': 720,
          'name': null,
          'path': '/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- afterEach hooks -- runs this -- after each hook (failed).png',
          'takenAt': '2018-02-01T20:14:19.323Z',
          'width': 1280,
        },
        {
          'height': 720,
          'name': null,
          'path': '/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- after hooks -- fails on this -- after all hook (failed).png',
          'takenAt': '2018-02-01T20:14:19.323Z',
          'width': 1280,
        },
      ],
      'spec': {
        'absolute': '/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js',
        'fileExtension': '.js',
        'fileName': 'simple_failing_hook',
        'name': 'simple_failing_hook.cy.js',
        'relative': 'cypress/e2e/simple_failing_hook.cy.js',
      },
      'stats': {
        'duration': 1234,
        'end': '2018-02-01T20:14:19.323Z',
        'failures': 3,
        'passes': 1,
        'pending': 1,
        'start': '2018-02-01T20:14:19.323Z',
        'suites': 5,
        'tests': 6,
      },
      'tests': [
        {
          'attempts': [
            {
              'state': 'failed',
            },
          ],
          'displayError': 'Error: fail1\n\nBecause this error occurred during a `before each` hook we are skipping the remaining tests in the current suite: `beforeEach hooks`\n      [stack trace lines]',
          'duration': 78,
          'state': 'failed',
          'title': [
            'simple failing hook spec',
            'beforeEach hooks',
            'never gets here',
          ],
        },
        {
          'attempts': [
            {
              'state': 'pending',
            },
          ],
          'displayError': null,
          'duration': 0,
          'state': 'pending',
          'title': [
            'simple failing hook spec',
            'pending',
            'is pending',
          ],
        },
        {
          'attempts': [
            {
              'state': 'failed',
            },
          ],
          'displayError': 'Error: fail2\n\nBecause this error occurred during a `after each` hook we are skipping the remaining tests in the current suite: `afterEach hooks`\n      [stack trace lines]',
          'duration': 93,
          'state': 'failed',
          'title': [
            'simple failing hook spec',
            'afterEach hooks',
            'runs this',
          ],
        },
        {
          'attempts': [
            {
              'state': 'skipped',
            },
          ],
          'displayError': null,
          'duration': 0,
          'state': 'skipped',
          'title': [
            'simple failing hook spec',
            'afterEach hooks',
            'does not run this',
          ],
        },
        {
          'attempts': [
            {
              'state': 'passed',
            },
          ],
          'displayError': null,
          'duration': 10,
          'state': 'passed',
          'title': [
            'simple failing hook spec',
            'after hooks',
            'runs this',
          ],
        },
        {
          'attempts': [
            {
              'state': 'failed',
            },
          ],
          'displayError': 'Error: fail3\n\nBecause this error occurred during a `after all` hook we are skipping the remaining tests in the current suite: `after hooks`\n      [stack trace lines]',
          'duration': 95,
          'state': 'failed',
          'title': [
            'simple failing hook spec',
            'after hooks',
            'fails on this',
          ],
        },
      ],
      'video': null,
    },
  ],
  'startedTestsAt': '2018-02-01T20:14:19.323Z',
  'totalDuration': 5555,
  'totalFailed': 5,
  'totalPassed': 5,
  'totalPending': 1,
  'totalSkipped': 1,
  'totalSuites': 8,
  'totalTests': 12,
}

exports['e2e spec_isolation failing with retries enabled [electron] 1'] = {
  'browserName': 'FooBrowser',
  'browserPath': 'path/to/browser',
  'browserVersion': '88',
  'config': {},
  'cypressVersion': '9.9.9',
  'endedTestsAt': '2018-02-01T20:14:19.323Z',
  'osName': 'FooOS',
  'osVersion': '1234',
  'runs': [
    {
      'error': null,
      'reporter': 'spec',
      'reporterStats': {
        'suites': 5,
        'tests': 5,
        'passes': 1,
        'pending': 1,
        'failures': 3,
        'start': '2018-02-01T20:14:19.323Z',
        'end': '2018-02-01T20:14:19.323Z',
        'duration': 1234,
      },
      'screenshots': [
        {
          'height': 720,
          'name': null,
          'path': '/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- beforeEach hooks -- never gets here (failed).png',
          'takenAt': '2018-02-01T20:14:19.323Z',
          'width': 1280,
        },
        {
          'height': 720,
          'name': null,
          'path': '/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- beforeEach hooks -- never gets here -- before each hook (failed) (attempt 2).png',
          'takenAt': '2018-02-01T20:14:19.323Z',
          'width': 1280,
        },
        {
          'height': 720,
          'name': null,
          'path': '/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- afterEach hooks -- runs this -- after each hook (failed).png',
          'takenAt': '2018-02-01T20:14:19.323Z',
          'width': 1280,
        },
        {
          'height': 720,
          'name': null,
          'path': '/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- afterEach hooks -- runs this -- after each hook (failed) (attempt 2).png',
          'takenAt': '2018-02-01T20:14:19.323Z',
          'width': 1280,
        },
        {
          'height': 720,
          'name': null,
          'path': '/foo/bar/.projects/e2e/cypress/screenshots/simple_failing_hook.cy.js/simple failing hook spec -- after hooks -- fails on this -- after all hook (failed).png',
          'takenAt': '2018-02-01T20:14:19.323Z',
          'width': 1280,
        },
      ],
      'spec': {
        'absolute': '/foo/bar/.projects/e2e/cypress/e2e/simple_failing_hook.cy.js',
        'fileExtension': '.js',
        'fileName': 'simple_failing_hook',
        'name': 'simple_failing_hook.cy.js',
        'relative': 'cypress/e2e/simple_failing_hook.cy.js',
      },
      'stats': {
        'duration': 1234,
        'end': '2018-02-01T20:14:19.323Z',
        'failures': 3,
        'passes': 1,
        'pending': 1,
        'start': '2018-02-01T20:14:19.323Z',
        'suites': 5,
        'tests': 6,
      },
      'tests': [
        {
          'attempts': [
            {
              'state': 'failed',
            },
            {
              'state': 'failed',
            },
          ],
          'displayError': 'Error: fail1\n\nBecause this error occurred during a `before each` hook we are skipping the remaining tests in the current suite: `beforeEach hooks`\n      [stack trace lines]',
          'duration': 279,
          'state': 'failed',
          'title': [
            'simple failing hook spec',
            'beforeEach hooks',
            'never gets here',
          ],
        },
        {
          'attempts': [
            {
              'state': 'pending',
            },
          ],
          'displayError': null,
          'duration': 0,
          'state': 'pending',
          'title': [
            'simple failing hook spec',
            'pending',
            'is pending',
          ],
        },
        {
          'attempts': [
            {
              'state': 'failed',
            },
            {
              'state': 'failed',
            },
          ],
          'displayError': 'Error: fail2\n\nBecause this error occurred during a `after each` hook we are skipping the remaining tests in the current suite: `afterEach hooks`\n      [stack trace lines]',
          'duration': 224,
          'state': 'failed',
          'title': [
            'simple failing hook spec',
            'afterEach hooks',
            'runs this',
          ],
        },
        {
          'attempts': [
            {
              'state': 'skipped',
            },
          ],
          'displayError': null,
          'duration': 0,
          'state': 'skipped',
          'title': [
            'simple failing hook spec',
            'afterEach hooks',
            'does not run this',
          ],
        },
        {
          'attempts': [
            {
              'state': 'passed',
            },
          ],
          'displayError': null,
          'duration': 10,
          'state': 'passed',
          'title': [
            'simple failing hook spec',
            'after hooks',
            'runs this',
          ],
        },
        {
          'attempts': [
            {
              'state': 'failed',
            },
          ],
          'displayError': 'Error: fail3\n\nBecause this error occurred during a `after all` hook we are skipping the remaining tests in the current suite: `after hooks`\n\nAlthough you have test retries enabled, we do not retry tests when `before all` or `after all` hooks fail\n      [stack trace lines]',
          'duration': 115,
          'state': 'failed',
          'title': [
            'simple failing hook spec',
            'after hooks',
            'fails on this',
          ],
        },
      ],
      'video': null,
    },
    {
      'error': null,
      'reporter': 'spec',
      'reporterStats': {
        'suites': 1,
        'tests': 2,
        'passes': 1,
        'pending': 0,
        'failures': 1,
        'start': '2018-02-01T20:14:19.323Z',
        'end': '2018-02-01T20:14:19.323Z',
        'duration': 1234,
      },
      'screenshots': [
        {
          'height': 720,
          'name': null,
          'path': '/foo/bar/.projects/e2e/cypress/screenshots/simple_retrying.cy.js/simple retrying spec -- t1 (failed).png',
          'takenAt': '2018-02-01T20:14:19.323Z',
          'width': 1280,
        },
        {
          'height': 720,
          'name': null,
          'path': '/foo/bar/.projects/e2e/cypress/screenshots/simple_retrying.cy.js/simple retrying spec -- t1 (failed) (attempt 2).png',
          'takenAt': '2018-02-01T20:14:19.323Z',
          'width': 1280,
        },
      ],
      'spec': {
        'absolute': '/foo/bar/.projects/e2e/cypress/e2e/simple_retrying.cy.js',
        'fileExtension': '.js',
        'fileName': 'simple_retrying',
        'name': 'simple_retrying.cy.js',
        'relative': 'cypress/e2e/simple_retrying.cy.js',
      },
      'stats': {
        'duration': 1234,
        'end': '2018-02-01T20:14:19.323Z',
        'failures': 1,
        'passes': 1,
        'pending': 0,
        'start': '2018-02-01T20:14:19.323Z',
        'suites': 1,
        'tests': 2,
      },
      'tests': [
        {
          'attempts': [
            {
              'state': 'failed',
            },
            {
              'state': 'failed',
            },
          ],
          'displayError': 'Error: t1 attempt #1\n      [stack trace lines]',
          'duration': 180,
          'state': 'failed',
          'title': [
            'simple retrying spec',
            't1',
          ],
        },
        {
          'attempts': [
            {
              'state': 'passed',
            },
          ],
          'displayError': null,
          'duration': 10,
          'state': 'passed',
          'title': [
            'simple retrying spec',
            't2',
          ],
        },
      ],
      'video': null,
    },
  ],
  'startedTestsAt': '2018-02-01T20:14:19.323Z',
  'totalDuration': 5555,
  'totalFailed': 4,
  'totalPassed': 2,
  'totalPending': 1,
  'totalSkipped': 1,
  'totalSuites': 6,
  'totalTests': 8,
}
