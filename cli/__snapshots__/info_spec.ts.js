exports['cypress info without browsers or vars'] = `

Proxy Settings: none detected
Environment Variables: none detected

Application Data: /user/app/data/path
Browser Profiles: /user/app/data/path/to/browsers
Binary Caches: /user/path/to/binary/cache

Cypress Version: 0.0.0-development (stable)
System Platform: linux (Foo-OsVersion)
System Memory: 1.2 GB free 400 MB

`

exports['cypress info with proxy and vars'] = `

Proxy Settings:
PROXY_ENV_VAR1: some proxy variable
PROXY_ENV_VAR2: another proxy variable

Learn More: https://on.cypress.io/proxy-configuration

Environment Variables:
CYPRESS_ENV_VAR1: my Cypress variable
CYPRESS_ENV_VAR2: my other Cypress variable

Application Data: /user/app/data/path
Browser Profiles: /user/app/data/path/to/browsers
Binary Caches: /user/path/to/binary/cache

Cypress Version: 0.0.0-development (stable)
System Platform: linux (Foo-OsVersion)
System Memory: 1.2 GB free 400 MB

`

exports['cypress redacts sensitive vars'] = `

Proxy Settings: none detected
Environment Variables:
CYPRESS_ENV_VAR1: my Cypress variable
CYPRESS_ENV_VAR2: my other Cypress variable
CYPRESS_PROJECT_ID: abc123
CYPRESS_RECORD_KEY: <redacted>

Application Data: /user/app/data/path
Browser Profiles: /user/app/data/path/to/browsers
Binary Caches: /user/path/to/binary/cache

Cypress Version: 0.0.0-development (stable)
System Platform: linux (Foo-OsVersion)
System Memory: 1.2 GB free 400 MB

`

exports['logs additional info about pre-releases'] = `

Proxy Settings: none detected
Environment Variables: none detected

Application Data: /user/app/data/path
Browser Profiles: /user/app/data/path/to/browsers
Binary Caches: /user/path/to/binary/cache

Cypress Version: 0.0.0-development (pre-release)
System Platform: linux (Foo-OsVersion)
System Memory: 1.2 GB free 400 MB

This is a pre-release build of Cypress.
Build info:
  Commit SHA: abc123
  Commit Branch: someBranchName
  Commit Date: 2022-02-02Txx:xx:xx.000Z

`

exports['logs additional info about development'] = `

Proxy Settings: none detected
Environment Variables: none detected

Application Data: /user/app/data/path
Browser Profiles: /user/app/data/path/to/browsers
Binary Caches: /user/path/to/binary/cache

Cypress Version: 0.0.0-development (pre-release)
System Platform: linux (Foo-OsVersion)
System Memory: 1.2 GB free 400 MB

This is the development (un-built) Cypress CLI.

`
