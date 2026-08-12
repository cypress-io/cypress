# tap CLI

The experimental `cypress tap` subcommands and their AUT-frame/CDP plumbing — commands an LLM agent runs against a live Cypress instance.

## User-facing help must not leak internals

Help text describes WHAT a command does and its observable output/behavior — never how it gets there. Do not name the transport (CDP), the find-instance/liveness mechanism, or in-browser binding internals.

Banned vocabulary (the class, not just these literals): "over CDP", "tap binding", "liveness probe", "isolated world", "backend node id", server PIDs / handshake internals — CDP protocol details, the find-instance/liveness mechanism, and in-browser binding internals.

Before → after:

```
dom  read the app-under-test DOM over CDP, whole-page or by selector
dom  read the app-under-test DOM as HTML, whole-page or by selector
```

This text lives in the `description` / `details` fields in `commands/*.ts` and, for binding commands, the shared `TAP_COMMANDS` contract in `@packages/cypress-instances` — audit those when adding or editing a command.

Internal mechanism belongs in code comments explaining *why*, not in help text.

## Telemetry and its opt-out

Every tap invocation reports itself once, on the way out, from `events.ts`: the command name, the names of the flags it parsed, the exit code, an error code, a duration, and the ids identifying the machine and Cloud user. Never the values — selectors, spec paths, test titles and project roots all travel in option values and error messages, so the payload is a fixed list of names and codes, and adding a field to it is a deliberate change to what Cypress collects.

Setting `CYPRESS_DISABLE_GUEST_TELEMETRY` to any value turns that report off, and it is not a tap-only knob: it is the opt-out for everything Cypress collects without an account behind it. The paths that answer to it:

| Path | What it sends | Where the guard is |
| --- | --- | --- |
| tap CLI invocations | one `anon-collect` / `machine-collect` event per `cypress tap` command | `cli/lib/tap/events.ts` (read through `util.getEnv`, so npm config sets it too) |
| App and Launchpad UI events | every `recordEvent` GraphQL mutation — banners seen and dismissed, promos, CT-available, Debug page — to `anon-collect` / `machine-collect` | `packages/data-context/src/actions/EventCollectorActions.ts` |
| Run and artifact-upload crash reports | serialized exceptions to the Cloud crash endpoint | `packages/server/lib/cloud/reporting_disabled.ts`, via `lib/cloud/exception.ts` |
| Studio and cy-prompt error reports | bundle errors, method names and arguments | the same helper, via `lib/cloud/api/{studio,cy-prompt}/report_*_error.ts` |

Two collection paths deliberately do not read it: `recordEventGQL` local test counts, which only ever send for a logged-in user and so are not guest telemetry, and `@packages/telemetry`'s OpenTelemetry spans, which stay off unless `CYPRESS_INTERNAL_ENABLE_TELEMETRY` explicitly turns them on.

A new collection path honors this variable from the start rather than shipping a second knob. Each of the three code bases above reads the variable itself — the CLI bundle, `data-context` and `server` cannot share one helper cheaply — so a rename means touching all three.
