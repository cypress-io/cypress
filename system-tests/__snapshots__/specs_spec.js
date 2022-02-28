exports['e2e specs failing when no specs found 1'] = `
Can't run because no spec files were found.

We searched for specs inside of this folder:

  > /foo/bar/.projects/e2e/cypress/specs

`

exports['e2e specs failing when no spec pattern found 1'] = `
Can't run because no spec files were found.

We searched for specs matching this glob pattern:

  > /foo/bar/.projects/e2e/cypress/integration/does/not/exist/**notfound**

`
