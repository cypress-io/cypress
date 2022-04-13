exports['continues installing on failure 1'] = `
Installing Cypress (version: 1.2.3)


⠋  Downloaded Cypress
✔  Downloaded Cypress
✔  Downloaded Cypress
⠋  Unzipped Cypress
✔  Downloaded Cypress
✔  Unzipped Cypress
✔  Downloaded Cypress
✔  Unzipped Cypress
⠋  Finished Installation   /cache/Cypress/1.2.3
✔  Downloaded Cypress
✔  Unzipped Cypress
✔  Finished Installation   /cache/Cypress/1.2.3
✔  Downloaded Cypress
✔  Unzipped Cypress
✔  Finished Installation   /cache/Cypress/1.2.3

You can now open Cypress by running: node_modules/.bin/cypress open

https://on.cypress.io/installing-cypress


`

exports['forcing true always installs 1'] = `

Cypress 1.2.3 is installed in /cache/Cypress/1.2.3

Installing Cypress (version: 1.2.3)


⠋  Downloaded Cypress
✔  Downloaded Cypress
✔  Downloaded Cypress
⠋  Unzipped Cypress
✔  Downloaded Cypress
✔  Unzipped Cypress
✔  Downloaded Cypress
✔  Unzipped Cypress
⠋  Finished Installation   /cache/Cypress/1.2.3
✔  Downloaded Cypress
✔  Unzipped Cypress
✔  Finished Installation   /cache/Cypress/1.2.3
✔  Downloaded Cypress
✔  Unzipped Cypress
✔  Finished Installation   /cache/Cypress/1.2.3

You can now open Cypress by running: node_modules/.bin/cypress open

https://on.cypress.io/installing-cypress


`

exports['installed version does not match needed version 1'] = `

Cypress x.x.x is installed in /cache/Cypress/1.2.3

Installing Cypress (version: 1.2.3)


⠋  Downloaded Cypress
✔  Downloaded Cypress
✔  Downloaded Cypress
⠋  Unzipped Cypress
✔  Downloaded Cypress
✔  Unzipped Cypress
✔  Downloaded Cypress
✔  Unzipped Cypress
⠋  Finished Installation   /cache/Cypress/1.2.3
✔  Downloaded Cypress
✔  Unzipped Cypress
✔  Finished Installation   /cache/Cypress/1.2.3
✔  Downloaded Cypress
✔  Unzipped Cypress
✔  Finished Installation   /cache/Cypress/1.2.3

You can now open Cypress by running: node_modules/.bin/cypress open

https://on.cypress.io/installing-cypress


`

exports['installing in ci 1'] = `

Cypress x.x.x is installed in /cache/Cypress/1.2.3

Installing Cypress (version: 1.2.3)




You can now open Cypress by running: node_modules/.bin/cypress open

https://on.cypress.io/installing-cypress


`

exports['installs without existing installation 1'] = `
Installing Cypress (version: 1.2.3)


⠋  Downloaded Cypress
✔  Downloaded Cypress
✔  Downloaded Cypress
⠋  Unzipped Cypress
✔  Downloaded Cypress
✔  Unzipped Cypress
✔  Downloaded Cypress
✔  Unzipped Cypress
⠋  Finished Installation   /cache/Cypress/1.2.3
✔  Downloaded Cypress
✔  Unzipped Cypress
✔  Finished Installation   /cache/Cypress/1.2.3
✔  Downloaded Cypress
✔  Unzipped Cypress
✔  Finished Installation   /cache/Cypress/1.2.3

You can now open Cypress by running: node_modules/.bin/cypress open

https://on.cypress.io/installing-cypress


`

exports['invalid cache directory 1'] = `
Error: Cypress cannot write to the cache directory due to file permissions

See discussion and possible solutions at
https://github.com/cypress-io/cypress/issues/1281

----------

Failed to access /invalid/cache/dir:

EACCES: permission denied, mkdir '/invalid'

----------

Platform: darwin-x64 (Foo-OsVersion)
Cypress Version: 1.2.3

`

exports['silent install 1'] = `
[no output]


`

