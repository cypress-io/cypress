# Manual Installation

> _Not Recommended_: All of this is done automatically with Vue CLI

1. Install `cypress` and `cypress-vue-unit-test`

```sh
npm install -D cypress cypress-vue-unit-test
```

2. Include this plugin `cypress/plugin/index.js`

```js
// default webpack file preprocessor is good for simple cases
// Required to temporarily patch async components, chunking, and inline image loading
import { onFileDefaultPreprocessor } from 'cypress-vue-unit-test/dist/preprocessor/webpack'

module.exports = (on) => {
  on('file:preprocessor', onFileDefaultPreprocessor)
}
```

3. Include the support file `cypress/support/index.js`

```js
import 'cypress-vue-unit-test/dist/support'
```

4. ⚠️ Turn the experimental component support on in your `cypress.json`. You can also specify where component spec files are located. For exampled to have them located in `src` folder use:

```json
{
  "experimentalComponentTesting": true,
  "componentFolder": "src"
}
```
