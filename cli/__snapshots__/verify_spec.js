exports['Cypress non-executable permissions 1'] = `
Error: Cypress cannot run because this binary file does not have executable permissions here:

/cache/Cypress/1.2.3/Cypress.app/Contents/MacOS/Cypress

Reasons this may happen:

- node was installed as 'root' or with 'sudo'
- the cypress npm package as 'root' or with 'sudo'

Please check that you have the appropriate user permissions.

You can also try clearing the cache with 'cypress cache clear' and reinstalling.

----------

Platform: darwin-x64 (Foo-OsVersion)
Cypress Version: 1.2.3

`

exports['current version has not been verified 1'] = `
It looks like this is your first time using Cypress: 1.2.3


⠋  Verified Cypress! /cache/Cypress/1.2.3/Cypress.app
✔  Verified Cypress! /cache/Cypress/1.2.3/Cypress.app
✔  Verified Cypress! /cache/Cypress/1.2.3/Cypress.app

Opening Cypress...

`

exports['darwin: error when invalid CYPRESS_RUN_BINARY 1'] = `
Note: You have set the environment variable:

CYPRESS_RUN_BINARY=/custom/

This overrides the default Cypress binary path used.

Error: Could not run binary set by environment variable: CYPRESS_RUN_BINARY=/custom/

Ensure the environment variable is a path to the Cypress binary, matching **/Contents/MacOS/Cypress

----------

ENOENT: no such file or directory, stat '/custom/'

----------

Platform: darwin-x64 (Foo-OsVersion)
Cypress Version: 1.2.3

`

exports['different version installed 1'] = `
Found binary version 7.8.9 installed in: /cache/Cypress/1.2.3/Cypress.app

⚠ Warning: Binary version 7.8.9 does not match the expected package version 1.2.3

  These versions may not work properly together.

It looks like this is your first time using Cypress: 7.8.9


⠋  Verified Cypress! /cache/Cypress/1.2.3/Cypress.app
✔  Verified Cypress! /cache/Cypress/1.2.3/Cypress.app
✔  Verified Cypress! /cache/Cypress/1.2.3/Cypress.app

Opening Cypress...

`

exports['error binary not found in ci 1'] = `
Error: The cypress npm package is installed, but the Cypress binary is missing.

We expected the binary to be installed here: /cache/Cypress/1.2.3/Cypress.app/Contents/MacOS/Cypress

Reasons it may be missing:

- You're caching 'node_modules' but are not caching this path: /cache/Cypress
- You ran 'npm install' at an earlier build step but did not persist: /cache/Cypress

Properly caching the binary will fix this error and avoid downloading and unzipping Cypress.

Alternatively, you can run 'cypress install' to download the binary again.

https://on.cypress.io/not-installed-ci-error

----------

Platform: darwin-x64 (Foo-OsVersion)
Cypress Version: 1.2.3

`

exports['executable cannot be found 1'] = `
Error: No version of Cypress is installed in: /cache/Cypress/1.2.3/Cypress.app

Please reinstall Cypress by running: cypress install

----------

Cypress executable not found at: /cache/Cypress/1.2.3/Cypress.app/Contents/MacOS/Cypress

----------

Platform: darwin-x64 (Foo-OsVersion)
Cypress Version: 1.2.3

`

exports['fails verifying Cypress 1'] = `
STRIPPED


Error: Cypress failed to start.

This may be due to a missing library or dependency. https://on.cypress.io/required-dependencies

Please refer to the error below for more details.

----------

an error about dependencies

----------

Platform: darwin-x64 (Foo-OsVersion)
Cypress Version: 1.2.3

`

exports['fails with no stderr 1'] = `
Error: Cypress failed to start.

This may be due to a missing library or dependency. https://on.cypress.io/required-dependencies

Please refer to the error below for more details.

----------

Error: EPERM NOT PERMITTED

----------

Platform: darwin-x64 (Foo-OsVersion)
Cypress Version: 1.2.3

`

exports['lib/tasks/verify logs error when child process hangs 1'] = `
STRIPPED



Error: Cypress verification timed out.

This command failed with the following output:

/cache/Cypress/1.2.3/Cypress.app/Contents/MacOS/Cypress --no-sandbox --smoke-test --ping=222

----------

some stderr

----------

Platform: darwin-x64 (Foo-OsVersion)
Cypress Version: 1.2.3

`

exports['lib/tasks/verify logs error when child process returns incorrect stdout (stderr when exists) 1'] = `
STRIPPED



Error: Cypress verification failed.

This command failed with the following output:

/cache/Cypress/1.2.3/Cypress.app/Contents/MacOS/Cypress --no-sandbox --smoke-test --ping=222

----------

some stderr

----------

Platform: darwin-x64 (Foo-OsVersion)
Cypress Version: 1.2.3

`

