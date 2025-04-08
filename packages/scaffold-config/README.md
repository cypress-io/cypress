## @packages/scaffold-config

Logic related to scaffolding new projects using launchpad, including detecting component frameworks and bundlers, installing dependencies and creating `cypress.config.js` files. 

We have integrations for popular code generators like Next.js and Vue CLI, and ship a `cypress.config.js` that will work out of the box for those templates.

We will also attempt to scaffold a configuration file for projects using React and Vue projects using Vite and Webpack that are not necessarily created using a code generator.

### Supported Frameworks and Libraries

| Name             | Version| Dev Server | Version | Library            | Component Adaptor          | Example Project                                                     |
| ---------------- | -------| ---------- | ------- | ------------------ | -------------------------- | ------------------------------------------------------------------- |
| React            | -      | Vite       | 4, 5    | React 18, 19       | `@cypress/react@latest`    | [Link](../../system-tests/projects/react-vite-ts-configured)        |
| React            | -      | Webpack    | 4, 5    | React 18, 19       | `@cypress/vue@latest`      | [Link](../../system-tests/projects/react18)                         |
| Vue              | -      | Vite       | 4, 5, 6 | Vue 3              | `@cypress/react@latest`    | [Link](../../system-tests/projects/vue3-vite-ts-configured)         |
| Vue              | -      | Webpack    | 4, 5    | Vue 3              | `@cypress/vue@latest`      | [Link](../../system-tests/projects/vue3-webpack-ts-configured)      |
| Angular          | -      | Webpack    | 5       | Angular 17, 18, 19 | `@cypress/angular@latest`  | [Link](../../system-tests/projects/angular-cli-configured)          |
| Svelte           | -      | Vite       | 4, 5, 6 | Svelte 5           | `@cypress/svelte@latest`   | [Link](../../system-tests/projects/svelte-vite-configured)          |
| Svelte           | -      | Webpack    | 4, 5    | Svelte 5           | `@cypress/svelte@latest`   | [Link](../../system-tests/projects/svelte-webpack-configured)       |
| Next.js          | 14, 15 | Webpack    | 4, 5    | React 18, 19       | `@cypress/react@latest`    | [Link](../../system-tests/projects/nextjs-configured)               |

### Adding More Projects

The process for adding a new library/framework/bundler is as follows:

1. Add your framework in [`src/frameworks.ts`](./src/frameworks.ts).
2. Any new dependencies are declared in [`src/constants.ts`](./src/constants.ts). Don't forget to add a description.
3. Ensure your project has the correct library and bundler detected with a test in [`test/unit/detect.spec.ts`](./test/unit/detect.spec.ts).
3. Add a new project with the correct `cypress.config.js` and `package.json` to [system-tests/projects](../../system-tests/projects). It should be `<name>-configured`, which is a working example with some specs. Ensure it will run on CI by adding it to [`component_testing_spec.ts`](../../system-tests/test/component_testing_spec.ts).
4. Add another project called `<name>-unconfigured`, which represents the project prior to having Cypress added. This will be used in step 5.
5. Add a test to [`scaffold-component-testing.cy.ts`](../launchpad/cypress/e2e/scaffold-component-testing.cy.ts) to ensure your project has the correct `cypress.config.js` generated. Use an existing test as a template.
