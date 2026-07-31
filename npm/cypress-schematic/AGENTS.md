# @cypress/schematic

`@cypress/schematic` is a published npm package providing the official Angular CLI schematic and builder for Cypress. Running `ng add @cypress/schematic` in an Angular project scaffolds Cypress configuration, creates the `cypress.config.ts`, and registers Cypress as an Angular builder target for e2e and component testing.

## Key Commands

```sh
yarn build          # tsc -p tsconfig.build.json; compiles .ts to .js in-place under src/
yarn lint           # ESLint
yarn test -- <path-to-spec>            # run a specific vitest spec file
yarn test -- "<glob-pattern>"          # run vitest specs matching a glob
```

## Architecture

- `src/schematics/` — Angular schematics definitions:
  - `collection.json` — schematic collection manifest
  - `ng-add/` — `ng add` schematic (initial Cypress scaffolding)
  - `ng-generate/` — `ng generate` schematics (scaffold additional Cypress config)
  - `utils/` — shared schematic utility helpers
- `src/builders/` — Angular builders:
  - `builders.json` — builder collection manifest
  - `cypress/` — builder that invokes Cypress from the Angular CLI (`ng run app:cypress`)
- `src/e2e.spec.ts`, `src/ct.spec.ts` — vitest tests for the builders/schematics

## Gotchas / Notes

- Unlike most packages in this workspace, this package does NOT compile to a separate `dist/` directory — the TypeScript is compiled in-place and the `main` field points to `./src`. Nx outputs are `src/**/*.js` and `src/**/*.d.ts`.
- The directory name in the monorepo is `cypress-schematic/` but the published package name is `@cypress/schematic`.
- Peer dependencies require `@angular/cli >= 20.0.0` and `cypress >= 15.8.0`.
