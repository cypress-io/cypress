# Design Plan — Native (CDP/BiDi) Typing for `cy.type()`

**Tracking issue:** [#1930 — `checkValidity()` returns true instead of false for min length on input](https://github.com/cypress-io/cypress/issues/1930)

**Status:** Proposed (design only — no implementation in this document)

---

## 1. Problem Statement

`cy.type()` into an `<input>` / `<textarea>` does not trip the HTML5
`minLength` / `maxLength` constraints. After typing a value shorter than
`minlength`, `el.checkValidity()` returns `true` (and `el.validity.tooShort`
is `false`) even though a real user typing the same value would see the field
report as invalid.

This is **specific to two constraints only**: `tooShort` (`minlength`) and
`tooLong` (`maxlength`). Every other constraint already works in Cypress today
(`valueMissing`/`required`, `typeMismatch`/`type=email`, `patternMismatch`/`pattern`,
`rangeUnderflow`/`rangeOverflow`/`min`/`max`, `stepMismatch`/`step`, `badInput`).

### 1.1 Root cause

Per the [HTML standard][html-tooshort], the `tooShort` constraint applies only
when an element's:

> … *dirty value flag* is true, **its value was last changed by a user edit
> (as opposed to a change made by a script)**, and the code-unit length of the
> element's value is less than the element's minimum allowed value length …

`tooLong` has the [identical "last changed by a user edit"][html-toolong]
requirement.

When Cypress types into a regular input today, it mutates the value through the
**native IDL value setter**:

```ts
// packages/driver/src/dom/selection.ts:631
$elements.setNativeProp(el, 'value', updatedValue)
```

`setNativeProp` resolves and invokes `HTMLInputElement.prototype`'s `value`
setter (`packages/driver/src/dom/elements/nativeProps.ts:42-61, 260-276`). The
browser classifies an IDL setter write as a **script change**. It dutifully
sets the dirty value flag, but it never sets the "value was last changed by a
user edit" flag — so `tooShort` / `tooLong` can never fire. No synthetic
`beforeinput` / `input` event can flip that internal flag either; it is set
only by genuine UA-driven editing.

This matches the maintainer's note on the issue thread (kuceb,
2018-06-14): *"this has nothing to do with bad simulated events … this should
be fixed by Native Events."* That conclusion is correct: the fix requires the
value mutation itself to originate from the user agent, not from a script.

> **Contrast — `contenteditable` already works.** For contenteditable elements
> Cypress inserts via `document.execCommand('insertText', …)`
> (`packages/driver/src/dom/selection.ts:86`), which the UA *does* count as a
> user edit. `execCommand('insertText')` is the only same-process API that flips
> the flag, but it does not apply to `<input>`/`<textarea>` reliably across
> browsers and input types, and would force a duplicate-event-suppression
> rewrite of the hot typing path. Hence the native-events route below.

[html-tooshort]: https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#suffering-from-being-too-short
[html-toolong]: https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#suffering-from-being-too-long

---

## 2. Why CDP/BiDi solves it (and the good news)

When key events are dispatched through the browser's automation protocol, the
resulting value mutation **is** a user edit from the UA's point of view:

- **Chromium / Electron:** `Input.dispatchKeyEvent` with a `text` field inserts
  the character into the focused editable element exactly as a keystroke would,
  setting the user-edit flag.
- **Firefox / WebKit:** WebDriver BiDi `input.performActions` with a `key`
  source produces the same UA-level edit.

**Cypress already ships this machinery.** The `cy.press()` command
(`packages/driver/src/cy/commands/actions/press.ts`) and its backing
`key:press` automation command
(`packages/server/lib/automation/commands/key_press.ts`) already drive both
protocols:

- `cdpKeyPress()` (`key_press.ts:46-97`) finds the AUT frame, focuses it if
  needed, then for each character dispatches `Input.dispatchKeyEvent`
  `keyDown`/`keyUp` with `{ key, code?, text? }` from `getKeyParams()`
  (`key_press.ts:19-44`).
- `bidiKeyPress()` (`key_press.ts:128-200`) does the equivalent through
  `client.inputPerformActions({ … actions: [{ type: 'key', … }] })`, with named
  keys remapped through `BidiOverrideCodepoints` (`key_press.ts:109-125`).

