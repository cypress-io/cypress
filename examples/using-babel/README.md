# example: using-babel

Component testing for projects using Babel config

Note: run `npm install` in this folder to symlink `cypress-react-unit-test` dependency.

```shell
npm run cy:open
# or run headless tests
npm test
```

![Example component test](images/dynamic.gif)

## Specs

See specs [src/Post.spec.js](src/Post.spec.js) and [src/Skeleton.spec.js](src/Skeleton.spec.js). The specs are bundled using [.babelrc](.babelrc) settings via [cypress/plugins/index.js](cypress/plugins/index.js) file that includes file preprocessor

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
