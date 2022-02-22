## @packages/scaffold-config

Logic related to scaffolding new projects using launchpad. We have integrations for popular code generators like Create React App, Next.js and Vue CLI, and ship a `cypress.config.js` that will work out of the box for those templates.

We will also attempt to scaffold a configuration file for projects using Vite and Webpack that are not necessarily created using a code generator.

### Supported Frameworks and Libraries

| Name | Tool Version | Dev Server | Dev Server Version | Library Version (s) | Component Adaptor Version | Example Project
| --- | ---- | ---- | --- | ---- | ---- | --- |
| Next.js | 11.x, 12.x | Webpack | 4.x, 5.x | React 16, 17 | `@cypress/react@latest` | [Link](../../system-tests/projects/pristine-nextjs-configured)
| Create React App | 4.x | Webpack | 4.x | React 16, React 17 | `@cypress/react@latest` | [Link](../../system-tests/projects/pristine-create-react-app-js)
| React | - | Vite | 2.x | React 16, React 17 | `@cypress/react@latest` 
| Vue CLI | 5.x | Webpack | 5.x | Vue 3 | `@cypress/vue@latest`
| Vue CLI | 4.x | Webpack | 4.x | Vue 2 | `@cypress/vue@2.0.4` | [Link](../../system-tests/projects/pristine-vuecli-vue2-configured)
| Nuxt.js | 2.x | Webpack | 4.x, 5.x | Vue 2 | `@cypress/vue@2.0.4` | [Link](../../system-tests/projects/pristine-nuxtjs-vue2-configured)
| Vue | - | Vite | 2.x | Vue 3 | `@cypress/vue@latest` 