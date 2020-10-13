# example: rollup

> Compiling component tests using Rollup bundler

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
npm run build
```

3. Start Cypress

```bash
npm run cy:open
# or just run headless tests
npm test
```
