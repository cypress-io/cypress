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
