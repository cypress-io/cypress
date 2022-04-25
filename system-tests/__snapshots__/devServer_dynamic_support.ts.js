exports['devServer dynamic import throws error when devServer use dynamic import instead of require 1'] = `
Your configFile is invalid: /foo/bar/.projects/devServer-dynamic-import/cypress.config.js

It threw an error when required, check the stack trace below:

Error: Cannot find module './webpack.config'
Require stack:
- /foo/bar/.projects/devServer-dynamic-import/cypress.config.js
- lib/plugins/child/run_require_async_child.js
- lib/plugins/child/require_async_child.js
      [stack trace lines]
`
