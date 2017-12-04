exports['installs without existing installation 1'] = `
Installing Cypress (version: 1.2.3)

 ✔  Downloaded Cypress ✔  Unzipped Cypress       
 ✔  Finished Installation   /path/to/binary/dir/

You can now open Cypress by running: node_modules/.bin/cypress open

https://on.cypress.io/installing-cypress

`

exports['specify version in env vars 1'] = `
Forcing a binary version different than the default.

The CLI expected to install version: 1.2.3

Instead we will install version: 0.12.1

Note: there is no guarantee these versions will work properly together.

Installing Cypress (version: 0.12.1)

 ✔  Downloaded Cypress ✔  Unzipped Cypress       
 ✔  Finished Installation   /path/to/binary/dir/

You can now open Cypress by running: node_modules/.bin/cypress open

https://on.cypress.io/installing-cypress

`

exports['version already installed 1'] = `
Cypress 1.2.3 is already installed. Skipping installation.

Pass the --force option if you'd like to reinstall anyway.

`

exports['continues installing on failure 1'] = `
Installing Cypress (version: 1.2.3)

 ✔  Downloaded Cypress ✔  Unzipped Cypress       
 ✔  Finished Installation   /path/to/binary/dir/

You can now open Cypress by running: node_modules/.bin/cypress open

https://on.cypress.io/installing-cypress

`

exports['installed version does not match needed version 1'] = `
Installed version (x.x.x) does not match needed version (1.2.3).

Installing Cypress (version: 1.2.3)

 ✔  Downloaded Cypress ✔  Unzipped Cypress       
 ✔  Finished Installation   /path/to/binary/dir/

You can now open Cypress by running: node_modules/.bin/cypress open

https://on.cypress.io/installing-cypress

`

exports['forcing true always installs 1'] = `
Installing Cypress (version: 1.2.3)

 ✔  Downloaded Cypress ✔  Unzipped Cypress       
 ✔  Finished Installation   /path/to/binary/dir/

You can now open Cypress by running: node_modules/.bin/cypress open

https://on.cypress.io/installing-cypress

`

exports['warning installing as global 1'] = `
Installed version (x.x.x) does not match needed version (1.2.3).

Installing Cypress (version: 1.2.3)

 ✔  Downloaded Cypress ✔  Unzipped Cypress       
 ✔  Finished Installation   /path/to/binary/dir/

It looks like you've installed Cypress globally.

This will work, but it's not recommended.

The recommended way to install Cypress is as a devDependency per project.

You should probably run these commands:

  - npm uninstall -g cypress
  - npm install --save-dev cypress

`

exports['installing in ci 1'] = `
Installed version (x.x.x) does not match needed version (1.2.3).

Installing Cypress (version: 1.2.3)

[xx:xx:xx]  Downloading Cypress [started]
[xx:xx:xx]  Downloading Cypress     [completed]
[xx:xx:xx]  Unzipping Cypress       [started]
[xx:xx:xx]  Unzipping Cypress       [completed]
[xx:xx:xx]  Finishing Installation  [started]
[xx:xx:xx]  Finishing Installation  [completed]

You can now open Cypress by running: node_modules/.bin/cypress open

https://on.cypress.io/installing-cypress

`

exports['skip installation 1'] = `
Skipping binary install.

`