So native typing is largely **generalizing the already-shipped, already-tested
`key:press` path from "one supported key" to "a full keyboard sequence with
Cypress's existing key parsing,"** rather than green-field protocol work.

### 2.1 Existing automation bridge (reused as-is)

```
cy.type(...) [opt-in native path]
  └─ driver: Cypress.automation('key:type', { keys, … })      (cypress.ts:925-944)
       └─ socket 'automation:request'                          (socket-base.ts:294-303)
            └─ Automation.request → middleware.onRequest        (automation.ts:209-222)
                 └─ CdpAutomation.onRequest switch              (cdp_automation.ts:549-668)
                      case 'key:type' → cdpKeyType(send, …)     ← NEW handler
                 └─ (Firefox) BiDi middleware → bidiKeyType(…)  ← NEW handler
                 └─ (WebKit)  wkAutomation middleware → …       ← NEW handler
```

The driver↔server contract (`Cypress.automation(name, data)` →
`'automation:request'` socket event → `Automation.request` → per-browser
middleware `onRequest`) is unchanged. We add a new automation command name and
its three per-family handlers, mirroring `key:press`.

---

## 3. Goals / Non-goals

### Goals
1. Make `el.checkValidity()` / `el.validity.tooShort` / `el.validity.tooLong`
   reflect typed values for `<input>` / `<textarea>` — resolving #1930.
2. Reuse the existing `key:press` CDP/BiDi infrastructure; do not invent a new
   transport.
3. Ship behind an opt-in first (config flag and/or `cy.type(..., { … })`
   option), defaulting OFF, so the enormous existing simulated-typing test
   surface is unaffected until the native path is proven.
4. Preserve `cy.type()`'s public contract: special character sequences
   (`{enter}`, `{selectall}`, `{moveToEnd}`, `{backspace}`, `{del}`, etc.),
   `{ delay }`, `force`, actionability checks, and the emitted Command Log /
   `consoleProps`.

### Non-goals
- Rewriting the simulated path or removing it. It remains the default and the
  fallback for unsupported scenarios.
- Native typing into non-text inputs that don't support `minlength`/`maxlength`
  (`type=number|date|email|color|range|…`). These keep the existing
  special-cased simulated handling (`keyboard.ts:~798-832`).
- Changing `cy.press()`'s public surface.

---

## 4. Proposed Architecture

### 4.1 New automation command: `key:type`

Add a sibling to `key:press` rather than overloading it (`press` is a
single-key public command with its own validation/error paths).

**Server side — `packages/server/lib/automation/commands/key_type.ts`** (new):
- `cdpKeyType(keys, send, contexts, frameTree)` — focus the AUT frame (reuse the
  `AUT_FRAME_NAME_IDENTIFIER` lookup + `evaluateInFrameContext('window.focus()')`
  helpers already used by `cdpKeyPress`), then dispatch the parsed key sequence
  via `Input.dispatchKeyEvent`. For literal text runs, optionally use
  `Input.insertText` (faster, fires a single composition) where modifier
  fidelity isn't required; use per-key `keyDown`/`keyUp` where it is.
- `bidiKeyType(keys, client, autContext)` — one `inputPerformActions` `key`
  source containing the whole `keyDown`/`keyUp` action list (BiDi already
  supports batched actions; `key_press.ts:172-189` does this per char).
- WebKit handler via the existing `wkAutomation` middleware (WebKit support for
  `cy.press` is currently stubbed/blocked — see §7; native typing can stay
  unsupported on WebKit in phase 1 and fall back to simulated).

**Input contract (extend `@packages/types`):**
```ts
// packages/types/src/server.ts (near KeyPressParams:124-126)
export interface KeyTypeParams {
  keys: Array<NativeKeyDetail>   // normalized by the driver (see §4.2)
  // future: delay?, replace existing selection?, etc.
}
```
Register `key:type` in `AutomationCommands` so the driver gets the typed
`Cypress.automation('key:type', …)` call (same pattern `press.ts:53-58` uses
for `key:press`).

**Routing:** add `case 'key:type':` to `CdpAutomation.onRequest`
(`cdp_automation.ts`, alongside `'key:press'` at `:655-656`) and the
corresponding BiDi/WebKit middleware switches.

### 4.2 Driver side — where native typing branches in

