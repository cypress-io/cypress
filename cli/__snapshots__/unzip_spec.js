exports['lib/tasks/unzip throws when cannot unzip 1'] = `
Error: The Cypress App could not be unzipped.

Search for an existing issue or open a GitHub issue at

https://github.com/cypress-io/cypress/issues

----------

Error: end of central directory record signature not found

----------

Platform: darwin-x64 (Foo-OsVersion)
Cypress Version: 1.2.3

`

exports['lib/tasks/unzip throws max path length error when cannot unzip due to realpath ENOENT on windows 1'] = `
Error: The Cypress App could not be unzipped.

This is most likely because the maximum path length is being exceeded on your system.

Read here for solutions to this problem: https://on.cypress.io/win-max-path-length-error

----------

Error: failed

----------

Platform: win32-x64 (Foo-OsVersion)
Cypress Version: 1.2.3

`
