# Manual Installation

> _Not Recommended_: All of this is done automatically with Vue CLI

1. Install `cypress` and `@cypress/vue`

```sh
npm install -D cypress @cypress/vue
```

2. Include this plugin from your project's `cypress/plugin/index.js` file

```js
const preprocessor = require('@cypress/vue/dist/plugins/webpack')
module.exports = (on, config) => {
  preprocessor(on, config)
  // IMPORTANT return the config object
  return config
}
```

3. Include the support file from your project's `cypress/support/index.js` file

```js
import '@cypress/vue/dist/support'
```

4. ⚠️ Turn the experimental component support on in your `cypress.json`. You can also specify where component spec files are located. For exampled to have them located in `src` folder use:

```json
{
  "experimentalComponentTesting": true,
  "componentFolder": "src"
}
```
