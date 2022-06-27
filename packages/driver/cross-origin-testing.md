# Cross-origin Testing Technical Overview

The goal of this document is to give a technical overview of the architecture behind the **cy.origin()** command, which enables cross-origin testing in Cypress.

## Definitions

See [Node.js’s URL doc](https://nodejs.org/api/url.html#url-strings-and-url-objects) for a handy breakdown of URL parts

- **domain**: A hostname without the subdomain. (e.g. `example.com`, `example.co.uk`, `localhost`)
- **origin**: The combination of the protocol, hostname, and port of a URL. For the purposes of Cypress, the subdomain is irrelevant. (e.g. `http://example.com:3500`)
- **top**: The main window/frame of the browser
- **primary origin**: The origin that top is on
- **secondary origin**: Any origin that is not the primary origin
- **primary driver**: The Cypress driver that run in **top** on the primary origin
- **secondary driver**: Any Cypress driver that run in a **spec bridge**, interacting with a secondary origin

## Frame architecture (single origin)

When testing a single origin, all 3 frames are loaded on that origin.

Components:

```mermaid
graph TD;
    top["top frame: domain1.com"]-->specFrame["spec frame: domain1.com"];
    top-->aut["AUT frame: domain1.com"];
```

**top** communicates directly and synchronously with the **spec frame** and the **AUT frame**. The **spec frame** runs the spec, which uses the driver to run commands and interact with the **AUT**.

In a single test (`it` + hooks), the **AUT** must remain on the same origin or a cross-origin error will occur, as **top** can no longer interact with the **AUT** in that circumstance. Different tests can visit different origins. In this case, we change **top** to the new origin, which also runs the **spec frame** on that origin. This navigation causes the spec to run again. We skip any already-run tests and resume.

## Frame architecture (multiple origins)

Let’s say the primary origin is `domain1.com` and the secondary origin is `domain2.com`. The test has visited `domain1.com` and then issued a click that caused the **AUT** to navigate to `domain2.com`.

Since the **AUT** is no longer on the same origin as **top**, they can no longer communicate synchronously. In order to facilitate cross-origin testing, we create another iframe we call the **spec bridge**. It exists as a sibling to the **AUT** (meaning they share the same parent frame, not to be confused with a DOM sibling). It contains a version of the driver tailored to cross-origin testing, with a different entry-point to the primary driver, but containing mostly the same code.

The **spec bridge** is run on `domain2.com` to match the **AUT**. This and being a sibling allows the spec bridge to communicate directly with the **AUT**. The **spec bridge** communicates *asynchronously* with **top** via the [postMessage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage).

The **spec bridge** remains in the DOM from the moment it’s created until the browser is refreshed or closed, the same as the the **spec frame** and **AUT**.

Here’s what the components look like now:

```mermaid
graph TD;
    top["top frame: domain1.com"]-->specFrame["spec frame: domain1.com"];
    top-->aut["AUT frame: domain2.com"];
    top-->specBridge["spec bridge: domain2.com"];
```

## cy.origin()

Refer to the [public documentation on cy.origin()](https://on.cypress.io/origin) for all details on the user-facing API.

The main responsibilities of **cy.origin()** are to create the **spec bridge** for the specified origin and facilitate communication between the primary driver and the secondary driver in that **spec bridge**.

## Cross-origin communication

Communication between the **primary driver** and any **secondary drivers** occurs through the [postMessage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage).  We abstract over the postMessage API with **cross-origin communicators**.

A **PrimaryOriginCommunicator** instance exists in the **primary driver** which receives messages from any **secondary drivers** and can send messages to either a single **secondary driver** for a particular origin or to all **secondary drivers** that currently exist.

Each **secondary driver** has a **SpecBridgeCommunicator** instance that can receive from and send messages to the **primary driver**.

One of the main responsibilities of the communicators is to prepare/preprocess data for serialization. All data going over the postMessage API gets serialized by the [structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm). In order to either prevent or catch serialization errors and ensure all relevant data is properly transmitted, we preprocess data such as the subject, logs, snapshots, and errors themselves.

For more information, please see the [Cross-origin Serialization Explainer](./src/util/serialization/README.md)

## Automation / Proxy

Browser automation APIs and the proxy play a small but critical role in facilitating cross-origin testing.

The proxy intercepts http requests from all sources. In order to detect cross-origin navigation of **AUT**, it’s necessary to know that a request came specifically from the **AUT frame** and not **top**, a nested iframe, or elsewhere. To achieve this, we use the browser automation APIs to add a `X-Cypress-Is-AUT-Frame` header to any requests from the AUT.

Allowing the proxy to know if a request is from the **AUT** enables us to do two things when it recognizes that it’s not the **primary origin**:

- Delay the response. This allows us to communicate with the **primary driver** to set up the **spec bridge** and run the user’s callback function via **cy.origin()**. Then the driver notifies the proxy that it can allow the response through. This enables users to listen to the `window:before:load` event in the callback function, since the page will not load until after any such listeners are set up.
- Inject code into the request that’s tailored to cross-origin testing.

### Cross-origin navigation timing

It’s possible for the user’s test to navigate to a different origin in two different ways.

1. An action causes the navigation (click, submit, etc). In this case, delaying the response is necessary for the aforementioned reasons.
2. The user explicitly navigates via **cy.visit()**. In this case, it’s not necessary to delay the response, since the navigation has not happened yet, and all setup can be done before the navigation occurs.

## State syncing

Since each **spec bridge / secondary driver** is a new instance and operates in its own execution context, all state held by the driver has to be manually synced. The need to serialize data between drivers means that not all data *can* be synced, so some rules have been enacted to maintain consistency.

### Cypress.*.defaults()

All **defaults()** (e.g. **Cypress.Screenshot.defaults()**) methods do not sync their data between origins. This is because callback functions cannot be properly serialized. We could shuttle message back-and-forth to call the callbacks in the **primary origin**, but then certain arguments like DOM elements could not be serialized when calling those callbacks. While some data accepted by **defaults()** methods are serializable, we feel it’s better to have clear, consistent behavior and not sync any data.

This means that any global state set up by **defaults()** methods exists independently in each origin. Since a **spec bridge** persists throughout the spec run once it’s created, that global state persists as well between **cy.origin()** calls for the same origin.

The consequence of this is that users will need to call any given **defaults()** method again inside the **cy.origin()** callback if they wish to have the same behavior in that **secondary origin** as in the **primary origin**.

### Cypress.config() / Cypress.env()

Config and env values are synced both ways between **primary** and **secondary** origins. All built-in config values are inherently serializable since they are passed between the server and the browser.

It’s possible for users to set custom key/value pairs where the value could be unserializable. In that case, the value is not synced and it behaves similar to state set by **defaults()** methods, where it persists only in the execution context of that origin.

The config and env values are synced into the **secondary driver** before the **cy.origin()** callback is called. They are synced back to the **primary driver** when the callback and any commands run inside of it are finished.

### Internal state

Various internal state values (used throughout the codebase via `Cypress.state()`, `cy.state()` and `state()`) are sent from the **primary driver** into the **secondary driver** before the **cy.origin()** callback is called. These include values such the viewport width, viewport height, and the stability of the page.

A read-only version of the `runnable` is also sent. While the actual `runnable` instance is a singleton only used by the **primary driver**, certain stateful values it holds are necessary for various parts of the **secondary driver** to function correctly.

The full, up-to-date list of state values sent can be found in the **cy.origin()** implementation.

## Events

All event listeners are only bound to the execution context of the origin in which they are defined. Events occurring in one origin do not trigger event handlers in a different origin. This is because some event handlers accept arguments that are not serializable. Even though some event handlers do rely on unserializable arguments, for consistency’s sake, events are bound to their origin.

Similar to **defaults()** methods needing to be called again, some events may need to be rebound within the **cy.origin()** callback in order to achieve the same behavior in that **secondary origin** as in the **primary origin**.

## Cookies

Having the **AUT** on a different origin than **top** causes issues with cookies being set for the origin in the **AUT**. Cookies that would normally be set when a user's app is run outside of Cypress are not set due to it being rendered in an iframe.

In order to counteract this, we utilize the [proxy](../proxy) to capture cookies from cross-origin responses, store them in our own server-side cookie jar, set them in the browser with automation, and then attach them to cross-origin requests where appropriate. This simulates how cookies behave outside of Cypress.

## Unsupported APIs

Certain APIs are currently not supported in the **cy.origin()** callback. Depending on the API, we may or may not implement support for them in the future.

### cy.origin()

Nesting **cy.origin()** inside the callback is not currently not supported, but support will likely be added in the future. In most use-cases, the desired functionality of nesting it can be achieved calling **cy.origin()** back-to-back at the top level of the test.

### cy.session() / Cypress.session.*

**cy.session()** and related APIs are likely not necessary inside the callback and should be used at the top-level of the test instead of in the **cy.origin()** callback. However, if there are use-cases discovered where it’s necessary, we may implement support for it.

### cy.intercept()

We will likely add support for **cy.intercept()** within the **cy.origin()** callback in the future.

### Deprecated commands / methods

All deprecated APIs are not supported in the **cy.origin()** callback and we do not plan to ever add support for them. If a user attempts to use one, we throw an error that points them to the preferred API that superseded it. The following are deprecated APIs that are not supported:

- **cy.route()**: Superseded by **cy.intercept()**
- **cy.server()**: Superseded by **cy.intercept()**
- **Cypress.Server.defaults()**: Superseded by **cy.intercept()**
- **Cypress.Cookies.preserveOnce()**: Superseded by sessions
