exports['skip installation 1'] = `
Note: Skipping binary installation: Environment variable CYPRESS_INSTALL_BINARY = 0.


`

exports['specify version in env vars 1'] = `
⚠ Warning: Forcing a binary version different than the default.

  The CLI expected to install version: 1.2.3

  Instead we will install version: 0.12.1

  These versions may not work properly together.

Installing Cypress (version: 0.12.1)

 ✔  Downloaded Cypress
 ✔  Unzipped Cypress
 ✔  Finished Installation   /cache/Cypress/1.2.3

You can now open Cypress by running: node_modules/.bin/cypress open

https://on.cypress.io/installing-cypress


`

exports['continues installing on failure 1'] = `
Installing Cypress (version: 1.2.3)

 ✔  Downloaded Cypress
 ✔  Unzipped Cypress
 ✔  Finished Installation   /cache/Cypress/1.2.3

You can now open Cypress by running: node_modules/.bin/cypress open

https://on.cypress.io/installing-cypress


`

exports['installs without existing installation 1'] = `
Installing Cypress (version: 1.2.3)

 ✔  Downloaded Cypress
 ✔  Unzipped Cypress
 ✔  Finished Installation   /cache/Cypress/1.2.3

You can now open Cypress by running: node_modules/.bin/cypress open

https://on.cypress.io/installing-cypress


`

exports['installed version does not match needed version 1'] = `

Cypress x.x.x is already installed in /cache/Cypress/1.2.3

Installing Cypress (version: 1.2.3)

 ✔  Downloaded Cypress
 ✔  Unzipped Cypress
 ✔  Finished Installation   /cache/Cypress/1.2.3

You can now open Cypress by running: node_modules/.bin/cypress open

https://on.cypress.io/installing-cypress


`

exports['forcing true always installs 1'] = `

Cypress 1.2.3 is already installed in /cache/Cypress/1.2.3

Installing Cypress (version: 1.2.3)

 ✔  Downloaded Cypress
 ✔  Unzipped Cypress
 ✔  Finished Installation   /cache/Cypress/1.2.3

You can now open Cypress by running: node_modules/.bin/cypress open

https://on.cypress.io/installing-cypress


`

exports['warning installing as global 1'] = `

Cypress x.x.x is already installed in /cache/Cypress/1.2.3

Installing Cypress (version: 1.2.3)

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

exports['installing in ci 1'] = `

Cypress x.x.x is already installed in /cache/Cypress/1.2.3

Installing Cypress (version: 1.2.3)

[xx:xx:xx]  Downloading Cypress     [started]
[xx:xx:xx]  Downloading Cypress     [completed]
[xx:xx:xx]  Unzipping Cypress       [started]
[xx:xx:xx]  Unzipping Cypress       [completed]
[xx:xx:xx]  Finishing Installation  [started]
[xx:xx:xx]  Finishing Installation  [completed]

You can now open Cypress by running: node_modules/.bin/cypress open

https://on.cypress.io/installing-cypress


`

exports['invalid cache directory 1'] = `
Error: Cypress cannot write to the cache directory due to file permissions
----------

Failed to access /invalid/cache/dir:

EACCES: permission denied, mkdir '/invalid'
----------

Platform: darwin (Foo-OsVersion)
Cypress Version: 1.2.3

`

exports['error for removed CYPRESS_BINARY_VERSION 1'] = `
Error: The environment variable CYPRESS_BINARY_VERSION has been renamed to CYPRESS_INSTALL_BINARY as of version 3.0.0

You should setCYPRESS_INSTALL_BINARY instead.
----------

Platform: darwin (Foo-OsVersion)
Cypress Version: 1.2.3

`

exports['silent install 1'] = `
[no output]
`

exports['version already installed - cypress install 1'] = `

Cypress 1.2.3 is already installed in /cache/Cypress/1.2.3

Skipping installation:

  Pass the --force option if you'd like to reinstall anyway.

`

exports['version already installed - postInstall 1'] = `

Cypress 1.2.3 is already installed in /cache/Cypress/1.2.3


`