The driver already owns all keyboard parsing and the event/selection model in
`packages/driver/src/cy/keyboard.ts`. The native path should **reuse the parse
and special-key planning** and swap only the *value-mutation + native-event
emission* step:

- `getKeymap()` / the tokenizer that turns `"abc{enter}"` into a `KeyDetails[]`
  sequence stays shared.
- For each `KeyDetails` chunk, instead of
  `performSimulatedDefault → replaceSelectionContents → setNativeProp` +
  `fireSimulatedEvent('input', …)` (`keyboard.ts:1328-1354`), the native path
  serializes the chunk to `NativeKeyDetail[]` and issues a single
  `Cypress.automation('key:type', { keys })`.
- Crucially, **the browser now emits the real `keydown`/`keypress`/`beforeinput`/
  `input`/`keyup` events itself.** Cypress must therefore *not* also fire its
  synthetic events for the native path, to avoid double events. This is the
  central correctness concern of the integration (see §6).

A focused entry point: add a strategy switch in `Keyboard.type()` (the method
that today loops over keys calling `simulatedKeydown`) selecting
`simulated` vs `native` based on config/options + capability detection (§5).

### 4.3 Capability detection & gating

Reuse the established pattern (`press.ts:41` gates on
`Cypress.browser.family`):
- `chromium` (Chrome, Edge, Electron) → CDP native typing.
- `firefox` → BiDi native typing.
- `webkit` → **not supported in phase 1**; silently fall back to simulated
  typing (no behavior change for WebKit users).

Native typing also requires the AUT to be focusable/visible — it cannot type
into a `force: true`-on-a-detached-element scenario the way the simulated path
can. When native preconditions aren't met, fall back to simulated and (in
phase 1) surface a `Cypress.log` note.

---

## 5. Rollout / Opt-in Strategy

Native input is observably different (real focus/scroll, real event ordering),
so a hard default-swap risks breaking existing suites. Phased:

1. **Phase 1 — experimental, opt-in.**
   `experimentalNativeTyping` config flag (default `false`), mirroring how other
   risky runner behaviors ship (`experimentalNativeEvents`-style naming). When
   on, `cy.type()` into text inputs/textarea uses `key:type`; everything else
   falls back to simulated. Document the #1930 fix as the headline benefit.
2. **Phase 2 — per-command override.**
   `cy.type('abc', { native: true | false })` so users can opt in/out per call
   regardless of the global flag.
3. **Phase 3 — evaluate default.**
   After burn-in across the internal system-tests matrix and dogfooding,
   consider flipping the default for Chromium/Firefox, keeping an escape hatch.

---

## 6. Key Risks & Mitigations

| # | Risk | Mitigation |
|---|------|-----------|
| 1 | **Double events** — browser fires real `keydown/keypress/beforeinput/input/keyup`; if the driver also fires synthetic ones, listeners see duplicates. | Native path must *fully delegate* events to the browser and skip `fireSimulatedEvent`. Add driver e2e asserting exactly one of each event per key. |
| 2 | **Lost actionability/`force` semantics.** Native typing requires a genuinely focused, visible element. | Run existing actionability checks first; if element can't truly receive focus, fall back to simulated (phase 1) and log. |
| 3 | **Special key fidelity** (`{selectall}`, `{moveToStart}`, `{ctrl}` combos, `{enter}` submit behavior) must match documented `cy.type()` behavior. | Reuse the existing key tokenizer/planner; map Cypress special tokens to native key sequences; cover each in the e2e parity suite (§8). |
| 4 | **Cross-frame focus / `cy.origin`.** Native dispatch targets the AUT frame; key_press already handles AUT-frame focus (`key_press.ts:55-69`) but cross-origin spec-bridge typing needs validation. | Explicitly test typing inside `cy.origin`; reuse `evaluateInFrameContext` frame targeting. |
| 5 | **Performance / `{ delay }`.** Per-key round-trips to the server are slower than in-process mutation. | Batch a whole `cy.type` call into one `key:type` automation request; honor `delay` server-side or by chunking; consider `Input.insertText` for literal runs. |
| 6 | **WebKit gap.** `cy.press` is blocked on WebKit today (`press.ts:41-50`). | Phase 1 keeps WebKit on simulated typing — no regression; native WebKit typing tracked as follow-up. |
| 7 | **IME / composition & non-BMP characters.** `cdpKeyPress` already splits multi-codepoint chars (`key_press.ts:75`). | Reuse that splitting; add emoji/CJK cases to the parity suite. |

