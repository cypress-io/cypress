exports['e2e specs failing when no specs found and default specPattern 1'] = `
Can't run because no spec files were found.

We searched for specs matching this glob pattern:

  > /foo/bar/.projects/no-specs/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}

`

exports['e2e specs failing when no specs found and custom specPattern 1'] = `
Can't run because no spec files were found.

We searched for specs matching this glob pattern:

  > /foo/bar/.projects/no-specs-custom-pattern/src/**/*.cy.{js,jsx}

`

exports['e2e specs failing when no specs found and spec pattern provided from CLI 1'] = `
Can't run because no spec files were found.

We searched for specs matching this glob pattern:

  > /foo/bar/.projects/no-specs/cypress/e2e/does/not/exist/**notfound**

`

exports['e2e specs failing when no specs found with custom spec pattern and spec pattern provided from CLI 1'] = `
Can't run because no spec files were found.

We searched for specs matching this glob pattern:

  > /foo/bar/.projects/no-specs-custom-pattern/cypress/e2e/does/not/exist/**notfound**

`
