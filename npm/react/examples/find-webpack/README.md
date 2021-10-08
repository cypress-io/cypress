As of Cypress 7.0, the new Component Testing runner is now bundled with the Cypress! It takes inspiration and builds on the learnings from the original Component Testing implementation, which was hidden behind the `experimentalComponentTesting` flag.

In this blog post we will see how to set up Cypress Component Testing in a new React app created via Create React App using TypeScript.

You can get the source code for the example used in the blog post [here](https://github.com/lmiller1990/cypress-react-template).

## Creating a new React Project

Create a new React project to get started. Optionally add TypeScript - I'll be using it in this example.

```sh
yarn create react-app cypress-test-react --template typescript
```

## Configuring Cypress Component Testing

Once you've got a React project, you'll also need to install Cypress and the Webpack Dev Server and React adapters.

Create React App projects are Webpack based; that's why we are installing the relevant Webpack adapter. You also need `@cypress/react`, which is the primary way to mount and interact with components (similar to `mount` in Enzyme or `render` in Testing Library).

```sh
yarn add cypress @cypress/react @cypress/webpack-dev-server --dev
```

Next, create a `cypress.json` with some basic configuration:

```json
{
  "component": {
    "testFiles": "**/*.test.{js,ts,jsx,tsx}",
    "componentFolder": "src"
  }
}
```

Here we are adding some Component Testing specific options, hence the `"component"` key. `"componentFolder"` is where all the components and tests are located, and `"testFiles"` is the pattern to search for test files.

The last thing we need to is tell Cypress to use `@cypress/webpack-dev-server` for component tests. Plugins are explained in detail in the [Cypress documentation](https://docs.cypress.io/guides/tooling/plugins-guide#Installing-plugins). By default plugins are loaded from `cypress/plugins/index.js`. Create that file and add:

```js
const devServer = require("@cypress/react/plugins/react-scripts")

module.exports = (on, config) => {
  devServer(on, config)
  return config
}
```


This will configure the Cypress Webpack Dev Server to use the same Webpack configuration as Create React App uses.

If you are using a different template, like Next.js, we have some other [adapters available](https://github.com/cypress-io/cypress/tree/develop/npm/react/plugins). It's also possible to create your own adapter.

## Writing Some Tests

Let's migrate `src/App.test.tsx`, which comes with the Create React App template, to use Cypress. It's a simple migration:

```tsx
import React from 'react';
import { mount } from '@cypress/react';
import App from './App';

it('renders learn react link', () => {
  mount(<App />);
  cy.get('a').contains('Learn React');
});
```

Most tests will start with `mount` from `@cypress/react`. This is similar to `render` in Testing Library. Once you've mounted your component, you can use Cypress' extensive [query and assertion APIs](https://docs.cypress.io/api/table-of-contents) to ensure everything behaves correctly. This example asserts an anchor tag with the text "Learn React" is rendered.

Open the component testing runner with:

```sh
yarn cypress open --ct
```

And select the spec to run.

![](https://raw.githubusercontent.com/lmiller1990/cypress-react-template/master/cy-react.png)

Try making a change - the tests will re-run instantly. You not only immediately know if the test passed or failed, but be able to visually inspect and debug any changes.

You can run all the specs with `yarn cypress run --ct`. This is useful for executing all the specs in a CI environment, or one last check before you commit and push your code!

## Discussion

Cypress Component Testing is an alternative to a jsdom based testing environment, such as Jest and Vue Test Utils. Cypress Component Testing offers many benefits:

- Runs in a real browser. This means your tests are closer to what your users will be experiencing.
- Visual. You can see exactly what is rendered. No more scrolling through a cryptic terminal log to figure out what is rendered or to debug - just open the devtools and browse the DOM.
- Powered by Cypress - the most popular and reliable E2E testing tool out there.

It also doubles as a *design environment*. You can see the component as you develop it, and hot reload give you a near instance feedback loop. It can potentially take the place of not only your Jest based test infrastructure, but your Storybook based design infrastructure as well.

Cypress Component Testing is still in alpha but the product is quickly evolving and promises to change the landscape of Component Testing.

## Conclusion

Cypress Component Testing brings everything that is great about Cypress to Component Testing. Since the underlying adapters are built on libraries like Webpack, you don't need to throw away your entire test suite - incremental migration is more than possible.

The visual aspect united testing and design in a single tool. My days of grepping a messy console output to figure out what the user will see are over - I can see exactly what the component will look like as my tests run.

You can get the source code for the blog post [here](https://github.com/lmiller1990/cypress-react-template).
