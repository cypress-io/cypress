# Runner CT

The runner-ct is where the code for the component testing's runner lives and has the following responsibilities:

- Displaying the component specs list and all states around that in the runner

## Developing

### Watching

This watches and compiles all changes as you make them.

```bash
yarn workspace @packages/runner-ct watch
```

## Building

### For development

```bash
yarn workspace @packages/runner-ct build
```

### For production

```bash
yarn workspace @packages/runner-ct build-prod
```

## Testing

### Cypress Tests

You can run Cypress tests found in [`cypress/component`](./cypress/component):

```bash
yarn workspace @packages/runner-ct cypress:open
```

To watch and reload changes to the runner while testing you'll want to run:

```bash
yarn workspace @packages/runner-ct watch
```
