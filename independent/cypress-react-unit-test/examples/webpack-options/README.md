# example: webpack-options

> The Webpack preprocessor in [cypress/plugins/index.js](cypress/plugins/index.js) adds the Babel React preset to the list of default Webpack plugins. This allows Cypress to transpile JSX code in [cypress/component/Test.cy-spec.js](cypress/component/Test.cy-spec.js) file.

## Usage

1. Make sure the root project has been built .

```bash
# in the root of the project
npm install
npm run build
```

2. Run `npm install` in this folder to symlink the `cypress-react-unit-test` dependency.

```bash
# in this folder
npm install
```

3. Start Cypress

```bash
npm run cy:open
# or just run headless tests
npm test
```

## Example

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
