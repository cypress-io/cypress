exports['no version of Cypress installed 1'] = `[31mError: No version of Cypress is installed.[39m
[31m[39m
[31mPlease reinstall Cypress by running: [36mcypress install[31m[39m
[31m----------[39m
[31m[39m
[31mCypress executable not found at: [36m/path/to/executable[31m[39m
[31m----------[39m
[31m[39m
[31mPlatform: darwin (test release)[39m
[31mCypress Version: 1.2.3[39m
`

exports['warning installed version does not match package version 1'] = `[33mInstalled version [36mbloop[33m does not match the expected package version [36m1.2.3[33m[39m
[33m[39m
[33mNote: there is no guarantee these versions will work properly together.[39m

`

exports['executable cannot be found 1'] = `[31mError: No version of Cypress is installed.[39m
[31m[39m
[31mPlease reinstall Cypress by running: [36mcypress install[31m[39m
[31m----------[39m
[31m[39m
[31mCypress executable not found at: [36m/path/to/executable[31m[39m
[31m----------[39m
[31m[39m
[31mPlatform: darwin (test release)[39m
[31mCypress Version: 1.2.3[39m
`

exports['verification with executable 1'] = `[33mIt looks like this is your first time using Cypress: [36m1.2.3[33m[39m

[?25l [32m✔[39m [34m [32mVerified Cypress![34m [90m/path/to/executable/dir[34m[39m
[?25h`

exports['fails verifying Cypress 1'] = `It looks like this is your first time using Cypress: 1.2.3

 ✖  Verifying Cypress can run /path/to/executable/dir
   → Cypress Version: 1.2.3
Error: Cypress failed to start.

This is usually caused by a missing library or dependency.

The error below should indicate which dependency is missing.

https://on.cypress.io/required-dependencies

If you using Docker, we provide containers with all required dependencies installed.
----------

an error about dependencies
----------

Platform: darwin (test release)
Cypress Version: 1.2.3
`

exports['no existing version verified 1'] = `[33mIt looks like this is your first time using Cypress: [36m1.2.3[33m[39m

[?25l [32m✔[39m [34m [32mVerified Cypress![34m [90m/path/to/executable/dir[34m[39m
[?25h`

exports['current version has not been verified 1'] = `[33mIt looks like this is your first time using Cypress: [36m1.2.3[33m[39m

[?25l [32m✔[39m [34m [32mVerified Cypress![34m [90m/path/to/executable/dir[34m[39m
[?25h`

exports['xvfb fails 1'] = `It looks like this is your first time using Cypress: 1.2.3

 ✖  Verifying Cypress can run /path/to/executable/dir
   → Cypress Version: 1.2.3
Error: Your system is missing the dependency: XVFB

Install XVFB and run Cypress again.

Read our documentation on dependencies for more information:

https://on.cypress.io/required-dependencies

If you using Docker, we provide containers with all required dependencies installed.
----------

Caught error trying to run XVFB: "test without xvfb"
----------

Platform: darwin (test release)
Cypress Version: 1.2.3
`

