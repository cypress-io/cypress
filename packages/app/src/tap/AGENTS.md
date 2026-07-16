# tap — the `cypress tap` binding

The runner-side implementation of the tap binding: the surface the CLI drives over
CDP to inspect and control a live Cypress run. `TapManager` (`tap-manager.ts`) is
mounted at `window.__CYPRESS_TAP_BINDING__` on the runner top window and exposes two
async, JSON-only methods — `getSchema()` and `exec(command, args?, options?)`.

## Layout

- `tap-manager.ts` — the binding surface; validates the wire payload and dispatches to a command.
- `TapManagerDataSource.ts` — the single seam onto runner-window globals (`getEventManager` → `getCypress().runner` → `getAllTestsState` plus `runComplete`, `__RUN_MODE_SPECS__`, `location.hash`). Commands read globals only through it.
- `contract.ts` — the frozen cross-process contract. The shared half lives in `@packages/cypress-instances`; the CLI reads the same contract from that package's compiled build. Do not fork it here.
- `exec-args.ts` — app-side coercion of raw wire strings into typed params/options.
- `commands/index.ts` — the command registry, the single source of truth for available subcommands.
- `commands/definition.ts` — `defineCommand` authoring helper and `TapCommandError` (domain failures).
- `commands/*.ts` — one module per subcommand (`specs`, `run`, `tests`).
- `commands/test-state.ts` — serialization of runner test state for the `tests` command.

## Contracts MUST be validated in the e2e tests, without mocking

The e2e spec `packages/app/cypress/e2e/tap-binding.cy.ts` is the authoritative test
of this package. It drives the **real** `window.__CYPRESS_TAP_BINDING__` against a
**real** runner (scaffold → open → run a spec → `exec(...)`).

Rules:

- **Every command contract — its result shape, its exact field set, and every
  failure code — MUST be asserted in `tap-binding.cy.ts` against the real binding,
  with no stubbing or mocking of the runner seam.** This is the only layer that
  proves the coupling to Cypress internals (`getEventManager`, `getCypress().runner`,
  `getAllTestsState`, `eventManager.runComplete`, and the
  runtime `SerializedTest` shape) still holds. Those internals are not ours; only an
  unmocked end-to-end run catches them drifting.
- Adding or changing a subcommand is not done until its happy path **and** its
  domain-failure codes are covered by real `exec(...)` calls in that spec.
- Assert the **exact** key set of every result (e.g. `expect(Object.keys(entry)).to.deep.eq([...])`),
  not just presence — the contract is that nothing internal leaks onto the wire.

The co-located `*.cy.ts` component tests (e.g. `commands/tests.cy.ts`) stub the seam
(`tapManagerDataSource.getRunner`) to exercise serialization branches and edge cases
cheaply. They are a supplement, never a substitute: because they replace the seam,
they cannot catch a Cypress-internals change. Never treat green component tests as
proof a contract holds.

## Adding a subcommand

1. Add a `commands/<name>.ts` module built with `defineCommand`.
2. Register it in `commands/index.ts`.
3. Add real `exec('<name>', ...)` coverage to `tap-binding.cy.ts` — happy path and
   every failure code — with no mocking (see above).
4. Component tests for branch coverage are optional and stub-based; the e2e coverage is not.
