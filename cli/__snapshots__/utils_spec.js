exports['utils #getProgressBar mock bar prints title in mock bar 1'] = '[34mtest bar, please wait[39m'

exports['utils #getProgressBar mock bar prints message on completing the mock bar 1'] = `[34mtest bar, please wait[39m
[32mtest bar finished[39m`

exports['utils #verify logs error and exits when no version of Cypress is installed 1'] = `----------
No version of Cypress executable installed
Please reinstall Cypress and run the app again.
If the problem persists, search for an existing issue or open a GitHub issue at

https://github.com/cypress-io/cypress/issues
----------

Missing install

----------
Platform: darwin
Version: 16.7.0

[31m✖ Failed to verify Cypress executable.[39m

----------
No version of Cypress executable installed
Please reinstall Cypress and run the app again.
If the problem persists, search for an existing issue or open a GitHub issue at

https://github.com/cypress-io/cypress/issues
----------

Cypress executable not found at
/Users/chrisbreiding/Dev/cypress/cypress-monorepo/cli/dist/Cypress.app/Contents/MacOS/Cypress

----------
Platform: darwin
Version: 16.7.0

[31m✖ Failed to verify Cypress executable.[39m

[33m⧖ Verifying Cypress executable...[39m
----------
An unexpected error occurred while verifying the Cypress executable
Please search Cypress documentation for possible solutions

https://on.cypress.io

Find if there is a GitHub issue describing this crash

https://github.com/cypress-io/cypress/issues

Consider opening a new issue, if you are the first to discover this
----------

Smoke test returned wrong code.
command was: /Users/chrisbreiding/Dev/cypress/cypress-monorepo/cli/dist/Cypress.app/Contents/MacOS/Cypress --smoke-test --ping=187
returned:
Error: Smoke test returned wrong code.
command was: /Users/chrisbreiding/Dev/cypress/cypress-monorepo/cli/dist/Cypress.app/Contents/MacOS/Cypress --smoke-test --ping=187
returned:
at child.on (/Users/chrisbreiding/Dev/cypress/cypress-monorepo/cli/lib/tasks/verify.js:153:27)
at /Users/chrisbreiding/Dev/cypress/cypress-monorepo/cli/node_modules/sinon/lib/sinon/behavior.js:92:22
at _combinedTickCallback (internal/process/next_tick.js:67:7)
at process._tickCallback (internal/process/next_tick.js:98:9)
----------
Platform: darwin
Version: 16.7.0

[31m✖ Failed to verify Cypress executable.[39m
`

exports['utils #verify logs warning when installed version does not match package version 1'] = `[33m! Installed version (bloop) does not match package version (0.0.0)[39m
----------
No version of Cypress executable installed
Please reinstall Cypress and run the app again.
If the problem persists, search for an existing issue or open a GitHub issue at

https://github.com/cypress-io/cypress/issues
----------

Cypress executable not found at
/Users/chrisbreiding/Dev/cypress/cypress-monorepo/cli/dist/Cypress.app/Contents/MacOS/Cypress

----------
Platform: darwin
Version: 16.7.0

[31m✖ Failed to verify Cypress executable.[39m

[33m⧖ Verifying Cypress executable...[39m
----------
An unexpected error occurred while verifying the Cypress executable
Please search Cypress documentation for possible solutions

https://on.cypress.io

Find if there is a GitHub issue describing this crash

https://github.com/cypress-io/cypress/issues

Consider opening a new issue, if you are the first to discover this
----------

Smoke test returned wrong code.
command was: /Users/chrisbreiding/Dev/cypress/cypress-monorepo/cli/dist/Cypress.app/Contents/MacOS/Cypress --smoke-test --ping=7
returned:
Error: Smoke test returned wrong code.
command was: /Users/chrisbreiding/Dev/cypress/cypress-monorepo/cli/dist/Cypress.app/Contents/MacOS/Cypress --smoke-test --ping=7
returned:
at child.on (/Users/chrisbreiding/Dev/cypress/cypress-monorepo/cli/lib/tasks/verify.js:153:27)
at /Users/chrisbreiding/Dev/cypress/cypress-monorepo/cli/node_modules/sinon/lib/sinon/behavior.js:92:22
at _combinedTickCallback (internal/process/next_tick.js:67:7)
at process._tickCallback (internal/process/next_tick.js:98:9)
----------
Platform: darwin
Version: 16.7.0

[31m✖ Failed to verify Cypress executable.[39m
`

