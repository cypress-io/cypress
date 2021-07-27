## Why are my types not showing up in the schema

Ensure that the types are exported so that they are imported into the root `makeSchema`.

There are often "barrel" files that re-export the types, such as in [`./entities/index.ts`](./entities/index.ts) or [`./constants/index.ts`](./constants/index.ts)

## Why is my query / mutation not being added

Queries & mutations must be `static` properties if using nexus-decorators

