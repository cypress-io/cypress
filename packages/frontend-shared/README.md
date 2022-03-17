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


## Front-end Conventions and Underlying Ideas

These apply to this package, `app`, and `launchpad`, as well as any future work in this Vue-Tailwind-GQL stack.
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
