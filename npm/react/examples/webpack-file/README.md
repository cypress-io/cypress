# example: webpack-file

> Component tests for projects using existing [webpack.config.js](webpack.config.js) file

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

See tests in the [cypress/component](cypress/component) folder.
