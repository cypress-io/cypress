exports['continues installing on failure 1'] = `
Installing Cypress (version: 1.2.3)

  ✔  Downloaded Cypress
  ✔  Unzipped Cypress
  ✔  Finished Installation   /cache/Cypress/1.2.3

You can now open Cypress by running: node_modules/.bin/cypress open

https://on.cypress.io/installing-cypress


`

exports['forcing true always installs 1'] = `

Cypress 1.2.3 is installed in /cache/Cypress/1.2.3

Installing Cypress (version: 1.2.3)

  ✔  Downloaded Cypress
  ✔  Unzipped Cypress
  ✔  Finished Installation   /cache/Cypress/1.2.3

You can now open Cypress by running: node_modules/.bin/cypress open

https://on.cypress.io/installing-cypress


`

exports['installed version does not match needed version 1'] = `

Cypress x.x.x is installed in /cache/Cypress/1.2.3

Installing Cypress (version: 1.2.3)

  ✔  Downloaded Cypress
  ✔  Unzipped Cypress
  ✔  Finished Installation   /cache/Cypress/1.2.3

You can now open Cypress by running: node_modules/.bin/cypress open

https://on.cypress.io/installing-cypress


`

exports['installing in ci 1'] = `

Cypress x.x.x is installed in /cache/Cypress/1.2.3

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

exports['installs without existing installation 1'] = `
Installing Cypress (version: 1.2.3)

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

Platform: darwin (Foo-OsVersion)
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
