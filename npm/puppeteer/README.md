# @cypress/puppeteer

Use [Puppeteer's browser API](https://pptr.dev/api) from your Cypress tests with a single command.

Cypress runs your tests in a single tab, so it can't switch to a tab or window that your app opens, or work with several pages at once. This plugin gives you a Puppeteer `Browser` connected to the browser Cypress launched. You do that work with Puppeteer, then pass the results back to your test for assertions.

For anything Cypress can do on its own, use Cypress commands instead. They retry automatically and show each step in the Command Log, while `cy.puppeteer()` doesn't retry and logs a single entry for the whole handler.

## Table of Contents

- [Installation](#installation)
- [Upgrading to 1.0](#upgrading-to-10)
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

## Upgrading to 1.0

Version 1.0 upgrades the bundled `puppeteer-core` from v21 to v24 and requires Cypress 14.0.0 or later. The plugin's own API hasn't changed: `setup`, `retry`, and `cy.puppeteer()` work the same way. Your message handlers, however, receive a Puppeteer `Browser` directly, so Puppeteer's breaking changes between v21 and v24 can affect the code inside them.

We made this upgrade so the plugin stays compatible with current Chrome releases and picks up Puppeteer's more reliable connection handling. Puppeteer v24 needs Node.js 18 or later, which is why Cypress 13, which still supports Node.js 16, is no longer supported.

### Does this affect me?

It affects you if either of these is true:

- **You use Cypress 13.** Upgrade to Cypress 14.0.0 or later first.
- **Your message handlers use a Puppeteer API that changed.**

These are the Puppeteer changes most likely to show up in handlers:

| Puppeteer v21 | Puppeteer v24 |
| --- | --- |
| `page.waitForTimeout(ms)` | Removed. Wait for a specific condition with `page.waitForSelector()` or `page.waitForFunction()`, or use `new Promise((resolve) => setTimeout(resolve, ms))`. |
| `page.$x(expression)` and `page.waitForXPath(expression)` | Removed. Use the `::-p-xpath()` selector, for example `page.$$('::-p-xpath(//h2)')` or `page.waitForSelector('::-p-xpath(//h2)')`. |
| `browser.createIncognitoBrowserContext()` | Renamed to `browser.createBrowserContext()`. |
| `puppeteer.devices` | Removed. Import `KnownDevices` from `puppeteer-core` instead. |
| `addEventListener()` and `removeEventListener()` on Puppeteer objects | Removed. Use `on()` and `off()`. |
| Screenshot and PDF methods are typed as returning a Node.js `Buffer` | They're typed as returning a `Uint8Array`. In TypeScript, wrap the result in `Buffer.from()` if you need `Buffer` methods. |
| `HTTPRequest.url()` and `HTTPResponse.url()` leave out the URL fragment | They include the fragment, such as `#section`. |

For the complete list, see the breaking changes for versions 22.0.0, 23.0.0, and 24.0.0 in the [puppeteer-core changelog](https://github.com/puppeteer/puppeteer/blob/main/packages/puppeteer-core/CHANGELOG.md).

### What to do next

1. If you're on Cypress 13, upgrade to Cypress 14.0.0 or later.
2. Search your message handlers for the APIs in the table above and update them.
3. If you pass your own Puppeteer module with the [`puppeteer` option](#options), upgrade it to v24 as well.
4. Run your specs that call `cy.puppeteer()`.

If you can't make these changes yet, stay on the previous release with `npm install --save-dev @cypress/puppeteer@0` until you're ready.

## Compatibility

- **Cypress 14.0.0 or later.**
- **Node.js 18 or later** for the process that loads your Cypress config, which every Node.js version Cypress 14 supports already meets. The bundled `puppeteer-core` v24 needs it.
- **Chromium-family browsers only.** Calling `cy.puppeteer()` in Firefox or WebKit fails with an error.

What works depends on the browser and on whether it runs headless (`cypress run`) or headed (`cypress open` or `cypress run --headed`):

| Browser | Headless | Headed | Open new tabs with `browser.newPage()` |
| --- | --- | --- | --- |
| Electron | Yes | Yes | No |
| Chrome for Testing, Chromium | Yes | Yes | Yes |
| Google Chrome 136 and earlier | Yes | Yes | Yes |
| Google Chrome 137 and later | Yes | No | Yes, headless only |
| Other Chromium-based browsers, such as Edge | Yes | Only if the browser can load the Cypress extension | Yes |
| Firefox, WebKit | No | No | No |

**Electron can't open new tabs or windows from Puppeteer.** Electron doesn't support creating pages through the Chrome DevTools Protocol, so `browser.newPage()` fails with `Protocol error (Target.createTarget): Not supported`. Working with tabs and windows that your app opens, as in [Switching to a new tab](#switching-to-a-new-tab), works in Electron.

**Google Chrome 137 and later can't run the plugin headed.** In headed Chromium browsers, the plugin needs the Cypress extension (see [How it works](#how-it-works)), and Chrome 137 removed the `--load-extension` flag that loads it. When the plugin detects this combination, it throws an error at browser launch. For headed runs, use Electron, Chrome for Testing, or Chromium instead. The Cypress Docker images repository has examples for [Chrome for Testing](https://github.com/cypress-io/cypress-docker-images/tree/master/examples/chrome-for-testing) and [Chromium](https://github.com/cypress-io/cypress-docker-images/tree/master/examples/chromium).

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

### Retries

`cy.puppeteer()` runs your handler once. If an assertion chained after it fails, such as `.should('include', '/new-page')`, Cypress doesn't run the handler again. When a handler depends on something that takes time to appear, like a tab that's still opening, wait for it inside the handler with [`retry`](#retryfunctiontoretry-options) or a Puppeteer method such as `page.waitForSelector()`.

### Timeouts

Each `cy.puppeteer()` call is limited by the Cypress [`taskTimeout`](https://on.cypress.io/configuration#Timeouts) setting, which defaults to 60000 milliseconds. `cy.puppeteer()` doesn't take its own timeout option, so to give a slow handler more time, raise `taskTimeout` in your Cypress config or for a single test:

```typescript
it('waits for a slow tab', { taskTimeout: 120000 }, () => {
  cy.puppeteer('waitForSlowTab')
})
```

## Usage

### 1. Register message handlers in your Cypress config

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress'
import { setup, retry } from '@cypress/puppeteer'

export default defineConfig({
  e2e: {
    setupNodeEvents (on) {
      setup({
        on,
        onMessage: {
          async getNewTabTitle (browser, urlFragment) {
            // cy.puppeteer() doesn't retry, so wait here until the tab has opened
            const page = await retry(async () => {
              const pages = await browser.pages()
              const page = pages.find((page) => page.url().includes(urlFragment))

              if (!page) throw new Error(`No tab with a URL containing ${urlFragment} yet`)

              return page
            })

            // Whatever you return is yielded by cy.puppeteer() in your spec
            return page.title()
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

  cy.puppeteer('getNewTabTitle', '/new-page').should('equal', 'New page')
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
| `puppeteer` | No | A Puppeteer module (from `puppeteer` or `puppeteer-core`) to use instead of the `puppeteer-core` bundled with this plugin. Install a version that satisfies this plugin's `puppeteer-core` dependency, so your package manager shares one copy between your project and the plugin. In TypeScript, a module from a different copy fails to type-check, even within the same major version. |

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

> This example doesn't work in Electron, because Electron can't open new tabs from Puppeteer. Run it in Chrome for Testing, Chromium, or Edge. See [Compatibility](#compatibility) for details.

This example shows how to:

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
import type { Browser as PuppeteerBrowser } from 'puppeteer-core'
import { setup } from '@cypress/puppeteer'

export default defineConfig({
  e2e: {
    setupNodeEvents (on) {
      setup({
        on,
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

### `cy.task('__cypressPuppeteer__') timed out after waiting 60000ms`

A message handler took longer than the Cypress `taskTimeout`. Check whether the handler is waiting for something that never happens, such as a tab with a URL that doesn't match. If the handler is just slow, raise `taskTimeout`. See [Timeouts](#timeouts).

### `Protocol error (Target.createTarget): Not supported`

Your message handler called `browser.newPage()` while running in Electron, which can't open new tabs or windows from Puppeteer. Run the spec in Chrome for Testing, Chromium, or Edge instead. Tabs and windows that your app opens itself still work in Electron.

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
