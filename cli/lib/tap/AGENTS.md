# tap CLI

The experimental `cypress tap` subcommands and their AUT-frame/CDP plumbing — commands an LLM agent runs against a live Cypress instance.

## User-facing help must not leak internals

Help text describes WHAT a command does and its observable output/behavior — never how it gets there. Do not name the transport (CDP), the discovery/liveness mechanism, or in-browser binding internals.

Banned vocabulary (the class, not just these literals): "over CDP", "tap binding", "liveness probe", "isolated world", "backend node id", server PIDs / handshake internals — CDP protocol details, the discovery/liveness mechanism, and in-browser binding internals.

Before → after:

```
dom  read the app-under-test DOM over CDP, whole-page or by selector
dom  read the app-under-test DOM as HTML, whole-page or by selector
```

This text lives in the `description` / `details` fields in `commands/*.ts` and, for binding commands, the shared `TAP_COMMANDS` contract in `@packages/cypress-instances` — audit those when adding or editing a command.

Internal mechanism belongs in code comments explaining *why*, not in help text.
