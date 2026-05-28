# @packages/frontend-shared

Shared Vue 3 component library, TailwindCSS configuration, composables, GraphQL fragments, and i18n strings consumed by both `@packages/app` (browser-side UI) and `@packages/launchpad` (Electron-rendered UI). Any component or utility intended to appear identically in both apps belongs here.

## Key Commands

```bash
# Build the shared library
yarn workspace @packages/frontend-shared build

# Run component tests against a specific file or glob
yarn workspace @packages/frontend-shared cypress:run:ct -- --spec <path-to-spec>
yarn workspace @packages/frontend-shared cypress:run:ct -- --spec "<glob-pattern>"

# Generate the Shiki syntax highlighting theme
yarn workspace @packages/frontend-shared generate-shiki-theme

# Type-check
yarn workspace @packages/frontend-shared check-ts

# Lint
yarn workspace @packages/frontend-shared lint
```

## Architecture

```
src/
  assets/        Static assets (images, fonts) shared between apps
  components/    Base and higher-level Vue 3 components (inputs, cards, modals, header, etc.)
  composables/   Shared Vue composables (e.g., useExternalLink, useGraphQLClient)
  generated/     Auto-generated files: GraphQL schema snapshot used in tests
  gql-components/ Components that are tightly coupled to specific GraphQL queries/fragments
  graphql/       urql exchanges, GraphQL client setup, and fragment definitions
  locales/       i18n JSON translation files
  public/        Static public assets served during development
  shiki/         Syntax highlighting theme and language definitions
  store/         Shared Pinia stores
  styles/        Global CSS and Tailwind base styles
  utils/         Shared utility functions
  warning/       Warning/deprecation notification components
```

## Gotchas / Notes

- There are **no E2E tests** in this package — only component tests. E2E coverage comes from `app` and `launchpad` which consume these components.
- The `build` target depends on `generate-shiki-theme` (declared in `nx.targets`) — run that first if the generated theme file is missing.
- `patch-package` is applied via `postinstall` to patch a local dependency; it is nohoisted to prevent conflicts.
- The `generated/schema-for-tests.gen.json` is an nx output artifact and must exist before component tests can run type-checking correctly.

## Integration Points

- Depends on **@packages/data-context** (implicit nx dependency) — the GraphQL schema types are generated from data-context's Nexus build.
- Consumed by **@packages/app** and **@packages/launchpad** as a library; both import Vue components and composables directly from `src/`.