exports['lib/tasks/verify logs error when child process returns incorrect stdout (stdout when no stderr) 1'] = `
STRIPPED



Error: Cypress verification failed.

This command failed with the following output:

/cache/Cypress/1.2.3/Cypress.app/Contents/MacOS/Cypress --no-sandbox --smoke-test --ping=222

----------

some stdout

----------

Platform: darwin-x64 (Foo-OsVersion)
Cypress Version: 1.2.3

`

exports['linux: error when invalid CYPRESS_RUN_BINARY 1'] = `
Note: You have set the environment variable:

CYPRESS_RUN_BINARY=/custom/

This overrides the default Cypress binary path used.

Error: Could not run binary set by environment variable: CYPRESS_RUN_BINARY=/custom/

Ensure the environment variable is a path to the Cypress binary, matching **/Cypress

----------

ENOENT: no such file or directory, stat '/custom/'

----------

Platform: linux-x64 (Foo-OsVersion)
Cypress Version: 1.2.3

`

exports['no Cypress executable 1'] = `
Error: No version of Cypress is installed in: /cache/Cypress/1.2.3/Cypress.app

Please reinstall Cypress by running: cypress install

----------

Cypress executable not found at: /cache/Cypress/1.2.3/Cypress.app/Contents/MacOS/Cypress

----------

Platform: darwin-x64 (Foo-OsVersion)
Cypress Version: 1.2.3

`

exports['no version of Cypress installed 1'] = `
Error: No version of Cypress is installed in: /cache/Cypress/1.2.3/Cypress.app

Please reinstall Cypress by running: cypress install

----------

Cypress executable not found at: /cache/Cypress/1.2.3/Cypress.app/Contents/MacOS/Cypress

----------

Platform: darwin-x64 (Foo-OsVersion)
Cypress Version: 1.2.3

`

exports['no welcome message 1'] = `
Found binary version 7.8.9 installed in: /cache/Cypress/1.2.3/Cypress.app

⚠ Warning: Binary version 7.8.9 does not match the expected package version 1.2.3

  These versions may not work properly together.


`

exports['silent verify 1'] = `
[no output]


`

exports['valid CYPRESS_RUN_BINARY 1'] = `
Note: You have set the environment variable:

CYPRESS_RUN_BINARY=/custom/Contents/MacOS/Cypress

This overrides the default Cypress binary path used.

It looks like this is your first time using Cypress: 1.2.3


⠋  Verified Cypress! /real/custom
✔  Verified Cypress! /real/custom
✔  Verified Cypress! /real/custom

Opening Cypress...

`

exports['verbose stdout output 1'] = `
It looks like this is your first time using Cypress: 1.2.3


⠋  Verified Cypress! /cache/Cypress/1.2.3/Cypress.app
✔  Verified Cypress! /cache/Cypress/1.2.3/Cypress.app
✔  Verified Cypress! /cache/Cypress/1.2.3/Cypress.app

Opening Cypress...

`

exports['verification with executable 1'] = `


⠋  Verified Cypress! /cache/Cypress/1.2.3/Cypress.app
✔  Verified Cypress! /cache/Cypress/1.2.3/Cypress.app
✔  Verified Cypress! /cache/Cypress/1.2.3/Cypress.app

Opening Cypress...

`

exports['verifying in ci 1'] = `
It looks like this is your first time using Cypress: 1.2.3




Opening Cypress...

`

exports['warning installed version does not match verified version 1'] = `
Found binary version bloop installed in: /cache/Cypress/1.2.3/Cypress.app

⚠ Warning: Binary version bloop does not match the expected package version 1.2.3

  These versions may not work properly together.


`

exports['win32: error when invalid CYPRESS_RUN_BINARY 1'] = `
Note: You have set the environment variable:

CYPRESS_RUN_BINARY=/custom/

This overrides the default Cypress binary path used.

Error: Could not run binary set by environment variable: CYPRESS_RUN_BINARY=/custom/

Ensure the environment variable is a path to the Cypress binary, matching **/Cypress.exe

----------

ENOENT: no such file or directory, stat '/custom/'

----------

Platform: win32-x64 (Foo-OsVersion)
Cypress Version: 1.2.3

`

exports['xvfb fails 1'] = `
STRIPPED



Error: Xvfb exited with a non zero exit code.

There was a problem spawning Xvfb.

This is likely a problem with your system, permissions, or installation of Xvfb.

----------

Error: test without xvfb

----------

Platform: darwin-x64 (Foo-OsVersion)
Cypress Version: 1.2.3

`

exports['tried to verify twice, on the first try got the DISPLAY error'] = `
Cypress verification failed.

Cypress failed to start after spawning a new Xvfb server.

The error logs we received were:

----------

[some noise here] Gtk: cannot open display: 987
some other error
again with
some weird indent

----------

This may be due to a missing library or dependency. [34mhttps://on.cypress.io/required-dependencies[39m

Please refer to the error above for more detail.

----------

Platform: linux-x64 (Foo-OsVersion)
Cypress Version: 1.2.3
`
