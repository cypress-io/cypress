# example: react-scripts-folder

A typical project using `react-scripts` with components in the [src](src) folder and component tests inside [cypress/component](cypress/component) folder. Cypress automatically finds Webpack settings used by `react-scripts` and inserts the component folder name allowing to transpile the component specs the same way the `src` code is transpiled.

Note: run `npm install` in this folder to symlink `cypress-react-unit-test` dependency.

```shell
npm run cy:open
# or just run headless tests
npm test
```

![App test](images/app-test.png)
