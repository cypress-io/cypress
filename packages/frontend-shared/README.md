# Frontend Shared

This package contains components and other code (such as Windi CSS config) that is is shared between the `app` (Cypress web app) and `launchpad` (Cypress Electron app) packages. Any functionality that is intended to the same in both can be added here and imported in those packages as needed. Base components like form inputs, cards, and modals, are written here, as well as higher level components that exist in both apps, like the header.

Conceivably, other packages may be created that also import from this shared component package.

## Building

### For development

We only use Cypress Component Tests in this package, to develop the components in isolation. E2E tests should be written in the packages that consume these components (`app` and `launchpad`).

```bash
## from repo root
yarn workspace @packages/frontend-shared cypress:open
```

## Developing

For the best development experience, you will want to use VS Code with the [Volar](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar) extension. This will give you type completion inside `vue` files.

## Testing

```bash
## from repo root
yarn workspace @packages/frontend-shared cypress:run:ct
```

## Utility class usage

Windi CSS can create an awesome interactive summary showing our usage of utility classes and design tokens. Running this command will generate this report and serve it on localhost.

```bash
## from this directory
yarn windi
```

This will be useful from time to time so that we can audit our usage of these classes and extract repeated patterns into Windi shortcuts or otherwise consolidate them, when it makes sense to do so.

## Use of graphql by shared components is limited to `src/gql-components`

In the long run, files in the `src/components` directory are intended as the foundation of a design system. As such they may be used in many contexts other than the Cypress App and Launchpad. There are some components that are only intended to be shared between App and Launchpad and make use of GraphQL queries and mutations. These will only work correctly if placed within `src/gql-components` directory, because only that directory is specified in [graphql-codegen.yml](graphql-codegen.yml).
## Link Components

There are two shared components involved with links - `BaseLink`, and `ExternalLink`. `BaseLink` is responsible for default colors and hover/focus styles. `ExternalLink` wraps `BaseLink` is responsible for managing the GraphQL mutation that triggers links to open the in the user's default browser.

## Generate the theme for shiki

See [the readme in the src/public/shiki/themes directory](./src/public/shiki/themes/ReadMe.md)


## Front-end Conventions, Underlying Ideas, and Gotchas

These apply to this package, `app`, and `launchpad`, as well as any future work in this Vue-Tailwind-GQL stack.

### Development Workflow

We recommend component-based test driven development. More details in the [Testing Practices](guides/testing-strategy-and-styleguide.md) guide. To make changes to an existing component:

1. Open Cypress and got to the spec that covers the component (often it's 1:1 but sometimes components are tested via their parents)
1. Update the test to reflect the desired change (or part of it)
1. Update the component to get the change implemented
1. Add Percy snapshot for any new unique states covered by the change

To create a new component:

1. Add a component spec file and the component file itself as siblings in the desired location
1. In the spec file, import and mount the component. If the component depends on a GQL fragment, use `mountFragment` to mount the component. If the component depends on a GQL query, create a wrapper that executes the query and passes the result into the child component via the `gql` prop, using a fragment to access the data in the child.

TODO: in light of gql subscriptions, this might already be out of date, revisit.

### Welcome to Vue 3!

If you are new to Vue 3, there are some new features we are using in this codebase that you should become familiar with.

But first, if you are coming from React to Vue 3, here's a small potential gotcha: the idea of a `ref` in Vue is similar to a `ref` in React but with a major difference: In React, a when a ref's value changes, it doesn't trigger an update or get "noticed", by default. In Vue, a ref is part of the reactivity system and when the value updates, the component knows this and the updated value is reflected wherever the value is referenced. This can mean DOM updates, watchers firing, etc.

### Vue ideas and packages we are using

#### Composition API `<script setup>`
Link to docs/tutorials for both.
#### Pinia
TS-friendly, modularized state management - this replaces Vuex for the small amount of global state we have.
### Styles
#### Tailwind and Windi
#### Explicit Pixel Values
### Accessibility
#### Not a bonus, a core requirement
#### Accessibility Tree

### GraphQL in Vue Components
#### Queries, Fragments, Mutations
#### Wrapper pattern for component testing
#### Mount Fragment
#### Component testing mutations
