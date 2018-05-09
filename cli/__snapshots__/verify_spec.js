exports['verbose stdout output 1'] = `
It looks like this is your first time using Cypress: 1.2.3

 ✔  Verified Cypress! /path/to/executable/dir

Opening Cypress...

`

exports['no version of Cypress installed 1'] = `
Error: No version of Cypress is installed.

Please reinstall Cypress by running: cypress install
----------

Cypress executable not found at: /path/to/executable
----------

Platform: darwin (test release)
Cypress Version: 1.2.3

`

exports['warning installed version does not match verified version 1'] = `
Installed version bloop does not match the expected package version 1.2.3

Note: there is no guarantee these versions will work properly together.


`

exports['executable cannot be found 1'] = `
Error: No version of Cypress is installed.

Please reinstall Cypress by running: cypress install
----------

Cypress executable not found at: /path/to/executable
----------

Platform: darwin (test release)
Cypress Version: 1.2.3

`

exports['verification with executable 1'] = `
It looks like this is your first time using Cypress: 1.2.3

 ✔  Verified Cypress! /path/to/executable/dir

Opening Cypress...

`

exports['fails verifying Cypress 1'] = `
It looks like this is your first time using Cypress: 1.2.3

 ✖  Verifying Cypress can run /path/to/executable/dir
STRIPPED
Error: Cypress failed to start.

This is usually caused by a missing library or dependency.

The error below should indicate which dependency is missing.

https://on.cypress.io/required-dependencies

If you are using Docker, we provide containers with all required dependencies installed.
----------

an error about dependencies
----------

Platform: darwin (test release)
Cypress Version: 1.2.3

`

exports['no existing version verified 1'] = `
It looks like this is your first time using Cypress: 1.2.3

 ✔  Verified Cypress! /path/to/executable/dir

Opening Cypress...

`

exports['current version has not been verified 1'] = `
Installed version different version does not match the expected package version 1.2.3

Note: there is no guarantee these versions will work properly together.

It looks like this is your first time using Cypress: different version

 ✔  Verified Cypress! /path/to/executable/dir

Opening Cypress...

`

exports['current version has not been verified 2'] = `
Installed version 9.8.7 does not match the expected package version 1.2.3

Note: there is no guarantee these versions will work properly together.

It looks like this is your first time using Cypress: 9.8.7

 ✔  Verified Cypress! /path/to/executable/dir

Opening Cypress...

`

exports['no welcome message 1'] = `
Installed version different version does not match the expected package version 1.2.3

Note: there is no guarantee these versions will work properly together.


`

exports['xvfb fails 1'] = `
It looks like this is your first time using Cypress: 1.2.3

 ✖  Verifying Cypress can run /path/to/executable/dir
STRIPPED
Error: Your system is missing the dependency: XVFB

Install XVFB and run Cypress again.

Read our documentation on dependencies for more information:

https://on.cypress.io/required-dependencies

If you are using Docker, we provide containers with all required dependencies installed.
----------

Caught error trying to run XVFB: "test without xvfb"
----------

Platform: darwin (test release)
Cypress Version: 1.2.3

`

exports['verifying in ci 1'] = `
It looks like this is your first time using Cypress: 1.2.3

[xx:xx:xx]  Verifying Cypress can run /path/to/executable/dir [started]
[xx:xx:xx]  Verifying Cypress can run /path/to/executable/dir [completed]

Opening Cypress...

`
