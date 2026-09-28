# @cypress/puppeteer [beta]

Use [Puppeteer's browser API](https://pptr.dev/api) from your Cypress tests with a single command.

> This plugin is in public beta, and we'd love your feedback to help improve it. Please share it in [this discussion](https://github.com/cypress-io/cypress/discussions/28410).

## Table of Contents

- [Installation](#installation)
- [Compatibility](#compatibility)
- [How it works](#how-it-works)
- [Usage](#usage)
- [API](#api)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Changelog](./CHANGELOG.md)

## Installation

With npm:

```sh
npm install --save-dev @cypress/puppeteer
```

With yarn:

```sh
yarn add --dev @cypress/puppeteer
```

### TypeScript

To get types for `cy.puppeteer()`, add the support types to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["cypress", "@cypress/puppeteer/support"]
  }
}
```

The `setup` and `retry` functions ship with their own type definitions, so no extra configuration is needed for your Cypress config file.

## Compatibility

- **Cypress 13.6.0 or later.** The plugin relies on the `after:browser:launch` event, which was added in 13.6.0.
- **Chromium-family browsers only**, such as Electron, Chrome for Testing, Chromium, and Edge. Calling `cy.puppeteer()` in Firefox or WebKit fails with an error.
- **Google Chrome 137 and later is not supported in headed mode** (`cypress open` or `cypress run --headed`). Chrome removed the `--load-extension` flag in version 137, and the plugin needs the Cypress extension in headed Chromium browsers (see [How it works](#how-it-works)). When the plugin detects this combination, it throws an error at browser launch. Headless `cypress run` works in any Chrome version. For headed runs, use Electron, Chrome for Testing, or Chromium instead. The Cypress Docker images repository has examples for [Chrome for Testing](https://github.com/cypress-io/cypress-docker-images/tree/master/examples/chrome-for-testing) and [Chromium](https://github.com/cypress-io/cypress-docker-images/tree/master/examples/chromium).

## How it works

The plugin has two halves:

- **In your Cypress config**, you register named message handlers with `setup()`. These handlers run in Node.js, not in the browser.
- **In your spec**, you call `cy.puppeteer('handlerName', ...args)` to run one of them. Under the hood, this is a [`cy.task()`](https://on.cypress.io/task), so it follows the same rules for arguments, return values, and timeouts.

Each time `cy.puppeteer()` runs, the plugin:

1. Connects Puppeteer to the browser Cypress launched.
2. Calls your message handler with that Puppeteer [`Browser`](https://pptr.dev/api/puppeteer.browser) instance and any arguments you passed.
3. In headed Chromium browsers other than Electron, brings the main Cypress tab back to the front through the Cypress extension, so your test can keep running after you've worked with other tabs.
4. Disconnects Puppeteer from the browser. The browser itself stays open.
5. Yields your handler's return value to the Cypress command chain.

Because the connection is created fresh for every call and closed at the end, don't hold on to `Browser`, `Page`, or element references between `cy.puppeteer()` calls. Look them up again inside each handler.

## Usage

### 1. Register message handlers in your Cypress config

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress'
import { setup } from '@cypress/puppeteer'

export default defineConfig({
  e2e: {
    setupNodeEvents (on) {
      setup({
        on,
        onMessage: {
          async getNewTabUrl (browser) {
            // Use the Puppeteer API to interact with the browser here.
            // Whatever you return is yielded by cy.puppeteer() in your spec.
            const pages = await browser.pages()

            return pages[pages.length - 1].url()
          },
        },
      })
    },
  },
})
```

### 2. Import the support file

```typescript
// cypress/support/e2e.ts
import '@cypress/puppeteer/support'
```

### 3. Call `cy.puppeteer()` in your spec

```typescript
// cypress/e2e/spec.cy.ts
it('opens a new tab', () => {
  cy.visit('/')
  cy.get('button').click() // opens a new tab

  cy.puppeteer('getNewTabUrl').should('include', '/new-page')
})
```

## API

### `setup(options)`

Call this inside `setupNodeEvents` to register your message handlers.

```typescript
import { setup } from '@cypress/puppeteer'

setup({ on, onMessage, puppeteer })
```

#### Options

| Option | Required | Description |
| --- | --- | --- |
| `on` | Yes | The `on` event registration function that `setupNodeEvents` receives. |
| `onMessage` | Yes | An object whose keys are message names and whose values are handler functions. See [Message handlers](#message-handlers). |
| `puppeteer` | No | A Puppeteer module (from `puppeteer` or `puppeteer-core`) to use instead of the version of `puppeteer-core` bundled with this plugin. Handy when you want to pin your own Puppeteer version. |

`setup` throws right away if `options`, `on`, or `onMessage` is missing, or if `onMessage` isn't a plain object.

#### Message handlers

Each key in `onMessage` is a name you can pass to `cy.puppeteer()`. Its function runs in Node.js, so Cypress commands and DOM APIs aren't available inside it — use the Puppeteer API instead.

A handler receives:

- `browser`: A Puppeteer [`Browser`](https://pptr.dev/api/puppeteer.browser) instance connected to the Cypress-launched browser.
- `...args`: Any arguments passed to `cy.puppeteer()` after the message name.

Handlers can be synchronous or `async`. What they return (or resolve to) is yielded by `cy.puppeteer()`:

- The return value must be serializable, just like a `cy.task()` result.
- Returning `undefined` yields `null`, since `cy.task()` doesn't allow `undefined`.
- If a handler throws or rejects, `cy.puppeteer()` fails the test with the error message.

### `retry(functionToRetry[, options])`

A helper for your message handlers that keeps calling a function until it succeeds. It's useful for things that take a moment to show up, like a tab that's still opening.

```typescript
import { retry } from '@cypress/puppeteer'

const page = await retry(async () => {
  const pages = await browser.pages()
  const page = pages.find((page) => page.url().includes('page-2.html'))

  if (!page) throw new Error('Could not find page')

  return page
})
```

#### `functionToRetry`

_Required._ A function (synchronous or `async`) to call. If it throws or rejects, `retry` waits and calls it again. As soon as it succeeds, `retry` resolves with its return value.

#### `options`

_Optional._

| Option | Default | Description |
| --- | --- | --- |
| `timeout` | `4000` | How long to keep retrying, in milliseconds. Once it's reached, `retry` rejects with `Failed retrying after <timeout>ms: <last error message>`. |
| `delayBetweenTries` | `200` | How long to wait between attempts, in milliseconds. |

The timeout is counted in delays between attempts, so time spent inside `functionToRetry` itself isn't included. A slow function can make `retry` run longer than `timeout`.

### `cy.puppeteer(messageName[, ...args])`

Runs the message handler registered under `messageName` and yields its return value.

```typescript
cy.puppeteer('testNewTab', 'value 1', 42, [true, false])
```

#### `messageName`

_Required._ A string matching one of the keys in the `onMessage` option you passed to `setup`. If there's no match, the command fails and lists the registered names.

#### `...args`

_Optional._ Values to pass to the message handler. They're sent from the browser to Node.js, so they must be serializable.

For example, the call above arrives in the handler like this:

```typescript
setup({
  on,
  onMessage: {
    testNewTab (browser, stringArg, numberArg, arrayOfBooleans) {
      // stringArg === 'value 1'
      // numberArg === 42
      // arrayOfBooleans[0] === true, arrayOfBooleans[1] === false
    },
  },
})
```

## Examples

Both examples live in this package's [Cypress tests](./cypress/e2e/multi-tab.cy.ts) and [cypress.config.ts](./cypress.config.ts), where you can run them yourself. That config also starts a small static server on `http://localhost:8000` and sets it as the `baseUrl`, which is why the URLs below point there.

The examples use tabs, but the same approach works for windows. Puppeteer treats both as instances of the [`Page` class](https://pptr.dev/api/puppeteer.page/).

### Switching to a new tab

This example shows how to:

- Find a tab that an action in your Cypress test opened
- Wait for that tab with `retry`
- Read content from the tab with Puppeteer
- Pass that content back to Cypress for assertions

_cypress/e2e/multi-tab.cy.ts_

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
            // The new tab may not have opened and loaded yet, so keep looking until it has
            const page = await retry<Promise<Page>>(async () => {
              // The browser will eventually have 2 tabs open: the Cypress tab and the new tab.
              // In Puppeteer, tabs and windows are called pages.
              const pages = await browser.pages()
              const page = pages.find((page) => page.url().includes('page-2.html'))

              // Throwing tells `retry` to try again
              if (!page) throw new Error('Could not find page')

              // Returning resolves `retry` with the page
              return page
            })

            // Cypress keeps focus on its own tab, so bring the new page to the front before interacting with it
            await page.bringToFront()

            const paragraph = (await page.waitForSelector('p'))!
            const paragraphText = await page.evaluate((el) => el.textContent, paragraph)

            // Clean up references before finishing
            paragraph.dispose()

            await page.close()

            // This value is yielded by cy.puppeteer() in the spec
            return paragraphText
          },
        },
      })
    },
  },
})
```

### Creating a new tab

This example shows how to:

- Pass your own Puppeteer module to `setup`
- Pass arguments from `cy.puppeteer()` to a message handler
- Open a new tab and visit a page with Puppeteer
- Pass content from that tab back to Cypress for assertions

_cypress/e2e/multi-tab.cy.ts_

```typescript
it('creates a new tab', () => {
  cy.visit('/cypress/fixtures/page-3.html')
  // Read a value from the page and pass it through to the message handler
  cy.get('#message').invoke('text').then((message) => {
    cy
    .puppeteer('createTabAndGetContent', message)
    .should('equal', 'I approve this message: Cypress and Puppeteer make a great combo')
  })
})
```

_cypress.config.ts_

```typescript
import { defineConfig } from 'cypress'
import puppeteer from 'puppeteer-core'
import type { Browser as PuppeteerBrowser } from 'puppeteer-core'
import { setup } from '@cypress/puppeteer'

