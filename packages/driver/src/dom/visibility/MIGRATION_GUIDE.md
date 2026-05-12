# Fast Visibility Algorithm Migration Guide

## Overview

The experimental fast visibility algorithm (`experimentalFastVisibility: true`) replaces Cypress's bespoke ancestor-walking visibility detection with a direct delegation to the browser's native [`Element.checkVisibility()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/checkVisibility), plus a zero-dimension guard.

This guide describes the algorithm and how its verdicts differ from the legacy algorithm.

## Why migrate?

Cypress runs its visibility algorithm not only for `should('be.visible')` assertions but also during every actionability check (`cy.click()`, `cy.type()`, etc.). The legacy algorithm walks the DOM tree, computing styles and bounding rects up the ancestor chain — for complex pages this can dominate test runtime.

The fast algorithm hands the question off to the browser, which already has the correctly cached layout and style information. In addition:

- It is significantly faster on complex DOM structures.
- It works correctly across **Shadow DOM and slot boundaries** because the browser walks the flat tree natively.
- It treats `display: contents`, `content-visibility`, `<details>`, `<template>`, and similar modern primitives the way the spec describes them.

## What the fast algorithm checks

Given an element `el`, the algorithm reports it hidden if any of the following are true:

1. `el` is not `<body>` / `<html>` (those are always visible) and …
2. … `el.checkVisibility({ contentVisibilityAuto: true, opacityProperty: true, visibilityProperty: true })` returns `false` — i.e. the element (or any flat-tree ancestor) has `display: none`, `display: contents`, `visibility: hidden`/`collapse`, `opacity: 0`, `content-visibility: hidden`, or `content-visibility: auto` with rendering currently skipped.
3. … or its `getBoundingClientRect()` reports `width <= 0` **or** `height <= 0` (the zero-dimension guard).

`<option>` and `<optgroup>` have no layout box of their own; they defer to their parent `<select>`.

When `checkOpacity: false` is passed (used internally during actionability), the `opacityProperty` check is disabled so `opacity: 0` elements remain "visible" enough to be clicked.

## Browser support

`Element.checkVisibility()` is implemented in:

- Chrome / Edge 105+
- Firefox 106+
- Safari / WebKit 17.4+

Cypress's published browser-support policy ("latest 3 major versions of Chrome, Firefox, Edge") and the bundled Electron (Chromium 138+) all comfortably exceed these floors.

## Behavioral differences vs. the legacy algorithm

Both algorithms agree in the common cases (`display: none`, `visibility: hidden/collapse`, `opacity: 0` on the element or any ancestor, closed `<details>`, elements inside `<template>`, elements with `width: 0; height: 0` and no overflowing content). The cases below diverge.

### Fast considers visible, legacy considers hidden

The legacy algorithm walks ancestors looking for clipping and overlap; the fast algorithm relies on the browser's CSS-level visibility check and does not.

| Scenario | Notes |
|---|---|
| Element clipped out of an ancestor `overflow: hidden`/`auto`/`scroll` | Fast does not walk ancestor overflow. |
| Element scrolled outside a scrollable container | Same. |
| Element covered by a sibling with `position: fixed` (legacy-only overlap detection) | Legacy detects this specific case via fixed-position overlap heuristics; fast does not. |
| `backface-visibility: hidden` + 180° rotation | Legacy's point sampling treated the back face as hidden. |
| `transform: scaleZ(0)` | Legacy point-samples through the rotated element; fast trusts `checkVisibility()`. |
| Inner content of a zero-dimension `overflow: hidden` ancestor | Legacy detects ancestor clipping; fast only checks the element's own dims. |

Both algorithms agree that elements covered by a higher-z-index sibling, elements clipped by `clip-path` or `clip: rect(...)`, elements positioned outside the viewport by `transform: translate(...)`, and elements with `pointer-events: none` are **visible** — legacy never reliably detected those either, and the fixtures previously claiming otherwise have been corrected.

### Fast considers hidden, legacy considers visible

| Scenario | Notes |
|---|---|
| `display: contents` element | No own layout box per spec; `checkVisibility()` returns false. |
| `content-visibility: hidden`, or `content-visibility: auto` currently skipping rendering | Native browser support via `contentVisibilityAuto: true`. |
| Element whose own `getBoundingClientRect()` reports `width <= 0` or `height <= 0`, even when text content overflows visibly | Legacy treated `width: 0; height: 100px` with text as visible because the text painted outside the box; fast's dimension guard fires on either axis. |

### Shadow DOM and slots

`checkVisibility()` walks the flat tree, so the fast algorithm naturally handles cases legacy needed custom logic for (or didn't handle at all):

- A light-DOM child slotted into a `<slot>` with `display: none` reports hidden under fast; legacy walks DOM parents and never sees the slot, so it reports visible.
- A light-DOM child with no matching slot reports hidden under fast (no flat-tree position); legacy reports visible.
- Manually-assigned slots (`attachShadow({ slotAssignment: 'manual' })` + `slot.assign(...)`) participate in fast's verdict; legacy does not differentiate assigned vs unassigned light children.

## Migrating existing tests

### A test asserts hidden on a clipped / overlapped / scrolled-out element

Update the assertion to match the cause the user actually experiences. For example, if a modal covers the element, assert on the modal instead:

```javascript
// Legacy: relied on ancestor-overflow walking
cy.get('.behind-modal').should('be.hidden')

// New: assert the user-visible cause
cy.get('.modal').should('be.visible')
```

For elements scrolled outside their container, scroll first:

```javascript
cy.get('.scrolled-off').scrollIntoView().should('be.visible')
```

### A test asserts visible on a `display: contents` element

`display: contents` elements have no layout box. Target a real child instead:

```javascript
cy.get('.contents-wrapper > .real-child').should('be.visible')
```

### A test asserts visible on a zero-dimension element with overflowing text

Style the element so it has the dimensions you intend to test, or assert on the overflowing child:

```javascript
cy.get('.overflowing-text > span').should('be.visible')
```

## Debugging

```javascript
cy.get('.element').then(($el) => {
  // eslint-disable-next-line no-console
  console.log('isVisible:', Cypress.dom.isVisible($el[0]))
  // eslint-disable-next-line no-console
  console.log('checkVisibility:', $el[0].checkVisibility({
    contentVisibilityAuto: true,
    opacityProperty: true,
    visibilityProperty: true,
  }))
  // eslint-disable-next-line no-console
  console.log('rect:', $el[0].getBoundingClientRect())
})
```

## Test fixtures

The driver's [visibility fixtures](../../../cypress/fixtures/visibility/) annotate each test case with either `cy-expect="visible|hidden"` (both algorithms agree) or both `cy-legacy-expect` and `cy-fast-expect` (they disagree). [`visibility.cy.ts`](../../../cypress/e2e/dom/visibility.cy.ts) and [`visibility_shadow_dom.cy.ts`](../../../cypress/e2e/dom/visibility_shadow_dom.cy.ts) exercise the fixtures and inline scenarios under both modes; the per-mode divergences in those specs are the canonical reference.