exports['utils #verify logs error and exits when executable cannot be found 1'] = `----------
No version of Cypress executable installed
Please reinstall Cypress and run the app again.
If the problem persists, search for an existing issue or open a GitHub issue at

https://github.com/cypress-io/cypress/issues
----------

Cypress executable not found at
/Users/chrisbreiding/Dev/cypress/cypress-monorepo/cli/dist/Cypress.app/Contents/MacOS/Cypress

----------
Platform: darwin
Version: 16.7.0

[31m✖ Failed to verify Cypress executable.[39m

[33m⧖ Verifying Cypress executable...[39m
----------
An unexpected error occurred while verifying the Cypress executable
Please search Cypress documentation for possible solutions

https://on.cypress.io

Find if there is a GitHub issue describing this crash

https://github.com/cypress-io/cypress/issues

Consider opening a new issue, if you are the first to discover this
----------

Smoke test returned wrong code.
command was: /Users/chrisbreiding/Dev/cypress/cypress-monorepo/cli/dist/Cypress.app/Contents/MacOS/Cypress --smoke-test --ping=733
returned:
Error: Smoke test returned wrong code.
command was: /Users/chrisbreiding/Dev/cypress/cypress-monorepo/cli/dist/Cypress.app/Contents/MacOS/Cypress --smoke-test --ping=733
returned:
at child.on (/Users/chrisbreiding/Dev/cypress/cypress-monorepo/cli/lib/tasks/verify.js:153:27)
at /Users/chrisbreiding/Dev/cypress/cypress-monorepo/cli/node_modules/sinon/lib/sinon/behavior.js:92:22
at _combinedTickCallback (internal/process/next_tick.js:67:7)
at process._tickCallback (internal/process/next_tick.js:98:9)
----------
Platform: darwin
Version: 16.7.0

[31m✖ Failed to verify Cypress executable.[39m
`

exports['utils #verify with force: true shows full path to executable when verifying 1'] = `[32m✓ Cypress executable found at:[39m [36m/Users/chrisbreiding/Dev/cypress/cypress-monorepo/cli/dist/Cypress.app/Contents/MacOS/Cypress[39m
[33m⧖ Verifying Cypress executable...[39m
[32m✓ Successfully verified Cypress executable[39m`

exports['utils #verify with force: true runs smoke test even if version already verified 1'] = `[32m✓ Cypress executable found at:[39m [36m/Users/chrisbreiding/Dev/cypress/cypress-monorepo/cli/dist/Cypress.app/Contents/MacOS/Cypress[39m
[33m⧖ Verifying Cypress executable...[39m
[32m✓ Successfully verified Cypress executable[39m`

exports['utils #verify smoke test logs and runs when no version has been verified 1'] = `[32m✓ Cypress executable found at:[39m [36m/Users/chrisbreiding/Dev/cypress/cypress-monorepo/cli/dist/Cypress.app/Contents/MacOS/Cypress[39m
[33m⧖ Verifying Cypress executable...[39m
[32m✓ Successfully verified Cypress executable[39m`

exports['utils #verify smoke test logs and runs when current version has not been verified 1'] = `[32m✓ Cypress executable found at:[39m [36m/Users/chrisbreiding/Dev/cypress/cypress-monorepo/cli/dist/Cypress.app/Contents/MacOS/Cypress[39m
[33m⧖ Verifying Cypress executable...[39m
[32m✓ Successfully verified Cypress executable[39m`

exports['utils #verify smoke test logs stderr when it fails 1'] = `[32m✓ Cypress executable found at:[39m [36m/Users/chrisbreiding/Dev/cypress/cypress-monorepo/cli/dist/Cypress.app/Contents/MacOS/Cypress[39m
[33m⧖ Verifying Cypress executable...[39m
----------
Problem running Cypress application
This is usually caused by a missing library or dependency.
The error below should indicate which dependency is missing.
Read our doc on CI dependencies for more information:

https://on.cypress.io/required-dependencies
----------

the stderr output

----------
Platform: darwin
Version: 16.7.0

[31m✖ Failed to verify Cypress executable.[39m
`

exports['utils #verify smoke test logs success message and writes version when it succeeds 1'] = `[32m✓ Cypress executable found at:[39m [36m/Users/chrisbreiding/Dev/cypress/cypress-monorepo/cli/dist/Cypress.app/Contents/MacOS/Cypress[39m
[33m⧖ Verifying Cypress executable...[39m
[32m✓ Successfully verified Cypress executable[39m`

exports['utils #verify smoke test on linux logs error and exits when starting xvfb fails 1'] = `[32m✓ Cypress executable found at:[39m [36m/Users/chrisbreiding/Dev/cypress/cypress-monorepo/cli/dist/Cypress.app/Contents/MacOS/Cypress[39m
[33m⧖ Verifying Cypress executable...[39m
----------
Looks like your system is missing a must have dependency: XVFB
Install XVFB and run Cypress again.
Our CI documentation provides more information how to configure dependencies

https://on.cypress.io/required-dependencies
----------

Caught error trying to run XVFB: "test without xvfb"

----------
Platform: darwin
Version: 16.7.0

[31m✖ Failed to verify Cypress executable.[39m
`