---

## 7. Affected / New Files (implementation map)

**New**
- `packages/server/lib/automation/commands/key_type.ts` — `cdpKeyType` + `bidiKeyType` (model on `key_press.ts`).
- `packages/driver/cypress/e2e/commands/actions/type_native.cy.ts` — native-path e2e + #1930 regression + parity suite.

**Modified**
- `packages/types/src/server.ts` — add `KeyTypeParams` and `key:type` to `AutomationCommands` (next to `KeyPressParams:124-126`).
- `packages/server/lib/browsers/cdp_automation.ts` — add `case 'key:type'` to `onRequest` (next to `'key:press'` at `:655-656`).
- Firefox BiDi middleware + WebKit (`wkAutomation`) middleware — add `key:type` routing (mirror their `key:press` wiring).
- `packages/driver/src/cy/keyboard.ts` — strategy switch (`simulated` vs `native`) in the type loop; serialize `KeyDetails[]` → `NativeKeyDetail[]`; suppress synthetic events on the native path.
- `packages/driver/src/cy/commands/actions/type.ts` — thread the `native` per-command option; capability gating + fallback + Command Log note.
- `packages/config/...` — register `experimentalNativeTyping` (definition, validation, defaults) following the existing experimental-flag pattern.
- `cli/types/...` + docs — public types for the new option/flag.

---

## 8. Test Strategy / Verification

1. **#1930 regression e2e** (the acceptance test):
   ```ts
   // input with minlength=5
   cy.get('#short').type('abc')
   cy.get('#short').then(($el) => {
     expect($el[0].validity.tooShort).to.be.true
     expect($el[0].checkValidity()).to.be.false
   })
   // and maxlength truncation / tooLong parity
   ```
   Run with the native flag ON (must pass) and confirm the simulated path still
   fails it (documents the boundary).
2. **Event-parity suite** — assert real event order/count (`keydown`,
   `keypress`, `beforeinput`, `input`, `keyup`) with no duplicates (Risk #1).
3. **Special-key parity** — port a representative slice of
   `packages/driver/cypress/e2e/commands/actions/type.cy.ts` to run under the
   native flag: `{enter}` submit, `{selectall}{del}`, `{moveToStart}`, modifier
   combos, multi-line textarea, emoji/CJK.
4. **Cross-browser matrix** — Chromium + Electron (CDP) and Firefox (BiDi) in
   CI; WebKit asserts graceful fallback to simulated.
5. **`cy.origin`** typing smoke test.
6. **Unit** — `key_type.ts` parsing/dispatch (mock `send`), mirroring
   `packages/server/test/unit/automation/commands/key_press.spec.ts`.

**Done = a staff engineer would approve:** #1930 acceptance test green on the
native path across Chromium + Firefox; zero duplicate events; full special-key
parity suite green; simulated path and all existing `type.cy.ts` tests
unchanged with the flag off.

---

## 9. Open Questions

1. **Flag name & scope** — `experimentalNativeTyping`, or fold into a broader
   `experimentalNativeEvents` umbrella that also covers click/hover later?
2. **`Input.insertText` vs per-key dispatch** — insertText is faster and still
   counts as a user edit; do we need per-key `keyDown`/`keyUp` fidelity for the
   default literal-text case, or only when modifiers/special keys are involved?
3. **`{ delay }` semantics** — preserve exact per-key delay (server-side
   pacing) or document a behavior change under native typing?
4. **WebKit** — acceptable to ship phase 1 with WebKit on simulated fallback
   (so #1930 stays unfixed on WebKit), or block the feature until WebKit parity?
5. **Default flip criteria** — what dogfooding/system-test signal gates Phase 3?

---

## 10. Recommendation

Proceed with **Phase 1: an opt-in `key:type` automation command that reuses the
shipped `cy.press()` CDP/BiDi machinery**, gated behind an experimental flag and
defaulting to simulated typing. This directly resolves #1930 for Chromium and
Firefox with bounded, well-isolated risk, and lays the groundwork for broader
native-events support without disturbing the existing simulated-typing test
surface.
