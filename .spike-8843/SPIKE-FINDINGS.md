# Spike: Approach B feasibility — Shadow DOM in snapshots (#8843)

**Question:** Can Cypress capture/restore time-travel DOM snapshots that include
shadow DOM by serializing to **Declarative Shadow DOM** via
`Element.getHTML({ serializableShadowRoots, shadowRoots })` and re-hydrating with
`Element.setHTMLUnsafe()`, instead of the current `importNode`/`adoptNode` node-clone
(which drops shadow roots — `packages/driver/src/cy/snapshots.ts:176`)?

**Answer: Yes, for the common case.** Confirmed with a real round-trip in Chromium 141
(`shadow-roundtrip.html`, run headless). Two inherent gaps remain (closed roots,
`adoptedStyleSheets`).

## Round-trip result (Chromium 141, headless)

| Check | Result | Meaning |
|---|---|---|
| `getHTML` / `setHTMLUnsafe` / `parseHTMLUnsafe` present | ✅ all true | APIs available |
| Open shadow roots collected (TreeWalker, incl. nested) | ✅ 4 found | reuses existing `findAllShadowRoots()` pattern |
| Serialized output uses `<template shadowrootmode>` | ✅ | declarative shadow DOM emitted |
| Open shadow text restored | ✅ | shadow content survives |
| **Scoped `<style>` inside root restored AND applies** (computed `rgb(1,2,3)`) | ✅ | scoped styling preserved — the core win |
| Nested (2-level) shadow text restored | ✅ | N-deep works |
| `<slot>` + slotted light DOM restored | ✅ | projection intact |
| `adoptedStyleSheets` style applies after restore | ❌ (expected) | constructable sheets are **not** serialized by `getHTML` |
| Closed shadow root present after restore | ❌ (expected) | `el.shadowRoot === null` from outside — unreachable |

## Browser matrix (Cypress targets)

`getHTML({serializableShadowRoots})` is **Baseline 2024 (newly available, Sept 2024)**:

| Browser | Min version | Cypress impact |
|---|---|---|
| Chrome / Edge | 125 | ✅ evergreen |
| **Electron (bundled, default)** | Chromium 138 (Electron 37) | ✅ default snapshot/Test-Replay browser fully supports it |
| Firefox | 128 (also ESR 128) | ✅ current; ❌ <128 |
| Safari / WebKit | 18.0 | ✅ current Playwright WebKit; ❌ older |

`setHTMLUnsafe`/`parseHTMLUnsafe` shipped even earlier (Chrome 124, FF 123, Safari 17.4).

## Conclusion / recommendation

Approach B is viable today — notably the **default bundled Electron browser supports it**,
which is where time-travel snapshots and Test Replay matter most. Recommended scope:

1. **Capture** (`createSnapshotBody`): collect open shadow roots (reuse
   `findAllShadowRoots`) and serialize with `getHTML({ serializableShadowRoots: true,
   shadowRoots })`. Note this shifts capture from node-cloning to string-serialization,
   so the `importNode`-to-avoid-custom-element-constructors safeguard (#7187/#1068) and
   the cross-origin `serialization/log.ts` path need re-checking against the string form.
2. **Restore** (`aut-iframe.ts:restoreDom`): build the body via `setHTMLUnsafe`.
3. **Feature-detect** `getHTML`/`setHTMLUnsafe`; fall back to today's behavior on old browsers.
4. **Document limitations:** closed shadow roots and `adoptedStyleSheets` won't be
   captured. Mitigation for adopted sheets: read `shadowRoot.adoptedStyleSheets[*].cssRules`
   and inline them as a `<style>` during capture (follow-up).
5. **Form state:** as with light DOM today, input `value`/`checked`/`selected` inside
   shadow roots must be hydrated to attributes before serialization.

## Repro

```bash
/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
  --headless --no-sandbox --disable-gpu --dump-dom \
  "file://$PWD/shadow-roundtrip.html" | grep SPIKE_RESULT_JSON
```
