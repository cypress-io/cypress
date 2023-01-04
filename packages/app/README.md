## App

This is the front-end for the Cypress App.

## Development

1. `yarn watch` (inside of root)
    * While developing, you might want to consider the [CYPRESS_INTERNAL_VITE_DEV](../../CONTRIBUTING.md#internal-vite-options) option.
2. `yarn cypress:open` (inside of `packages/app`)
3. It will open launchpad
4. Select Component or E2E Testing
5. Open chrome (or another browser)
6. It will show the new Vite powered app

## How the App works

Cypress has two modes: `run` and `open`. We want run mode to be as light and fast as possible, since this is the mode used to run on CI machines, etc. Run mode has minimal UI showing only what is necessary. Open mode is the interactive experience.

- **`open`** mode is driven using GraphQL and urql. It shows the full Cypress app, include the top nav, side nav, spec list, etc. You can change between testing types, check your latest runs on Cypress Cloud, update settings, etc.
- **`run`** mode is does not rely on GraphQL. This is so we can be as performant as possible. It only renders the "runner" part of the UI, which is comprised of the command log, Spec Runner header, and AUT iframe.

The two modes are composed using the same logic, but have slightly different components. You can see where the differences are in `Runner.vue`(src/pages/Specs/Runner.vue). Notice that `<SpecRunnerOpenMode>` receives a `gql` prop, since it uses GraphQL, and `<SpecRunnerRunMode>` does not.

## General front-end orientation

See the `@packages/frontend-shared` [package README](../frontend-shared/README.md).
## Router

The App's routing doesn't need to be touched often, because it is almost all auto-generated based on the file structure. There's so little code that it helps to describe the approach here so that when we do want to modify a route or do some other route-specific behavior, we can get our bearings.

[`vite-plugin-pages`](https://github.com/hannoeru/vite-plugin-pages) is used to generate routes based on the page-level Vue components contained in `src/pages`. These generated routes are pulled into a standard [Vue Router](https://router.vuejs.org/) setup using `createRouter()` in [`router.ts`](src/router/router.ts).

Route configuration that might typically appear in `router.ts` can be set in a `<route>` block in these page components, for example `name` and `meta` properties (documented in Vue Router docs):

```ts
<route>
  {
    name: 'SpecRunner',
    meta: {
      header: false,
      navBarExpandedAllowed: false
    }
  }
</route>
```

The advantage here is that the route definition is co-located with the component. The route block will be parsed as JSON5 by default, which means that certain Vue Router properties aren't valid in the `<route>` block, such as if a function is needed to be the value. 

So far, we haven't needed to use any such properties, but if we do, [`extendRoute`](https://github.com/hannoeru/vite-plugin-pages#extendroute) can be used where the `Pages` plugin is added in `vite.config.ts` to extend the generated route objects, using regular TypeScript. 

### Some gotchas if you are new to Vue Router

#### `name` vs `path`

With the implicit setup of the router, routes are named based on the file name. This is not always ideal as the route's name is used in the UI as the title. The `name` property can be overridden in the `<route>` block of a single file component, so that we can have a more appropriate user-facing name, or something that's more explicit and stable when we intend to refer to it in code.

In addition to sometimes showing a route's name in the UI, we also use the `name` value to push a new route object to the router (either in code directly, or using `RouterLink`s), if that object includes `params`. Otherwise we usually use `path` when pushing to the router.

Example of `name` + `params` in a route object:

```ts
router.push({ 
  name: 'Specs', 
  params: {
    unrunnable: 'path/to/unrunnableSpec.cy.ts',
  } 
})    
```

Example of pushing with `path` + `query`: 

```ts
router.push({ 
  path: '/specs/runner', 
  query: { file: 'path/of/spec/toRun.cy.ts' } 
})
```

These objects in this format can be used either with `push` to the router directly or in a `router-link`'s `to` prop.

#### `params` vs `query`

More details on all of this are at https://router.vuejs.org/ - these are just some examples of things we are using here:

We use `params` when there is temporary state that should be present when a user gets to a route from somewhere else in the App, but shouldn't be present after page refresh or when using the `back` button. An example of this in use is the notice that appears over the AUT if you visit a spec from the "View this Spec" link right after creating it. This banner is useful only in that narrow situation, so a route param is a nice way to have it open when needed, and then ignored at other times, without needing to put it in a store and clean it up. 

For values that should survive a page refresh, we use `query` in the route object to put the values into the URL's query parameters. This is the most common way to attach state to a particular route, we usually want that state to be present if we refresh the page or copy and paste a link.

The terminology can get a bit confusing as Vue Router's `params` are not the query parameters in the url. Vue Router's `params` can be accessed and used to form dynamic parts of a URL's path, but we are not currently using that feature, so for us `params` are used as described above. The option to interpolate values from `params` into a `path` is why the `to` property needs to be the route's `name` in order for `params` to be passed. Vue will warn, not error, if we try to do specify both `path` and `params` in a `to` or a router push, and our `params` will be ignored.


## Using existing, Vite-incompatible modules

Some of our modules, like `@packages/reporter`, `@packages/driver` and `@packages/runner` cannot be easily
used with Vite due to circular dependencies and modules that do not have compatible ESM builds.

To work around this, when consuming existing code, it is bundled with webpack and made available under the
`window.UnifiedRunner` namespace. It is injected via [`injectBundle`](./src/runner/injectBundle.ts).

To add more code to the bundle, add it in the bundle root, `@packages/runner/src/main.tsx` and attach it to
`window.UnifiedRunner`.

As a rule of thumb, avoid importing from the older, webpack based modules into this package. Instead, if you want to consume code from those older, webpack bundled modules, you should add them to the webpack root and consume them via `window.UnifiedRunner`. Ideally, update [`index.d.ts`](./index.d.ts) to add the types, as well.


