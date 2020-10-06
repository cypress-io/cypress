# example-sass-and-ts

> Testing components written in TypeScript with Sass imports

![Sass test](images/sass.png)

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

## Notes

Notice that Node Sass is a binary dependency, thus we need to run it using the same system version of Node as we installed. See [cypress.json](cypress.json) file.

```json
{
  "nodeVersion": "system"
}
```

To bundle code using the same [webpack.config.js](webpack.config.js) file, we point at it from [cypress/plugins/index.js](cypress/plugins/index.js) file.
