# @cypress/puppeteer [beta]

Utilize [Puppeteer's browser API](https://pptr.dev/api) within Cypress with a single command.

> This plugin is in public beta, so we'd love to get your feedback to improve it. Please leave any feedback you have in [this discussion](https://github.com/cypress-io/cypress/discussions/28410).

# Table of Contents

- [Installation](#installation)
- [Compatibility](#compatibility)
- [Usage](#usage)
- [API](#api)
- [Examples](#examples)
- [Contributing](#contributing)
- [Changelog](./CHANGELOG.md)

# Installation

## npm

```sh
npm install --save-dev @cypress/puppeteer
```

## yarn

```sh
yarn add --dev @cypress/puppeteer
```

## With TypeScript

Add the following in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["cypress", "@cypress/puppeteer/support"]
  }
}
```

## Compatibility

`@cypress/puppeteer` requires Cypress version 13.6.0 or greater.

Only Chromium-based browsers (e.g. Chrome, Chromium, Electron) are supported.

## Usage

`@cypress/puppeteer` is set up in your Cypress config and support file, then executed in your spec. See [API](#api) and [Examples](#examples) below for more details.

While the `cy.puppeteer()` command is executed in the browser, the majority of the Puppeteer execution is run in the Node process via your Cypress config. You pass a string message name to `cy.puppeteer()` that indicates which message handler to execute in the Cypress config. This is similar to how [cy.task()](on.cypress.io/task) operates.

In your Cypress config (e.g. `cypress.config.ts`):

```typescript
import { setup } from '@cypress/puppeteer'

export default defineConfig({
  e2e: {
    setupNodeEvents (on) {
      setup({
        on,
        onMessage: {
          async myMessageHander (browser) {
            // Utilize the Puppeteer browser instance and the Puppeteer API to interact with and automate the browser
          },
        },
      })
    },
  },
}
```

In your support file (e.g. `cypress/support/e2e.ts`):

```typescript
import '@cypress/puppeteer/support'
```

In your spec (e.g. `spec.cy.ts`):

```typescript
  it('switches to and tests a new tab', () => {
    cy.visit('/')
    cy.get('button').click() // opens a new tab

    cy
    .puppeteer('myMessageHander')
    .should('equal', 'You said: Hello from Page 1')
  })
```

## API

### Cypress Config - setup

This sets up `@cypress/puppeteer` message handlers that run Puppeteer browser automation.

```typescript
setup(options)
```

#### Options

- `on` _required_: The `on` event registration function provided by `setupNodeEvents`
- `onMessage` _required_: An object with string keys and function values (see more details [below](#onmessage))
- `puppeteer` _optional_: The `puppeteer` library imported from `puppeteer-core`, overriding the default version of `puppeteer-core` used by this plugin

##### onMessage

The keys provided in this are used to invoke their corresponding functions by calling `cy.puppeteer(key)` in your Cypress test.

The functions should contain Puppeteer code for automating the browser. The code is executed within Node.js and not within the browser, so Cypress commands and DOM APIs cannot be utilized.

The functions receive the following arguments:

###### browser

A [puppeteer browser instance](https://pptr.dev/api/puppeteer.browser) connected to the Cypress-launched browser.

###### ...args

The rest of the arguments are any de-serialized arguments passed to the `cy.puppeteer()` command from your Cypress test.

### Cypress Config - retry

This is a utility function provided to aid in retrying actions that may initially fail.

```typescript
retry(functionToRetry[, options])
```

#### functionToRetry

_required_

A function that will run and retry if an error is thrown. If an error is not thrown, `retry` will return the value returned by this function.

The function will continue to run at the default or configured interval until the default or configured timeout, at which point `retry` will throw an error and cease retrying this function.

#### Options

_optional_

- `timeout` _optional_: The total time in milliseconds during which to attempt retrying the function. Default: `4000ms`
- `delayBetweenTries` _optional_: The time to wait between retries. Default: `200ms`

### Cypress Spec - cy.puppeteer()

```typescript
cy.puppeteer(messageName[, ...args])
```

#### messageName

_required_

A string matching one of the keys passed to the `onMessage` option of `setup` in your Cypress config.

#### ...args

_optional_

Values that will be passed to the message handler. These values must be JSON-serializable.

Example:

```typescript
// spec
cy.puppeteer('testNewTab', 'value 1', 42, [true, false])

// Cypress config
setup({
  on,
  onMessage: {
    testNewTab (browser, stringArg, numberArg, arrayOfBooleans) {
      // stringArg === 'value 1'
      // numberArg === 42
      // arrayOfBooleans[0] === true / arrayOfBooleans[1] === false
    }
  }
})
```

## Examples

These examples can be found and run in the [Cypress tests of this package](./cypress) with this project's [cypress.config.ts](./cypress.config.ts).

While these examples use tabs, they could just as easily apply to windows. Tabs and windows are essentially the same things as far as Puppeteer is concerned and encapsulated by instances of the [Page class](https://pptr.dev/api/puppeteer.page/).

### Switching to a new tab

This example demonstrates the following:

- Switching to a tab opened by an action in the Cypress test
- Getting the page instance via Puppeteer utilizing the `retry` function
- Getting page references and content via puppeteer
- Passing that content back to be asserted on in Cypress

_spec.cy.ts_

```typescript
it('switches to a new tab', () => {
  cy.visit('/cypress/fixtures/page-1.html')
  cy.get('input').type('Hello from Page 1')
  cy.get('button').click() // Triggers a new tab to open

  cy
  .puppeteer('switchToTabAndGetContent')
  .should('equal', 'You said: Hello from Page 1')
})
```

_cypress.config.ts_

```typescript
import { defineConfig } from 'cypress'
import type { Browser as PuppeteerBrowser, Page } from 'puppeteer-core'

import { setup, retry } from '@cypress/puppeteer'

export default defineConfig({
  e2e: {
    setupNodeEvents (on) {
      setup({
        on,
        onMessage: {
          async switchToTabAndGetContent (browser: PuppeteerBrowser) {
            // In this message handler, we utilize the Puppeteer API to interact with the browser and the new tab that our Cypress tests has opened

            // Utilize the retry since the page may not have opened and loaded by the time this runs
            const page = await retry<Promise<Page>>(async () => {
              // The browser will (eventually) have 2 tabs open: the Cypress tab and the newly opened tab
              // In Puppeteer, tabs and windows are called pages
              const pages = await browser.pages()
              // Try to find the page we want to interact with
              const page = pages.find((page) => page.url().includes('page-2.html'))

              // If we can't find the page, it probably hasn't loaded yet, so throw an error to signal that this function should retry
              if (!page) throw new Error('Could not find page')

              // Otherwise, return the page instance and it will be returned by the `retry` function itself
              return page
            })

            // Cypress will maintain focus on the Cypress tab within the browser. It's generally a good idea to bring the page to the front to interact with it.
            await page.bringToFront()

            const paragraph = (await page.waitForSelector('p'))!
            const paragraphText = await page.evaluate((el) => el.textContent, paragraph)

            // Clean up any references before finishing up
            paragraph.dispose()

            await page.close()

            // Return the paragraph text and it will be the value yielded by the `cy.puppeteer()` invocation in the spec
            return paragraphText
          },
        },
      })
    },
  },
})
```

### Creating a new tab

This example demonstrates the following:

- Passing a non-default version of puppeteer to `@cypress/puppeteer`
- Passing arguments from `cy.puppeteer()` to the message handler
- Creating a new tab and visiting a page via Puppeteer
- Getting page references and content via puppeteer
- Passing that content back to be asserted on in Cypress

_spec.cy.ts_

```typescript
it('creates a new tab', () => {
  cy.visit('/cypress/fixtures/page-3.html')
  // We get a dynamic value from the page and pass it through to the puppeteer
  // message handler
  cy.get('#message').invoke('text').then((message) => {
    cy.puppeteer('createTabAndGetContent', message)
    .should('equal', 'I approve this message: Cypress and Puppeteer make a great combo')
  })
})
```

_cypress.config.ts_

```typescript
import { defineConfig } from 'cypress'
import puppeteer, { Browser as PuppeteerBrowser, Page } from 'puppeteer-core'

import { setup, retry } from '@cypress/puppeteer'

export default defineConfig({
  e2e: {
    setupNodeEvents (on) {
      setup({
        on,
        // Pass in your own version of puppeteer to be used instead of the default one
        puppeteer,
        onMessage: {
          async createTabAndGetContent (browser: PuppeteerBrowser, text: string) {
            // In this message handler, we utilize the Puppeteer API to interact with the browser, creating a new tab and getting its content

            // This will create a new tab within the Cypress-launched browser
            const page = await browser.newPage()

            // Text comes from the test invocation of `cy.puppeteer()`
            await page.goto(`http://localhost:8000/cypress/fixtures/page-4.html?text=${text}`)

            const paragraph = (await page.waitForSelector('p'))!
            const paragraphText = await page.evaluate((el) => el.textContent, paragraph)

            // Clean up any references before finishing up
            paragraph.dispose()

            await page.close()

            // Return the paragraph text and it will be the value yielded by the `cy.puppeteer()` invocation in the spec
            return paragraphText
          },
        },
      })
    },
  },
})
```

## Troubleshooting

### Error: Cannot communicate with the Cypress Chrome extension. Ensure the extension is enabled when using the Puppeteer plugin.

If you receive this error in your command log, the Puppeteer plugin was unable to communicate with the Cypress extension. This extension is necessary in order to re-activate the main Cypress tab after a Puppeteer command, when running in open mode.

* Ensure this extension is enabled in the instance of Chrome that Cypress launches by visiting chrome://extensions/
* Ensure the Cypress extension is allowed by your company's security policy by its extension id, `caljajdfkjjjdehjdoimjkkakekklcck`

## Contributing

Build the TypeScript files:

```shell
yarn build
```

Watch the TypeScript files and rebuild on file change:

```shell
yarn watch
```

Open Cypress tests:

```shell
yarn cypress:open
```

Run Cypress tests once:

```shell
yarn cypress:run
```

Run all unit tests once:

```shell
yarn test
```

Run unit tests in watch mode:

```shell
yarn test-watch
```

## [Changelog](./CHANGELOG.md)
