# UI Components

This packages contains React components that are shared between two or more of the UI packages (`desktop-gui`, `reporter`, & `runner`).

## Installing

Dependencies can be installed with:

```bash
cd packages/ui-components
npm install
```

## Developing & Testing

These components are best developed by using their Cypress tests.

Run this in one terminal tab to watch the source files

```bash
npm run watch
```

Run this in another terminal tab to run Cypress

```bash
npm run cypress:open
```

To run the tests once you can run:

```bash
npm run build && npm run cypress:run
```
