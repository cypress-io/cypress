# Frontend Shared

This package contains components and other code (such as Windi CSS config) that is is shared between the `app` (Cypress web app) and `launchpad` (Cypress Electron app) packages. Any functionality that is intended to the same in both can be added here and imported in those packages as needed. Base components like form inputs, cards, and modals, are written here, as well as higher level components that exist in both apps, like the header.

Conceivably, other packages may be created that also import from this shared component package.

## Building

### For development

In this package, we use Cypress Component Tests to develop the components in isolation, and no E2E tests. E2E tests should be written in the packages that consume these components (`app` and `launchpad`). This means that there is no app to visit for development, instead, we open Cypress:

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

These apply to this package, `app`, and `launchpad`, as well as any future work in this Vue-Tailwind-GQL stack. The goal is for this to provide useful context for new developers adding features to the codebase, or making changes to existing features. There are pros and cons to all of these decisions, but rather than get into those in detail, this is just a document of what practices we are following.

### Development Workflow

We recommend component-based test driven development. More details in the [Testing Practices](../../guides/testing-strategy-and-styleguide.md) guide. To make changes to an existing component:

1. Open Cypress and got to the spec that covers the component (often it's 1:1 but sometimes components are tested via their parents)
1. Update the test to reflect the desired change (or part of it)
1. Update the component to get the change implemented
1. Add Percy snapshot for any new unique states covered by the change

To create a new component:

1. Add a component spec file and the component file itself as siblings in the desired location
1. In the spec file, import and mount the component. If the component depends on a GQL fragment, use `mountFragment` to mount the component. If the component depends on a GQL query, create a wrapper that executes the query and passes the result into the child component via the `gql` prop, using a fragment to access the data in the child.

TODO: in light of gql subscriptions, this might already be out of date, revisit.
TODO 2: write generators that spin up well-formed components that do and do not depend on GQL

### Welcome to Vue 3!

If you are new to Vue 3, there are some new features we are using in this codebase that you should become familiar with.

But first, if you are coming from React to Vue 3, here's a small potential gotcha to note as you read and write Vue code: the idea of a `ref` in Vue is similar to a `ref` in React but with a major difference. In React, a when a ref's value changes, it doesn't trigger an update, or get "noticed" at all, by default. In Vue, a ref is part of the reactivity system and when the value updates, the component knows this and the updated value is reflected wherever the value is referenced. This can mean DOM updates, watchers firing, etc.

### Vue ideas and packages we are using

#### Composition API and `<script setup>`
We are using the [Composition API](https://vuejs.org/guide/extras/composition-api-faq.html) and specifically the [`<script setup>`](https://vuejs.org/api/sfc-script-setup.html#script-setup) syntax in our Vue Single File Components. This removes a lot of boilerplate, and because of that it's not always obvious reading the code which Vue features are being leveraged, compared to Vue 2.

If you are familiar with the Options API, which was the main way to write component script sections in Vue 2, the separation of variables and functions into named parts of the Options object like `computed` and `data` provided a familiar, but unwieldy, structure in each component. The Composition API lets us use those features anywhere we like, without dividing things into a predefined structure. `<script setup>` is a way to write Composition API code with less boilerplate and some other advantages described in the docs.
#### [Pinia](https://pinia.vuejs.org/)
TS-friendly, modularized state management - this is what we use instead of Vuex for the small amount of global state we have.

#### [VueUse](https://vueuse.org/)
Broad collection of composable utilities that provides reactive values for various common events and DOM properties, CSS rules, local storage and a lot of other stuff. Very useful if we feel the need to add and tear down low level event listeners, as this library already covers so many and exposes them to Vue correctly. It's like a front-end lodash, so where the VueUse implementation of something works for us, we prefer to use it instead of roll our own.

#### [Headless UI](https://headlessui.dev/)
We are using some components from Headless UI as the basis for UI patterns like modals, custom dropdowns, and expanding panels. We use Headless UI because it is well documented and the accessibility features are properly thought out. These advantages outweigh the occasional workarounds we have to use in order to get sophisticated behavior working that Headless UI does not support.
### Styles

#### Tailwind and Windi
We use [Tailwind](https://tailwindcss.com/) through [Windi CSS](https://windicss.org/). The codebase is utility-driven and all CSS that can be achieved through utility classes is written that way. The main way to reuse CSS in multiple places is to extract a component that applies the utility classes and can wrap other elements as needed.

#### Explicit Pixel Values
WindiCSS can create CSS classes as build time based on what class names we use in our components. That means syntax like this will work:

`<p class="p-20px">`

This allows us to specify explicit pixel values for measurements. We follow this pattern throughout the Cypress App codebase.
### Accessibility

We consider accessibility a core part of frontend code quality. When possible, interactions should be built out using standard semantic HTML elements. If there are no plain HTML solutions, we can reach for a library like HeadlessUI above that implements known patterns in an accessible way. In rare cases we will augment our HTML with ARIA roles. Tests should use the accessible name or label for interactive elements as described in the [testing guide](../../guides/testing-strategy-and-styleguide.md).
#### Accessibility Tree

The Accessibility Tree available in your browser's dev tools will show how the nature, structure, and labelling of the elements in the DOM is presented to assistive technology. We can use this to explore the accessibility of our components, especially when creating or reviewing more complex UI interactions.
### GraphQL in Vue Components
[GraphQL](https://graphql.org/) is the main source of data and state from the server in the app and launchpad. Vue components describe the data they will use in Queries or Fragments, as well as the Mutations they will use, which can set data on the server or trigger side effects like launching a project and opening the the user's browser.

Our GraphQL frontend client is [urql](https://formidable.com/open-source/urql/) using the [urql-vue](https://formidable.com/open-source/urql/docs/basics/vue/) package.

TODO: follow up with examples for using and testing gql