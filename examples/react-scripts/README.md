# example: react-scripts

> A typical project using `react-scripts` with components and matching component tests residing in the [src](src) folder.

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

![App test](images/app-test.png)

The spec [src/Logo.cy-spec.js](src/Logo.cy-spec.js) directly imports SVG into React spec file. The spec [src/resources.cy-spec.js](src/resources.cy-spec.js) confirm that static resources like SVG and fonts load correctly.
