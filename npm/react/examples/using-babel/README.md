# example: using-babel

> Component testing for projects using Babel config

![Example component test](images/dynamic.gif)

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

## Specs

See spec files [src/\*.spec.js](src). The specs are bundled using [.babelrc](.babelrc) settings via [cypress/plugins/index.js](cypress/plugins/index.js) file that includes file preprocessor

```js
// let's bundle spec files and the components they include using
// the same bundling settings as the project by loading .babelrc
const preprocessor = require('cypress-react-unit-test/plugins/babelrc')
module.exports = (on, config) => {
  preprocessor(on, config)
  // IMPORTANT to return the config object
  // with the any changed environment variables
  return config
}
```

## Mocking

During test runs, there is a Babel plugin that transforms ES6 imports into plain objects that can be stubbed using [cy.stub](https://on.cypress.io/stub). In essence

```js
// component imports named ES6 import from "calc.js
import { getRandomNumber } from './calc'
const Component = () => {
  // then calls it
  const n = getRandomNumber()
  return <div className="random">{n}</div>
}
```

The test can mock that import before mounting the component

```js
import Component from './Component.jsx'
import * as calc from './calc'
describe('Component', () => {
  it('mocks call from the component', () => {
    cy.stub(calc, 'getRandomNumber')
      .as('lucky')
      .returns(777)
    mount(<Component />)
  })
})
```
