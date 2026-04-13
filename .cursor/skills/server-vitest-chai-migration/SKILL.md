---
name: server-vitest-chai-migration
description: >-
  Maps Chai plugins from spec_helper (chai-subset, chai-uuid, chai-as-promised)
  to Vitest/Jest-compatible assertions when migrating packages/server *_spec
  files to Vitest *.spec.ts.
---

# Mocha/Chai → Vitest: spec_helper plugin mappings

`packages/server/test/spec_helper.js` registers **chai-subset**, **chai-uuid**, and **chai-as-promised** globally. Migrated Vitest specs use **`expect` from `vitest`** only — those plugins are not loaded.

## chai-subset (`expect(x).to.include({ ... })`)

Chai-subset adds **`include`** for **partial / subset** matching on objects (and arrays in some cases).

| Chai (subset) | Vitest |
|----------------|--------|
| `expect(obj).to.include({ a: 1, b: 2 })` | `expect(obj).toMatchObject({ a: 1, b: 2 })` |
| Same, when you need Jest asymmetric matcher | `expect(obj).toEqual(expect.objectContaining({ a: 1, b: 2 }))` |

**Notes**

- **`toMatchObject`** allows extra keys on `obj` and checks nested object shape similarly to subset.
- For **arrays of objects** where Chai checked membership with a subset, use **`expect(array).toContainEqual(partial)`** or map + **`expect(item).toMatchObject(...)`** per case.
- Do not confuse with Chai **`include`** on **strings** (`'foo'.includes('o')`) — Vitest: **`expect(str).toContain('o')`** (unrelated to chai-subset).

**Example in repo (still on Mocha):** `packages/server/test/unit/gui/windows_spec.ts` — `expect(options).to.include({ height: 500, ... })`.

## chai-uuid (`expect(x).to.be.a.uuid()`)

There is no built-in UUID matcher in Vitest.

| Chai | Vitest options |
|------|----------------|
| `expect(id).to.be.a.uuid('v4')` (etc.) | **`expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)`** for v4, or adjust for version |
| Prefer library validation | **`import { validate as uuidValidate, version as uuidVersion } from 'uuid'`** then `expect(uuidValidate(id)).toBe(true)` and `expect(uuidVersion(id)).toBe(4)` |

**Example in repo (still on Mocha):** `packages/server/test/unit/project-base_spec.js` — `expect(...).to.be.a.uuid()`.

## chai-as-promised

Used for assertions on **Promises** without always `await`ing manually. Vitest aligns with Jest: **`expect(promise).resolves` / `expect(promise).rejects`**.

### `.eventually` (property assertions on the resolved value)

| Chai | Vitest |
|------|--------|
| `expect(p).to.eventually.equal(x)` | `await expect(p).resolves.toBe(x)` |
| `expect(p).to.eventually.deep.equal(x)` | `await expect(p).resolves.toEqual(x)` |
| `expect(p).to.eventually.eq(x)` | `await expect(p).resolves.toBe(x)` |
| `return expect(p).to.eventually...` in Mocha | Use **`async` `it`** and **`await expect(p).resolves...`** (or `return` the `expect` promise — Vitest awaits returned promises) |

**Nested eventually** (promise resolves to a promise, or you assert on a chain):

- Prefer **one async step**: unwrap with **`await`** or **`.then`**, then assert, e.g. `const x = await outer; await expect(innerFn(x)).resolves.toEqual(...)`.
- Avoid piling `.eventually` chains; they are hard to read and easy to get wrong — flatten to **`await`** + **`resolves`**.

### `.be.fulfilled` / `.be.rejected`

| Chai | Vitest |
|------|--------|
| `await expect(p).to.be.fulfilled` | **`await expect(p).resolves.toBeDefined()`** if the resolved value is always defined; if it resolves **`undefined`**, use **`await expect(p).resolves.toBeUndefined()`**; if you only care that it does not throw, **`await p`** inside **`async` `it`** is enough |
| `expect(p).to.be.rejected` | **`await expect(p).rejects.toThrow()`** or **`await expect(p).rejects.toBeDefined()`** |
| `await expect(p).to.be.rejectedWith(ErrorClass, 'msg')` | **`await expect(p).rejects.toThrow(ErrorClass)`** and optionally **`await expect(p).rejects.toThrow(/msg/)`** or match message in **`toThrow`** |

**Note:** Chai **`rejectedWith`** with a **string** is often equivalent to **`rejects.toThrow('substring')`**.

### Sinon-chai (not chai-as-promised, but common in same files)

Use **`@vitest/spy`** / **`vi.fn()`** and **`expect(spy).toHaveBeenCalledWith(...)`** — see other migrated server specs; do not rely on **`calledWith`** from sinon-chai.

## Reference migration

- **`packages/server/test/unit/browsers/cdp-command-queue.spec.ts`** — migrated from `cdp-command-queue_spec.ts`; replaces **`expect(commandPromise).to.eventually.equal(resolution)`** with **`await expect(commandPromise).resolves.toBe(resolution)`**.

## Related

- **`packages/server/vitest.config.ts`** — Vitest include/exclude for `*.spec` vs `*_spec`.
- **`.cursor/skills/server-vitest-express/SKILL.md`** — Express / routes / supertest patterns.
- **`.cursor/skills/server-unit-simple-mocks-vitest/SKILL.md`** — minimal mockery → `vi.mock` for a single npm dep (e.g. `morgan`); use before pulling in deep-mocks patterns.