export default defineConfig({
  e2e: {
    setupNodeEvents (on) {
      setup({
        on,
        // Use your own installed Puppeteer instead of the version bundled with the plugin
        puppeteer,
        onMessage: {
          async createTabAndGetContent (browser: PuppeteerBrowser, text: string) {
            // Opens a new tab in the Cypress-launched browser
            const page = await browser.newPage()

            // `text` comes from the cy.puppeteer() call in the spec
            await page.goto(`http://localhost:8000/cypress/fixtures/page-4.html?text=${encodeURIComponent(text)}`)

            const paragraph = (await page.waitForSelector('p'))!
            const paragraphText = await page.evaluate((el) => el.textContent, paragraph)

            // Clean up references before finishing
            paragraph.dispose()

            await page.close()

            // This value is yielded by cy.puppeteer() in the spec
            return paragraphText
          },
        },
      })
    },
  },
})
```

## Troubleshooting

### `@cypress/puppeteer does not work in Google Chrome v137 and higher in cypress open mode (or headed run mode)`

Chrome 137 removed support for loading extensions from the command line, and the plugin needs the Cypress extension in headed mode. Switch to Electron, Chrome for Testing, or Chromium for headed runs, or run Chrome headlessly with `cypress run`. See [Compatibility](#compatibility) for details.

### `Cannot communicate with the Cypress Chrome extension. Ensure the extension is enabled when using the Puppeteer plugin.`

After each handler runs in a headed Chromium browser, the plugin asks the Cypress extension to bring the main Cypress tab back to the front. This error means the extension didn't respond within 2 seconds. A few things to check:

- If you're using Google Chrome 137 or later, switch to Chrome for Testing or Chromium. [See download instructions](https://www.chromium.org/getting-involved/download-chromium/).
- Make sure the Cypress extension is enabled in the browser Cypress launched by visiting `chrome://extensions/`.
- Make sure your company's security policy allows the Cypress extension. Its ID is `caljajdfkjjjdehjdoimjkkakekklcck`.

