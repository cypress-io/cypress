# Frontend Shared

This package contains components and other code (such as TailwindCSS config) that is shared between the `app` (Cypress web app) and `launchpad` (Cypress Electron app) packages. Any functionality that is intended to be the same in both can be added here and imported in those packages as needed. Base components like form inputs, cards, and modals, are written here, as well as higher-level components that exist in both apps, like the header.

Conceivably, other packages may be created that also import from this shared component package.

## Building
### For development
In this package, we use Cypress Component Tests to develop the components in isolation, and no E2E tests. E2E tests should be written in the packages that consume these components (`app` and `launchpad`). This means that there is no app to visit for development, instead, we open Cypress:

```bash
## from repo root
yarn workspace @packages/frontend-shared cypress:open
```

## Developing
For the best development experience, you will want to use VS Code with the [Volar](https://marketplace.visualstudio.com/items?itemName=vue.volar) extension. This will give you type completion inside `vue` files.

## Testing
```bash
## from repo root
yarn workspace @packages/frontend-shared cypress:run:ct
```

## Link Components
There are two shared components involved with links - `BaseLink`, and `ExternalLink`. `BaseLink` is responsible for default colors and hover/focus styles. `ExternalLink` wraps `BaseLink` is responsible for managing the GraphQL mutation that triggers links to open the in the user's default browser.

## Generate the theme for shiki
See [the readme in the src/public/shiki/themes directory](./src/public/shiki/themes/ReadMe.md)

## Front-end Conventions, Underlying Ideas, and Gotchas
These apply to this package, `app`, and `launchpad`, as well as any future work in this Vue-Tailwind-GQL stack. The goal is for this to provide useful context for new developers adding features to the codebase, or making changes to existing features. There are pros and cons to all of these decisions, but rather than get into those in detail, this is just a document of what practices we are following.

### Development Workflow
We recommend component-based test driven development. More details in the [Testing Practices](../../guides/testing-strategy-and-styleguide.md) guide. To make changes to an existing component:

1. Open Cypress and go to the spec that covers the component (often it's 1:1 but sometimes components are tested via their parents)
1. Update the test to reflect the desired change (or part of it)
1. Implement the change in the component
1. Add Percy snapshot for any new unique states covered by the change

To create a new component:

1. Add a component spec file and the component file itself as siblings in the desired location
1. In the spec file, import and mount the component. If the component depends on a GQL fragment, use `mountFragment` to mount the component so it can receive test data through the `gql` prop. 

### Vue 3
If you are new to Vue 3, there are some new features we are using in this codebase that you should become familiar with.

But first, if you are coming from React to Vue 3, here's a small potential gotcha to note as you read and write Vue code: the idea of a `ref` in Vue is similar to a `ref` in React but with a major difference. In React, when a ref's value changes, it doesn't trigger an update, or get "noticed" at all, by default. In Vue, a ref is part of the reactivity system and when the value updates, the component knows this and the updated value is reflected wherever the value is referenced. This can mean DOM updates, watchers firing, etc.

Here are some features of Vue 3, and packages in the ecosystem, that are worth knowing about as we work in the codebase.

#### Composition API and `<script setup>`
We are using the [Composition API](https://vuejs.org/guide/extras/composition-api-faq.html) and specifically the [`<script setup>`](https://vuejs.org/api/sfc-script-setup.html#script-setup) syntax in our [Vue Single File Components (SFCs)](https://vuejs.org/guide/scaling-up/sfc.html). This removes a lot of boilerplate, and because of that it's not always obvious reading the code which Vue features are being leveraged, compared to Vue 2.

If you are familiar with the Options API, which was the main way to write component script sections in Vue 2, the separation of variables and functions into named parts of the Options object like `computed` and `data` provided a familiar, but unwieldy, structure in each component. The Composition API lets us use those features anywhere we like, without dividing things into a predefined structure. `<script setup>` is a way to write Composition API code with less boilerplate and some other advantages described in the docs.

#### [Pinia](https://pinia.vuejs.org/)
TS-friendly, modularized state management - this is what we use instead of Vuex for the small amount of global state we have.

#### [VueUse](https://vueuse.org/)
Broad collection of composable utilities that provides reactive values for various common events and DOM properties, CSS rules, local storage and a lot of other stuff. This library exposes many common low-level event listeners, exposing them to Vue and managing the necessary setup/teardown. It's like a front-end lodash, so where the VueUse implementation of something works for us, we prefer to use it instead of roll our own.

#### [Headless UI](https://headlessui.dev/)
We are using some components from Headless UI as the basis for UI patterns like modals, custom dropdowns, and expanding panels. We use Headless UI because it is well documented and the accessibility features are properly thought out. These advantages outweigh the occasional workarounds we have to use in order to get sophisticated behavior working that Headless UI does not support.

### Router
Only `@packages/app` has a router, so details are described in its [README](../app/README.md).

### Styles
#### Tailwind
We use [Tailwind](https://tailwindcss.com/). The codebase is utility-driven and all CSS that can be achieved through utility classes is written that way. The main way to reuse CSS in multiple places is to extract a component that applies the utility classes and can wrap other elements as needed.

#### Explicit Pixel Values
TailwindCSS can create CSS classes as build time based on what class names we use in our components. That means syntax like this will work:

`<p class="p-[20px]">`

This allows us to specify explicit pixel values for measurements. We follow this pattern throughout the Cypress App codebase.

As an example: instead of using the class `m-2` which applies the rule `margin: 0.5rem` in Tailwind and usually creates a margin of `8px` (with 16px font size), we write the class as `m-[8px]`, from which Tailwind will generate a class with the rule `margin: 8px`.

### Icons
#### Custom Icon Library
Cy has a very custom icon library, to meet the following needs:

* Most of our icons are duo-tone
* They must be styled with different colors in different contexts
* Since they're duotone, you want to target the specific strokes and fills of the SVGs to color them
* We should be able to apply color styles to icons with the same TailwindCSS approach we use for other styles - meaning we can write dynamic classes and use prefixes like `hover:` or `group-focus:` to change the colors.
* We don't want to import icons in Vue SFCs for basic use in templates, they should 'just work'.

#### Adding new icons
To add a new icon: 

1. Export the icon from Figma (all icons should come from the design system in Figma) as an SVG. 
1. Add the SVG to the [icons folder](./src/assets/icons). 
1. Name the file following the existing convention in there: `icon-name_x[size in pixels]`, e.g. `arrow-down_x16.svg`.
1. Manually edit the SVG file to add classes `icon-dark` and `icon-light` to the dark and light internal elements, and save the file. If an icon path doesn't define a class, nothing bad will happen, it just won't get targeted by any styling. `light` and `dark` refer to the 2 main colors present in a duotone icon, since often there is a "light" and "dark" color in the design. These can be though of as primary and secondary color, `color1`, `color2`, or anything else.
1. Finally, you don't need to expose anything. `./src/assets/icons` is automatically watched and loaded 😮

Now the icon is ready to be used in Vue SFC templates like this:

```jsx
/* This just works. No imports necessary */
<i-cy-path-to-icon_x16 />
```

This is possible through the use of the [auto-importing feature of unplugin-icons](https://github.com/antfu/unplugin-icons#auto-importing), which is set up in [vite.config.ts](./vite.config.ts).
#### Importing Icons
To use an icon in tests, or to refer to it in the `<script>` block of a component, import it this way:

`import MyIcon from '~icons/cy/path-to-icon_x16'`

#### Styling Icons
This example renders a book icon from `./src/assets/book_x16.svg` and makes it pink for the 'light' color and purple for the 'dark' color. It uses the `hover:` pseudoclass to invert the light/dark colors on hover. A class string formatted like this:

`icon-light` + `-any-color-100`

will be used to target paths and strokes inside the SVG that have the class `icon-light` and apply the specific color to those elements.

```jsx

<i-cy-book_x16 class=" icon-light-pink-100 icon-dark-purple-500 hover:icon-light-purple-500 hover:icon-dark-pink-100" />
```

#### Implementation: Custom classes w/ a TailwindCSS plugin
To support selecting specific paths while keeping Tailwind's incredibly helpful interaction helpers (e.g. `group-hover` or `group-focus`), we use a TailwindCSS plugin. Tailwind configuration lives in the [tailwind.config.cjs](./tailwind.config.cjs) file in this package.

### Accessibility
We consider accessibility a core part of front-end code quality. When possible, components should be built out using standard semantic HTML elements. If there are no plain HTML solutions for a particular interaction, we can reach for a library (like HeadlessUI above) that implements known patterns in an accessible way. In rare cases we will augment our HTML with ARIA roles. Tests should use the accessible name or label for interactive elements as described in the [testing guide](../../guides/testing-strategy-and-styleguide.md).

#### The Accessibility Tree
The [Accessibility Tree](https://developers.google.com/web/fundamentals/accessibility/semantics-builtin/the-accessibility-tree) available in your browser's dev tools will show how the nature, structure, and labelling of the elements in the DOM is presented to assistive technology. We can use this to explore the accessibility of our components, especially when creating or reviewing more complex UI interactions, to make sure the content that appears there makes sense.

### GraphQL in Vue Components
[GraphQL](https://graphql.org/) is the main source of data and state from the server in the app and launchpad. In their `<script>` block, Vue components describe the data they will receive in Queries or Fragments, as well as the Mutations they will trigger, which can set data on the server or trigger side effects like launching a project and opening the the user's browser.

Our GraphQL frontend client is [urql](https://formidable.com/open-source/urql/) using the [urql-vue](https://formidable.com/open-source/urql/docs/basics/vue/) package. This provides composables like `useQuery` and `useMutation` to simplify interacting with GraphQL.

By convention, we use a prop named `gql` to represent the source of data, so it is common to see things like `props.gql.currentProject`.

### Use of GraphQL by shared components is limited to `src/gql-components`
In the long run, files in the `src/components` directory are intended as the foundation of a design system. As such they may be used in many contexts other than the Cypress App and Launchpad. There are some components that are only intended to be shared between App and Launchpad and make use of GraphQL queries and mutations. These will only work correctly if placed within `src/gql-components` directory, because only that directory is specified in [graphql-codegen.yml](../graphql/graphql-codegen.yml). This is intended to maintain the separation between genuinely reusable components driven by props and events, and gql-driven components that are tightly bound to the implementation of App and Launchpad.

## Generating Fixtures

Some components need spec JSON fixtures to test them. `generate-stub-specs` script helps you generate them.

```bash
# inside frontend-shared project
yarn generate-stub-specs <filename> <n> <baseTypeName> [--app]
```

* `filename` is the name of the file you want to create.
* `n` is the number of stub specs to be created in the file.
* `baseTypeName` is `Spec` or `FileParts`.
* `--app` option creates fixtures inside the `app` package. Without it, they're added inside the `frontend-shared` package.