exports['skip installation 1'] = `
Note: Skipping binary installation: Environment variable CYPRESS_INSTALL_BINARY = 0.


`

exports['specify version in env vars 1'] = `
⚠ Warning: Forcing a binary version different than the default.

  The CLI expected to install version: 1.2.3

  Instead we will install version: 0.12.1

  These versions may not work properly together.

Installing Cypress (version: 0.12.1)


⠋  Downloaded Cypress
✔  Downloaded Cypress
✔  Downloaded Cypress
⠋  Unzipped Cypress
✔  Downloaded Cypress
✔  Unzipped Cypress
✔  Downloaded Cypress
✔  Unzipped Cypress
⠋  Finished Installation   /cache/Cypress/1.2.3
✔  Downloaded Cypress
✔  Unzipped Cypress
✔  Finished Installation   /cache/Cypress/1.2.3
✔  Downloaded Cypress
✔  Unzipped Cypress
✔  Finished Installation   /cache/Cypress/1.2.3

You can now open Cypress by running: node_modules/.bin/cypress open

https://on.cypress.io/installing-cypress


`

exports['version already installed - cypress install 1'] = `

Cypress 1.2.3 is installed in /cache/Cypress/1.2.3

Skipping installation:

  Pass the --force option if you'd like to reinstall anyway.

`

exports['version already installed - postInstall 1'] = `

Cypress 1.2.3 is installed in /cache/Cypress/1.2.3


`

exports['warning installing as global 1'] = `

Cypress x.x.x is installed in /cache/Cypress/1.2.3

Installing Cypress (version: 1.2.3)


⠋  Downloaded Cypress
✔  Downloaded Cypress
✔  Downloaded Cypress
⠋  Unzipped Cypress
✔  Downloaded Cypress
✔  Unzipped Cypress
✔  Downloaded Cypress
✔  Unzipped Cypress
⠋  Finished Installation   /cache/Cypress/1.2.3
✔  Downloaded Cypress
✔  Unzipped Cypress
✔  Finished Installation   /cache/Cypress/1.2.3
✔  Downloaded Cypress
✔  Unzipped Cypress
✔  Finished Installation   /cache/Cypress/1.2.3

⚠ Warning: It looks like you've installed Cypress globally.

  This will work, but it's not recommended.

  The recommended way to install Cypress is as a devDependency per project.

  You should probably run these commands:

  - npm uninstall -g cypress
  - npm install --save-dev cypress

`

exports['error when installing on unsupported os'] = `
Error: The Cypress App could not be installed. Your machine does not meet the operating system requirements.

https://on.cypress.io/guides/getting-started/installing-cypress#system-requirements

----------

Platform: win32-ia32

`

exports['/lib/tasks/install .start non-stable builds logs a warning about installing a pre-release 1'] = `
⚠ Warning: You are installing a pre-release build of Cypress.

Bugs may be present which do not exist in production builds.

This build was created from:
  * Commit SHA: 3b7f0b5c59def1e9b5f385bd585c9b2836706c29
  * Commit Branch: aBranchName
  * Commit Timestamp: 1996-11-27Txx:xx:xx.000Z

Installing Cypress (version: https://cdn.cypress.io/beta/binary/0.0.0-development/darwin-x64/aBranchName-3b7f0b5c59def1e9b5f385bd585c9b2836706c29/cypress.zip)


⠋  Downloaded Cypress
✔  Downloaded Cypress
✔  Downloaded Cypress
⠋  Unzipped Cypress
✔  Downloaded Cypress
✔  Unzipped Cypress
✔  Downloaded Cypress
✔  Unzipped Cypress
⠋  Finished Installation   /cache/Cypress/1.2.3
✔  Downloaded Cypress
✔  Unzipped Cypress
✔  Finished Installation   /cache/Cypress/1.2.3
✔  Downloaded Cypress
✔  Unzipped Cypress
✔  Finished Installation   /cache/Cypress/1.2.3

You can now open Cypress by running: node_modules/.bin/cypress open

https://on.cypress.io/installing-cypress


`