### `Lost the reference to the browser`

This usually happens when your Cypress config reloads but the browser doesn't relaunch. Close the browser and open it again from Cypress.

### `Only browsers in the "Chromium" family are supported`

You're running in Firefox or WebKit. Switch to a Chromium-family browser such as Electron, Chrome for Testing, Chromium, or Edge.

### `Could not find message handler with the name ...`

The name passed to `cy.puppeteer()` doesn't match any key in `onMessage`. The error lists the names that are registered, so it's usually a quick typo fix.

## Contributing

This package lives in the [Cypress monorepo](https://github.com/cypress-io/cypress). Run `yarn` from the repository root first, then run these commands from `npm/puppeteer`.

Build the TypeScript files into `dist/`:

```shell
yarn build
```

Rebuild whenever a file changes:

```shell
yarn watch
```

Type-check without emitting files (`yarn build` doesn't fail on type errors, so run this before opening a PR):

```shell
yarn check-ts
```

Lint:

```shell
yarn lint
```

Run the unit tests once:

```shell
yarn test
```

Run the unit tests in watch mode:

```shell
yarn test-watch
```

Open the Cypress tests:

```shell
yarn cypress:open
```

Run the Cypress tests once in Chrome:

```shell
yarn cypress:run
```

## [Changelog](./CHANGELOG.md)
