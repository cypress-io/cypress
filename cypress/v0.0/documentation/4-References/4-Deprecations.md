slug: deprecations
excerpt: Deprecations that require additional explanation will be listed here.

# Contents

- :fa-angle-right: [Passing `cy.server({stub: false})` is now deprecated](#section-passing-cy-server-stub-false-is-now-deprecated)
- :fa-angle-right: [Passing `cy.route({stub: false})` is now deprecated](#section-passing-cy-route-stub-false-is-now-deprecated)
- :fa-angle-right: [Cypress Package Renamed](#section-cypress-package-renamed)

***

# Passing `cy.server({stub: false})` is now deprecated

In previous versions of Cypress, to prevent Cypress from stubbing routes you had to explicitly tell your server not to stub routes like this:

```javascript
cy
  .server({stub: false})
  .route(...)
```

You no longer have to do this. Whether a [cy.route](https://on.cypress.io/api/route) is stubbed or not is simply based on whether or not you specified a response in [cy.route](https://on.cypress.io/api/route).

***

# Passing `cy.route({stub: false})` is now deprecated

In previous versions of Cypress, [cy.route](https://on.cypress.io/api/route) would require a `response` unless you specified `stub: false` in its options.

You used to have to write this:

```javascript
cy
  .server()
  .route({url: /posts/, stub: false})
```

This is now deprecated because Cypress automatically stubs [cy.route](https://on.cypress.io/api/route) based on whether or not it has a `response` property.

```javascript
cy
  .server()
  .route(/users/, [{}, {}])               // <-- stubbed because this has a response argument
  .route({url: /comments/, response: []}) // <-- stubbed because this has a response property
  .route(/posts/)                         // <-- not stubbed because there is no response argument or property
```

***

# Cypress Package Renamed

<img width="638" alt="screen shot 2016-03-26 at 2 06 48 pm" src="https://cloud.githubusercontent.com/assets/1268976/14061658/0f675e30-f35c-11e5-9765-ab0049a2653d.png">

In previous versions of Cypress (below `0.15.0`) we distributed our CLI Tools under the package: `cypress`.

As of `0.15.0` the CLI Tools have now been renamed to the package `cypress-cli`.

Please update your scripts to use: `npm install -g cypress-cli`

This change was made for two reasons:

- Users were confused thinking they were actually installing cypress when in fact they were installing the CLI tools.
- Once we open source the Desktop Application it will be distributed under the `cypress` package

Hopefully this change will lead to less confusion over the versioning of both the `CLI Tools` and the `Cypress Desktop Application`.

Once `cypress` is open sourced you'll be able to set `cypress` as a `devDependency` and will not have to fuss with downloading or managing the Desktop Application.
