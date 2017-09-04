exports['.verify logs error and exits when no version of Cypress is installed 1'] = `[31mError: No version of Cypress is installed.[39m
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

exports['.verify logs warning when installed version does not match package version 1'] = `[33mInstalled version [36mbloop[33m does not match the expected package version [36m1.2.3[33m[39m
[33m[39m
[33mNote: there is no guarantee these versions will work properly together.[39m

`

exports['.verify logs error and exits when executable cannot be found 1'] = `[31mError: No version of Cypress is installed.[39m
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

exports['.verify with force: true shows full path to executable when verifying 1'] = `[33mIt looks like this is your first time using Cypress: [36m1.2.3[33m[39m

[?25l [32m✔[39m [34m [32mVerified Cypress![34m [90m/path/to/executable/dir[34m[39m
[?25h`

exports['.verify with force: true clears verified version from state if verification fails 1'] = `[33mIt looks like this is your first time using Cypress: [36m1.2.3[33m[39m

[?25l [31m✖[39m [34m Verifying Cypress can run [90m/path/to/executable/dir[34m[39m
   [90m→ Cypress Version: 1.2.3[39m
[?25h[31mError: Cypress failed to start.[39m
[31m[39m
[31mThis is usually caused by a missing library or dependency.[39m
[31m[39m
[31mThe error below should indicate which dependency is missing.[39m
[31m[39m
[31mhttps://on.cypress.io/required-dependencies[39m
[31m[39m
[31mIf you using Docker, we provide containers with all required dependencies installed.[39m
[31m----------[39m
[31m[39m
[31man error about dependencies[39m
[31m----------[39m
[31m[39m
[31mPlatform: darwin (test release)[39m
[31mCypress Version: 1.2.3[39m
`

exports['.verify smoke test logs and runs when no version has been verified 1'] = `[33mIt looks like this is your first time using Cypress: [36m1.2.3[33m[39m

[?25l [32m✔[39m [34m [32mVerified Cypress![34m [90m/path/to/executable/dir[34m[39m
[?25h`

exports['.verify smoke test logs and runs when current version has not been verified 1'] = `[33mIt looks like this is your first time using Cypress: [36m1.2.3[33m[39m

[?25l [32m✔[39m [34m [32mVerified Cypress![34m [90m/path/to/executable/dir[34m[39m
[?25h`

exports['.verify smoke test on linux logs error and exits when starting xvfb fails 1'] = `[33mIt looks like this is your first time using Cypress: [36m1.2.3[33m[39m

[?25l [31m✖[39m [34m Verifying Cypress can run [90m/path/to/executable/dir[34m[39m
   [90m→ Cypress Version: 1.2.3[39m
[?25h[31mError: Your system is missing the dependency: XVFB[39m
[31m[39m
[31mInstall XVFB and run Cypress again.[39m
[31m[39m
[31mRead our documentation on dependencies for more information:[39m
[31m[39m
[31mhttps://on.cypress.io/required-dependencies[39m
[31m[39m
[31mIf you using Docker, we provide containers with all required dependencies installed.[39m
[31m----------[39m
[31m[39m
[31mCaught error trying to run XVFB: "test without xvfb"[39m
[31m----------[39m
[31m[39m
[31mPlatform: darwin (test release)[39m
[31mCypress Version: 1.2.3[39m
`

