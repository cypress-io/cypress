# ⚡️ + 🌲 Cypress Component Testing w/ Vite

To install vite in you component testing environment,
1. Install it `yarn add @cypress/vite-dev-server`
2. Add it to `cypress/plugins/index.js`

```js
import { startDevServer } from '@cypress/vite-dev-server'

module.exports = (on, config) => {
  on('dev-server:start', async (options) => startDevServer({ options }))

  return config
}
```
