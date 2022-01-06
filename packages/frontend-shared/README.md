# Frontend Shared

## Building

### For development

We only use Cypress Component Tests to develop the components in isolation

```bash
## from repo root
yarn workspace @packages/frontend-shared cypress:open
```

## Developing

For the best development experience, you will want to use VS Code with the [Volar](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar) extension. This will give you type completion inside `vue` files.

## Testing

```bash
yarn workspace @packages/frontend-shared test-unit
```

## Utility class usage

Windi CSS can create an awesome interactive summary showing our usage of utility classes and design tokens. Running this command will generate this report and serve it on localhost.

```bash
## from this directory
yarn windi
```

## Use of graphql by shared components is limited to `src/gql-components`

In the long run, files in the `src/components` directory are intended as the foundation of a design system. As such they may be used in many contexts other than the Cypress App and Launchpad. There are some components that are only intended to be shared between App and Launchpad and make use of GraphQL queries and mutations. These will only work correctly if placed within `src/gql-components` directory.

## Link Components

There are two shared components involved with links - `BaseLink`, and `ExternalLink`. `BaseLink` is responsible for default colors and hover/focus styles. `ExternalLink` wraps `BaseLink` is responsible for managing the GraphQL mutation that triggers links to open the in the user's default browser.

## Generate the theme for shiki

See [the readme in the src/public/shiki/themes directory](./src/public/shiki/themes/ReadMe.md)
