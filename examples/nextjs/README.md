# example: Next.js

> A typical project using [next.js](https://nextjs.org/)

![Page spec](images/page-spec.png)

## Configuration

In order to reuse next's webpack configuration and all the custom configuration defined in `next.config.js` connect special plugin in [plugin file](./cypress/plugins/index.js)

```js
const preprocessor = require('cypress-react-unit-test/plugins/next')

module.exports = (on, config) => {
  preprocessor(on, config)

  return config
}
```

## Usage

1. Run `npm install` in this folder to install dependencies.

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

## Server side props

⚠️⚠️ **Important:** ⚠️⚠️ Please do not test the page components using component testing. These components have too much responsibility and need to be tested as a part of your application flow. Consider using cypress `integration` tests.

But if you still want to test the page component, make sure that it will be mounted as any other pure `React` component. It means that next's specific functions like `getInitialProps` or `getStaticProps` **won't be called**.

But still you can call them manually:

```js
IndexPage.getInitialProps().then(props => {
  mount(<IndexPage {...props} />)
})

cy.contains(
  '`.getInitialProps()` was called and passed props to this component',
)
```

Find more examples in [Page.spec.jsx](./cypress/components/Page.spec.jsx).

## Router mocking

If your components depends on the next.js router (using `useRouter` or `withRouter`) **we recommend to cover this component with integration tests**, because this component is likely not reusable and depends on application flow. But if you still need to write component test for it you will likely meet the problem like `cannot read property 'pathname' of undefined`.

It happens because we render the component just like any other react component – without any specific next.js features. In order to make router work it is required to provide specific context that would be picked up by `useRouter`:

```js
import { mount } from 'cypress-react-unit-test'
import { RouterContext } from 'next/dist/next-server/lib/router-context'

// Create a router value you need for the components. Here are all available values as for next v9.5
// P.S. using cy.spy() here is not required, it is possible to pass simple () => {} function
const router = {
  pathname: '/testPath',
  route: '/testPath',
  query: {},
  asPath: '/testPath',
  components: {},
  isFallback: false,
  basePath: '',
  events: { emit: cy.spy(), off: cy.spy(), on: cy.spy() },
  push: cy.spy(),
  replace: cy.spy(),
  reload: cy.spy(),
  back: cy.spy(),
  prefetch: cy.spy(),
  beforePopState: cy.spy(),
}

// And wrap your component with special provider
mount(
  <RouterContext.Provider value={router}>
    <YourComponent />
  </RouterContext.Provider>,
)
```

Find more examples in [Router.spec.jsx](./cypress/components/Router.spec.jsx)

## Mocking imports

Mocking imports is not working yet, seems the plugin we are inserting for loose mode causes problems, see issue [439](https://github.com/bahmutov/cypress-react-unit-test/issues/439).
