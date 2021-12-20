This is an example project created using [CRACO](https://github.com/gsoft-inc/craco) (Create React App Configuration Override). 

Use the plugin:

```js
// cypress/plugins/index.js

// import your craco.config.js
const cracoConfig = require('../../craco.config.js')
const devServer = require('@cypress/react/plugins/craco')

module.exports = (on, config) => {
  devServer(on, config, cracoConfig)

  return config
}
```
