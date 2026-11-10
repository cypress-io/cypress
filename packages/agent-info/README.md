# Agent Info

Detects whether the current process was invoked by an AI coding agent, and which one.

## Overview

Agents make themselves known through environment variables — `CLAUDECODE`, `GEMINI_CLI`,
`CURSOR_AGENT`, and so on. This package fingerprints the environment against a table of
those markers and reports a single name drawn from a closed set, so callers get a value
they can safely record rather than an arbitrary string from the environment.

It is pure, dependency-free TypeScript. It reads nothing but the environment object it is
given, touches no filesystem or network, and has no runtime dependencies.

## API Reference

### detectAgent

```typescript
import { detectAgent } from '@packages/agent-info'

detectAgent()                          // 'claude' when run under Claude Code
detectAgent({ GEMINI_CLI: '1' })       // 'gemini'
detectAgent({})                        // undefined
```

**Parameters**

- `env: NodeJS.ProcessEnv` — the environment to inspect. Defaults to `process.env`.

**Returns** the detected `AgentName`, or `undefined` when no agent is indicated.

### isAgent

```typescript
import { isAgent } from '@packages/agent-info'

if (isAgent()) {
  // running under some agent, named or not
}
```

**Parameters**

- `env: NodeJS.ProcessEnv` — the environment to inspect. Defaults to `process.env`.

**Returns** `true` when any agent is detected.

### AgentName

The closed set of names `detectAgent` can return:

`auggie`, `claude`, `codex`, `cursor`, `devin`, `gemini`, `goose`, `junie`, `kiro`,
`opencode`, `pi`, `replit`, `other`.

`other` is reported when the generic `AI_AGENT` variable is set to something the table
does not recognize — an agent is present, but not one this package can name.

## Detection notes

- **Agents outrank the IDEs hosting them.** An agent running inside Cursor reports as the
  agent, not as `cursor`.
- **Free-form values are narrowed, never forwarded.** `AI_AGENT` often carries a version
  (Claude Code sets `claude-code_2-1-221_agent`); it is reduced to a known name or
  `other`, so no unvetted environment string reaches a caller.
- **An interactive terminal means a human.** A few variables are set by both an IDE's
  integrated terminal and its agent. Those matches are skipped when stdin or stdout is a
  TTY, which keeps a human at a keyboard from being reported as an agent.

## License

This package is part of the Cypress project and is licensed under the MIT License.
