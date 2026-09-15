---
paths:
  - "cli/**/*.ts"
  - "cli/**/*.js"
  - "packages/server/lib/plugins/child/**"
  - "packages/data-context/src/data/ProjectConfigIpc.ts"
---

# Runtime floor: the user's Node

This code runs in the **user's** Node, not the development Node and not the Node
embedded in Electron. The floor is the **lowest major** in `engines.node` in
[`cli/package.json`](../../cli/package.json), which is deliberately below the
[`.node-version`](../../.node-version) used for development — so the dev Node tells
you nothing about what is safe here:

```bash
node -e "console.log(require('./cli/package.json').engines.node)"
```

Check that major on node.green before using a modern JS or Node API. An API that
works in development can still crash a user on the oldest supported line.

Two entry points reach this floor without being under `cli/`:

- `packages/server/lib/plugins/child/require_async_child.ts` and everything reachable
  from it — the config/plugins child process.
- `packages/data-context/src/data/ProjectConfigIpc.ts`, which forks that child using
  `coreData.app.nodePath`.

Full context: [Runtime targets](../../AGENTS.md#runtime-targets).
