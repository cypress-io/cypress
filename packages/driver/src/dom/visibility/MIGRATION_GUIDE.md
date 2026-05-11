# Fast Visibility Algorithm Migration Guide

## Overview

The experimental fast visibility algorithm (`experimentalFastVisibility: true`) replaces Cypress's bespoke ancestor-walking visibility detection with a direct delegation to the browser's native [`Element.checkVisibility()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/checkVisibility) API, plus a small zero-dimension guard.

This guide explains the behavioral differences between the legacy and fast algorithms and how to update tests when migrating.

## Why migrate?

Cypress runs its visibility algorithm not only when you assert `should('be.visible')` but also as part of every actionability check (`cy.click()`, `cy.type()`, etc.). The legacy algorithm walks the DOM tree, computing styles and bounding rects up the chain of ancestors — for complex pages this can dominate test runtime.

The fast algorithm hands the question off to the browser, which already has the correctly cached layout and style information. In addition:

- It is **significantly faster** on complex DOM structures.
- It works correctly across **Shadow DOM and slot boundaries** because the browser walks the flat tree natively.
- It treats `display: contents`, `content-visibility`, `<details>`, `<template>`, and similar modern primitives the way the spec describes them.

## What the fast algorithm checks

Given an element `el`, the fast algorithm reports it hidden if **any** of the following are true:

1. The element is not `<body>` / `<html>` (those are always visible) and …
2. … `el.checkVisibility({ contentVisibilityAuto: true, opacityProperty: true, visibilityProperty: true })` returns `false` — i.e. the element (or any flat-tree ancestor) has `display: none`, `display: contents`, `visibility: hidden`/`collapse`, `opacity: 0`, `content-visibility: hidden`, or `content-visibility: auto` with rendering currently skipped.
3. … or its `getBoundingClientRect()` reports `width <= 0` or `height <= 0` (the zero-dimension guard).

`<option>` and `<optgroup>` elements have no layout box of their own; they defer to their parent `<select>`.

When `checkOpacity: false` is passed (used internally during actionability), the `opacityProperty` check is disabled so that `opacity: 0` elements remain "visible" enough to be clicked.

## Browser support

`Element.checkVisibility()` is implemented in:

- Chrome / Edge 105+
- Firefox 106+
- Safari / WebKit 17.4+

Cypress's published browser-support policy ("latest 3 major versions of Chrome, Firefox, Edge") and the bundled Electron (Chromium 138) all comfortably exceed these floors.

## Behavioral differences vs. the legacy algorithm

Because the fast algorithm asks the browser instead of walking the DOM itself, several scenarios that legacy *did* (or *did not*) catch behave differently:

| Scenario | Legacy says | Fast says | Notes |
|---|---|---|---|
| `display: none` (any ancestor) | hidden | hidden | Both agree. |
| `visibility: hidden` / `collapse` (any ancestor) | hidden | hidden | Both agree. |
| `opacity: 0` (any ancestor) | hidden | hidden | Both agree. With `checkOpacity: false`, both treat as visible. |
| `display: contents` | visible | **hidden** | The element has no layout box per spec. |
| `content-visibility: hidden` / skipped `auto` | visible | **hidden** | Native browser support. |
| Closed `<details>` descendant | hidden | hidden | Both agree. |
| Element inside `<template>` | hidden | hidden | Both agree. |
| Element with `width: 0` or `height: 0` | hidden | hidden | Fast preserves this via the dimension guard. |
| Element inside Shadow DOM with hidden host | hidden | hidden | Fast walks the flat tree natively (legacy required custom logic). |
| Slotted light-DOM child of a hidden host | hidden | hidden | Native flat-tree handling. |
| Element clipped out of an `overflow: hidden` ancestor | hidden | **visible** | Fast does not check overflow clipping. |
| Element scrolled off-screen in a scroll container | hidden | **visible** | Fast does not check scroll containers. |
| Element positioned outside the viewport | visible | visible | Both agree (legacy didn't check this either). |
| Element with `transform: translate(-9999px, 0)` | visible | visible | Both agree. |
| Element covered by a higher-z-index sibling | visible | visible | Fast does not detect occlusion. |
| Element clipped by `clip-path` / `clip` | visible | visible | Fast does not detect CSS clipping. |
| Element with `pointer-events: none` | visible | visible | Both agree. |

## When NOT to enable fast visibility

Stay on the legacy algorithm if your tests rely on Cypress detecting any of the following as **hidden**:

- Elements clipped out of an `overflow: hidden`/`auto`/`scroll` ancestor.
- Elements scrolled outside a scroll container.
- Elements covered by another element (z-index occlusion).
- Elements clipped via `clip-path` or `clip: rect(...)`.

The fast algorithm intentionally does not implement these checks; it trusts the browser's native definition of CSS visibility. If you depend on these behaviors, asserting on the *cause* (the covering element, the scroll container) instead of the covered element is usually a more reliable test pattern.

## Migration steps

### 1. Enable fast visibility

```javascript
// cypress.config.js
module.exports = {
  experimentalFastVisibility: true,
}
```

### 2. Run your test suite and analyze failures

Most failures will fall into one of three buckets:

1. **The new behavior is more correct.** Update the assertion. Example: `should('be.visible')` on a `display: contents` element should be `should('be.hidden')`.
2. **The new behavior is incompatible with what you intended to test.** Either narrow the assertion to the underlying cause (e.g. assert on the covering element instead of the covered one) or scope `experimentalFastVisibility: false` to that suite.
3. **There is a bug in the application.** Fix the application, not the test.

### 3. Scope the flag where needed

You can opt individual specs in or out:

```javascript
describe('legacy-only suite', { experimentalFastVisibility: false }, () => {
  // ...
})
```

## Common compatibility issues

### Element clipped by an `overflow: hidden` ancestor

```javascript
// Before — relied on legacy's overflow-walking
cy.get('.scrolled-off').should('be.hidden')

// After — assert on the visible state instead, e.g. by scrolling
cy.get('.scrolled-off').scrollIntoView().should('be.visible')
```

### Element covered by another element

```javascript
// Before — relied on legacy's overlap heuristic (which was inconsistent)
cy.get('.behind-modal').should('be.hidden')

// After — test the user-facing cause
cy.get('.modal').should('be.visible')
```

### `display: contents` element

```javascript
// Before — legacy reported visible
cy.get('.contents-wrapper').should('be.visible')

// After — element has no layout box; assert on a real child instead
cy.get('.contents-wrapper > .real-child').should('be.visible')
```

## Shadow DOM

Shadow DOM is supported by the fast algorithm out of the box. `checkVisibility()` walks the flat tree, so:

- A light-DOM child slotted into an open shadow root inherits visibility from the host.
- A `display: none` ancestor outside the shadow root hides descendants inside it.
- Named slots, default slots, and manually-assigned slots (`slot.assign(...)`) all participate in visibility correctly.

If you encounter a Shadow DOM scenario that the fast algorithm seems to mis-classify, please open an issue with a reproduction.

## Debugging visibility issues

```javascript
cy.get('.element').then(($el) => {
  console.log('Cypress.dom.isVisible:', Cypress.dom.isVisible($el[0]))
  console.log('checkVisibility (no opts):', $el[0].checkVisibility())
  console.log('checkVisibility (cypress opts):', $el[0].checkVisibility({
    contentVisibilityAuto: true,
    opacityProperty: true,
    visibilityProperty: true,
  }))
  console.log('rect:', $el[0].getBoundingClientRect())
})
```

## Final words

The fast algorithm is intentionally simpler than legacy: it asks the browser instead of re-implementing visibility logic. That trades some legacy-specific heuristics (overflow clipping, occlusion) for spec-aligned correctness, native Shadow DOM support, and significant performance gains. As an experimental flag we may continue to refine which heuristics land on top of `checkVisibility()`; if you encounter a case that surprises you, please open an issue.
