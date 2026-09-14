# Security

## Reporting Security Issues

If you believe you've found a potential security issue in Cypress, we want to ensure the correct members of our team are alerted as soon as possible.

Please see our [Security and Compliance](https://cypress.io/security/) for our security disclosure policy and how to report a vulnerability.

https://cypress.io/security/

## Testing securely with Cypress

Cypress drives a real browser against your application, and to do that it takes
control of the browser and its traffic in ways a normal web page cannot. That
control is what makes testing possible, and it means a Cypress run is only as
safe as the application, credentials and machine you point it at.

### Only test applications you control

Point Cypress at applications your team owns and operates, including every
origin a test visits — an origin you reach with `cy.origin()` is as much a part
of the run as the site you started on.

Cypress is not a general-purpose web automation tool, and testing a site you
don't control is outside what it is designed and supported for. To make your
application testable, Cypress modifies pages and responses as they pass through
it: it removes headers that would otherwise stop the app being framed or
instrumented, rewrites code that tries to break out of a frame, and can run the
browser with web security disabled when you ask it to.

### Keep secrets out of your project files

Record keys, API tokens and passwords do not belong in `cypress.config.*`,
`cypress.env.json`, or fixtures. These files are easy to commit by accident.
Supply secrets through environment variables or your CI provider's secret
storage, and treat a leaked record key as something to rotate rather than
delete from history.

### Prefer test accounts and test data

Run against seeded accounts and disposable data wherever you can. Commands like
`cy.request()` and `cy.intercept()` issue real requests carrying real cookies,
so a suite pointed at production acts on production. If you must test against a
live environment, use an account scoped to what the tests need.

### Treat spec and plugin code as code that runs on your machine

Your config and plugin files execute in Node with your user's privileges, and
`cy.task()` reaches the filesystem deliberately. Review third-party plugins
before installing them, and give the same scrutiny to a Cypress plugin that you
would to any other dependency with access to your machine.

### Know what you take on when you redirect the install

By default the Cypress binary is downloaded from an official location and
verified before use. Setting `CYPRESS_INSTALL_BINARY`,
`CYPRESS_DOWNLOAD_MIRROR` or `CYPRESS_DOWNLOAD_PATH_TEMPLATE` moves that trust
decision to you: use HTTPS and a host you control, and make sure whatever serves
the binary is as protected as the rest of your build infrastructure. Note that
these values can also come from `npm` configuration and from a project's own
`package.json`, so they are worth checking when you adopt an unfamiliar
repository.
