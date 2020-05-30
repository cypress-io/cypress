# example: webpack-options

The Webpack preprocessor in [cypress/plugins/index.js](cypress/plugins/index.js) adds the Babel React preset to the list of default Webpack plugins. This allows Cypress to transpile JSX code in [cypress/component/Test.cy-spec.js](cypress/component/Test.cy-spec.js) file.

Note: run `npm install` in this folder to symlink `cypress-react-unit-test` dependency.

```shell
npm run cy:open
# or run headless tests
npm test
```

```js
import React from 'react'
import { mount } from 'cypress-react-unit-test'
describe('components', () => {
  it('works', () => {
    mount(<div>Text</div>)
    cy.contains('Text')
  })
})
```

![Test screenshot](images/test.png)

More tests are in the [cypress/component](cypress/component) folder.
