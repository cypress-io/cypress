## @packages/scaffold-config

Logic related to scaffolding new projects using launchpad, including detecting component frameworks and bundlers, installing dependencies and creating `cypress.config.js` files. 

We have integrations for popular code generators like Create React App, Next.js and Vue CLI, and ship a `cypress.config.js` that will work out of the box for those templates.

We will also attempt to scaffold a configuration file for projects using React and Vue projects using Vite and Webpack that are not necessarily created using a code generator.

### Supported Frameworks and Libraries

| Name             | Version    | Dev Server | Version  | Library      | Component Adaptor       | Example Project                                                     |
| ---------------- | -------    | ---------- | -------- | ------------ | ----------------------- | ------------------------------------------------------------------- |
| Create React App | 5.x        | Webpack    | 5.x      | React 16, 17 | `@cypress/react@latest` | [TODO]                                                              |
| Create React App | 4.x        | Webpack    | 4.x      | React 16, 17 | `@cypress/react@latest` | [Link](../../system-tests/projects/create-react-app-configured)     |
| React            | -          | Vite       | 2.x      | React 16, 17 | `@cypress/react@latest` | [Link](../../system-tests/projects/react-vite-ts-configured)        |
| Vue              | -          | Vite       | 2.x      | Vue 3        | `@cypress/vue@latest`   | [Link](../../system-tests/projects/vue3-vite-ts-configured)         |
| Vue CLI          | 4.x        | Webpack    | 4.x      | Vue 2        | `@cypress/vue2@latest`  | [Link](../../system-tests/projects/vueclivue2-configured)           |
| Vue CLI          | 4.x        | Webpack    | 4.x      | Vue 3        | `@cypress/vue@latest`   | [Link](../../system-tests/projects/vueclivue3-configured)           |
| Vue CLI          | 5.x        | Webpack    | 5.x      | Vue 2        | `@cypress/vue2@latest`  | Covered by other Vue CLI test projects.                             |
| Vue CLI          | 5.x        | Webpack    | 5.x      | Vue 3        | `@cypress/vue@latest`   | [Link](../../system-tests/projects/vuecli5vue3-configured)          |
| Nuxt.js          | 2.x        | Webpack    | 4.x, 5.x | Vue 2        | `@cypress/vue2@latest`  | [Link](../../system-tests/projects/pristine-nuxtjs-vue2-configured) |

### TODO

These should be supported but currently are not configured.

| Name             | Version    | Dev Server | Version  | Library      | Component Adaptor       | Example Project                                                     |
| ---------------- | ---------- | ---------- | -------- | ------------ | ----------------------- | ------------------------------------------------------------------- |
| Next.js          | 11.x, 12.x | Webpack    | 4.x, 5.x | React 16, 17 | `@cypress/react@latest` | [Link](../../system-tests/projects/nextjs-configured)               |

### Adding More Projects

The process for adding a new library/framework/bundler is as follows:

1. Add your framework in [`src/frameworks.ts`](./src/frameworks.ts).
2. Any new dependencies are declared in [`src/constants.ts`](./src/constants.ts). Don't forget to add a description.
3. Ensure your project has the correct library and bundler detected with a test in [`test/unit/detect.spec.ts`](./test/unit/detect.spec.ts).
3. Add a new project with the correct `cypress.config.js` and `package.json` to [system-tests/projects](../../system-tests/projects). It should be `<name>-configured`, which is a working example with some specs. Ensure it will run on CI by adding it to [`component_testing_spec.ts`](../../system-tests/test/component_testing_spec.ts).
4. Add another project called `<name>-unconfigured`, which represents the project prior to having Cypress added. This will be used in step 5.
5. Add a test to [`scaffold-component-testing.cy.ts`](../launchpad/cypress/e2e/scaffold-component-testing.cy.ts) to ensure your project has the correct `cypress.config.js` generated. Use an existing test as a template.
