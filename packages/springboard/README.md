# Springboard

Springboard is next-gen react application that is rendered by Electron. This acts as the visual user interface you see when running: `cypress open`.

It replaces the original electron app, `desktop-gui`.

**The Desktop GUI has the following responsibilities:**

- Allow users to log in through the Dashboard Service.
- Select testing mode (E2E, Component, Node.js)

## Building

### For development

```bash
## from repo root
yarn build --scope @packages/springboard
```

### For production

```bash
## from repo root
yarn build-prod --scope @packages/springboard
```

## Developing

```bash
## from repo root
yarn dev --scope @packages/springboard
```

You probably want to start webpack in watch mode, too:

```bash
## from repo root
yarn watch --scope @packages/springboard
```

## Testing

### In Cypress

This project is tested with Cypress itself. It acts exactly like any other Cypress project.

E2E tests:

```bash
## from repo root
yarn workspace @packages/springboard cypress:open
```

Component Tests:

```bash
## from repo root
yarn workspace @packages/springboard cypress:open:ct
```
