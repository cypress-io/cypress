---
paths:
  - "cli/**/*.ts"
  - "cli/**/*.js"
  - "packages/server/lib/plugins/child/**"
  - "packages/data-context/src/data/ProjectConfigIpc.ts"
---

# Runtime floor: the user's Node

This code runs in the **user's** Node, not the development Node and not the Node
embedded in Electron. The supported range is `engines.node` in
[`cli/package.json`](../../cli/package.json) — currently `^22.0.0 || ^24.0.0 || >=26.0.0`,
so the binding floor is **Node 22**, below the `24.15.0` in [`.node-version`](../../.node-version).

Before using a modern JS or Node API here, verify it against Node 22 on node.green.
An API that works in development can still crash a user on the oldest supported line.

Two entry points reach this floor without being under `cli/`:

- `packages/server/lib/plugins/child/require_async_child.ts` and everything reachable
  from it — the config/plugins child process.
- `packages/data-context/src/data/ProjectConfigIpc.ts`, which forks that child using
  `coreData.app.nodePath`.

Full context: [Runtime targets](../../AGENTS.md#runtime-targets).
