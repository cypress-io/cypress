# tap CLI

The experimental `cypress tap` subcommands and their AUT-frame/CDP plumbing — commands an LLM agent runs against a live Cypress session.

## User-facing help must not leak internals

Help text describes WHAT a command does and its observable output/behavior — never how it gets there. Do not name the transport (CDP), the find-session/liveness mechanism, or in-browser binding internals.

Banned vocabulary (the class, not just these literals): "over CDP", "tap binding", "liveness probe", "isolated world", "backend node id", server PIDs / handshake internals — CDP protocol details, the find-session/liveness mechanism, and in-browser binding internals.

Before → after:

```
dom  read the app-under-test DOM over CDP, whole-page or by selector
dom  read the app-under-test DOM as HTML, whole-page or by selector
```

This text lives in the `description` / `details` fields in `commands/*.ts` and, for binding commands, the shared `TAP_COMMANDS` contract in `@packages/cypress-sessions` — audit those when adding or editing a command.

Internal mechanism belongs in code comments explaining *why*, not in help text.

## Telemetry and its opt-out

Every tap invocation reports itself once, on the way out, from `events.ts`: the command name, the names of the flags it parsed, the exit code, an error code, a duration, and the ids identifying the machine and Cloud user. Never the values — selectors, spec paths, test titles and project roots all travel in option values and error messages, so the payload is a fixed list of names and codes, and adding a field to it is a deliberate change to what Cypress collects.

Setting `CYPRESS_DISABLE_GUEST_TELEMETRY` to any value turns that report off, and it is not a tap-only knob: it is the opt-out for everything Cypress collects without an account behind it. The paths that answer to it:

