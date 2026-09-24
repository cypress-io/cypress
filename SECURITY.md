# Security

## Reporting Security Issues

If you believe you've found a potential security issue in Cypress, we want to ensure the correct members of our team are alerted as soon as possible.

Please see our [Security and Compliance](https://cypress.io/security/) for our security disclosure policy and how to report a vulnerability.

https://cypress.io/security/

## Testing securely with Cypress

Cypress drives a real browser against your application, and to do that it takes control of the browser and its traffic in ways a normal web page cannot. That control is what makes testing possible, and it means a Cypress run is only as safe as the application, credentials and machine you point it at.

### Only test applications you control

Point Cypress at applications your team owns and operates, including every origin a test visits — an origin you reach with `cy.origin()` is as much a part of the run as the site you started on.

Cypress is not a general-purpose web automation tool, and testing a site you don't control is outside what it is designed and supported for. To make your application testable, Cypress modifies pages and responses as they pass through it: it removes headers that would otherwise stop the app being framed or instrumented, rewrites code that tries to break out of a frame, and can run the browser with web security disabled when you ask it to.

### Keep the test browser for testing

Cypress launches every browser with a profile of its own, separate from the one you browse with day to day. Keep it that way: don't sign in to personal accounts or browse outside your tests in a browser Cypress opened. Cypress can inspect and modify that browser's network traffic, HTTPS included, and the browser is set to accept TLS certificates it would normally reject.

### Keep secrets out of project files and logs

Record keys, API tokens and passwords do not belong in `cypress.config.*`, `cypress.env.json`, or fixtures. These files are easy to commit by accident. Supply secrets through environment variables or your CI provider's secret storage, and treat a leaked record key as something to rotate rather than delete from history. In your specs, read secrets with `cy.env()`, which keeps them in the Node process until a test asks for them, rather than `Cypress.expose()`, whose values are readable in the browser. `DEBUG=cypress:*` logs include headers and cookie values, so check them before pasting them into a public issue.

### Prefer test accounts and test data

Run against seeded accounts and disposable data wherever you can. `cy.request()` sends real HTTP requests carrying the browser's cookies, and any request your app makes that `cy.intercept()` doesn't stub reaches the real server, so a suite pointed at production acts on production. If you must test against a live environment, use an account scoped to what the tests need.

### Treat config, plugins and specs as code that runs on your machine

Opening or running a project in Cypress runs its config file, and every plugin that file loads, in Node with your user's privileges. Spec code runs in the browser but reaches your machine too: `cy.task()` runs whatever Node code the config registers for it, and `cy.readFile()` and `cy.writeFile()` can read and write any file your user can. Review third-party plugins before installing them, look through an unfamiliar project's config before opening it, and give a Cypress plugin the same scrutiny you would any other dependency with access to your machine.

### Know what you take on when you redirect the install

By default, installing the `cypress` package downloads the Cypress binary over HTTPS from an official Cypress host. Setting `CYPRESS_INSTALL_BINARY`, `CYPRESS_DOWNLOAD_MIRROR` or `CYPRESS_DOWNLOAD_PATH_TEMPLATE` makes you responsible for where the binary comes from: use HTTPS and a host you trust, and make sure whatever serves the binary is as protected as the rest of your build infrastructure. These values can also come from npm configuration, such as a project's `.npmrc`, and from a project's own `package.json`, so check for them when you adopt an unfamiliar repository.
