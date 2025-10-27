# Visibility Test Migration Guide

This document outlines the comprehensive matrix of visibility test situations covered in the `hidden/visible overrides` section of `visibility.cy.ts` and tracks their migration status to the declarative format.

### Migration Status Legend
- ✅ **Migrated** - Covered in declarative HTML fixtures (`visibility scenarios` section)
- ❌ **Not Migrated** - Still in imperative test cases (`hidden/visible overrides` section)
- 🔄 **Partially Migrated** - Some scenarios covered, others remain imperative due to technical constraints

## CSS Properties Matrix

| **Element State** | **Parent State** | **Visibility** | **Display** | **Opacity** | **Expected Result** | **Status** |
|-------------------|------------------|----------------|-------------|-------------|---------------------|------------|
| Applied to element | - | `hidden` | - | - | Hidden | ✅ |
| - | Applied to parent | `hidden` | - | - | Child hidden | ✅ |
| Applied to `<td>` | - | `collapse` | - | - | Hidden | ✅ |
| Applied to `<tr>` | - | `collapse` | - | - | Hidden | ✅ |
| - | Applied to parent | `collapse` | - | - | Child hidden | ✅ |
| `input type="hidden"` | - | - | - | - | Hidden | ✅ |
| Applied to element | - | - | `none` | - | Hidden | ✅ |
| - | Applied to parent | - | `none` | - | Child hidden | ✅ |
| - | Parent has inline | - | `inline` | - | Child with `display: block` visible | ❌ |
| Applied to element | - | - | - | `0` | Hidden | ✅ |
| - | Applied to parent | - | - | `0` | Child hidden | ✅ |
| Applied to element | - | - | - | `0.5` | Visible | ✅ |

## Dimensions Matrix

| **Width** | **Height** | **Content** | **Visibility** | **Display** | **Opacity** | **Expected Result** | **Status** |
|-----------|------------|-------------|----------------|-------------|-------------|---------------------|------------|
| 0 | 100px | Text content | - | - | - | Visible | ✅ |
| 50px | 0 | Text content | - | - | - | Visible | ✅ |
| 0 | 50px | Whitespace only | - | - | - | Hidden | ✅ |
| 0 | 100px | No content | - | - | - | Hidden | ✅ |
| 50px | 0 | No content | - | - | - | Hidden | ✅ |
| 0 | 100px | - | - | - | - | Child hidden (overflow: hidden) | ✅ |
| 100px | 0 | - | - | - | - | Child hidden (overflow: hidden) | ✅ |
| 0 | 100px | - | - | - | - | Descendant hidden (overflow: hidden) | ✅ |
| 100px | 0 | - | - | - | - | Descendant hidden (overflow: hidden) | ✅ |
| 100px | 100px | - | - | - | - | Child visible (overflow: hidden) | ✅ |
| 0 | 0 | - | - | - | - | Child hidden (overflow: auto) | ✅ |

## Positioning Matrix

| **Element Position** | **Parent Position** | **Parent Dimensions** | **Visibility** | **Display** | **Opacity** | **Expected Result** | **Status** |
|---------------------|---------------------|----------------------|----------------|-------------|-------------|---------------------|------------|
| `absolute` | - | Zero width | - | - | - | Element visible | ✅ |
| `absolute` | - | Zero width ancestor | - | - | - | Element visible | ✅ |
| Static | `absolute` | Zero width | - | - | - | Element hidden | ✅ |
| `fixed` | - | Normal | - | - | - | Element visible | ✅ |
| `fixed` | - | Normal ancestor | - | - | - | Element visible | ✅ |
| `fixed` | - | Normal | Covered by another | - | - | Element hidden | ✅ |
| `fixed` | - | Normal | Off-screen | - | - | Element hidden | ✅ |
| `fixed` + `pointer-events: none` | - | Normal | - | - | - | Element visible | ✅ |
| `fixed` | `pointer-events: none` | Normal | - | - | - | Element visible | ✅ |
| `fixed` | `pointer-events: none` | Normal | Covered by another | - | - | Element hidden | ✅ |
| `sticky` | - | Normal | - | - | - | Element visible | ✅ |

## Form Elements Matrix

| **Element Type** | **Parent State** | **Element State** | **Visibility** | **Display** | **Opacity** | **Expected Result** | **Status** |
|------------------|------------------|-------------------|----------------|-------------|-------------|---------------------|------------|
| `<option>` | Visible `<select>` | Default | - | - | - | Visible | ✅ |
| `<optgroup>` | Visible `<select>` | Default | - | - | - | Visible | ✅ |
| `<option>` | Hidden `<select>` | Default | - | - | - | Hidden | ✅ |
| `<option>` | Visible `<select>` | - | - | `none` | - | Hidden | ✅ |
| `<option>` | Outside `<select>` | Default | - | - | - | Follows regular logic | ✅ |

## Overflow Clipping Matrix

| **Overflow Type** | **Element Position** | **Element Location** | **Visibility** | **Display** | **Opacity** | **Expected Result** | **Status** |
|-------------------|---------------------|---------------------|----------------|-------------|-------------|---------------------|------------|
| `overflow: hidden` | Static | Out of bounds left | - | - | - | Hidden | ✅ |
| `overflow: hidden` | Static | Out of bounds right | - | - | - | Hidden | ✅ |
| `overflow: hidden` | Static | Out of bounds above | - | - | - | Hidden | ✅ |
| `overflow: hidden` | Static | Out of bounds below | - | - | - | Hidden | ✅ |
| `overflow-y: hidden` | Static | Out of bounds vertically | - | - | - | Hidden | ✅ |
| `overflow-x: hidden` | Static | Out of bounds horizontally | - | - | - | Hidden | ✅ |
| `overflow: hidden` | Static | In bounds | - | - | - | Visible | ✅ |
| `overflow: auto` | Static | Out of ancestor bounds | - | - | - | Hidden | ✅ |
| `overflow: scroll` | Static | Out of parent bounds | - | - | - | Hidden | ✅ |
| `overflow: hidden` | `absolute` | In bounds | - | - | - | Visible | ✅ |
| `overflow: hidden` | `absolute` | Out of bounds | - | - | - | Hidden | ✅ |
| `overflow: hidden` | `relative` | Out of ancestor bounds | - | - | - | Hidden | ✅ |
| `overflow: visible` | `relative` | Out of ancestor bounds | - | - | - | Visible | ✅ |
| `overflow: hidden` | Flex container | Out of bounds | - | - | - | Hidden | ✅ |

## Transform Matrix

| **Transform Type** | **Scale Value** | **Element Location** | **Visibility** | **Display** | **Opacity** | **Expected Result** | **Status** |
|-------------------|-----------------|---------------------|----------------|-------------|-------------|---------------------|------------|
| `transform: scale()` | `(0,0)` | Self | - | - | - | Hidden | ✅ |
| `transform: scale()` | `(1,1)` | Self | - | - | - | Visible | ✅ |
| `transform: scale()` | `(0,0)` | Outside parent | - | - | - | Hidden | ✅ |
| `transform: scale()` | `(1,1)` | Inside parent | - | - | - | Visible | ✅ |
| `transform: scaleX()` | `0` | Self | - | - | - | Hidden | ✅ |
| `transform: scaleY()` | `0` | Self | - | - | - | Hidden | ✅ |
| `transform: scaleZ()` | `0` | Self | - | - | - | Hidden | ✅ |
| `transform: rotateX()` | `90deg` | Self | - | - | - | Hidden | ✅ |
| `transform: rotateY()` | `90deg` | Self | - | - | - | Hidden | ✅ |
| `transform: rotateZ()` | `90deg` | Self | - | - | - | Visible | ✅ |
| `transform: rotateX() rotateY()` | `90deg, 90deg` | Self | - | - | - | Hidden | ✅ |
| `transform: translateX()` | Negative offset | Out of ancestor bounds | - | - | - | Hidden | ✅ |
| `transform: translateX()` | Negative offset | In ancestor bounds | - | - | - | Visible | ✅ |
| `transform: skew()` | Any value | Self | - | - | - | Visible | ✅ |
| `transform: rotate()` | Any value | Self | - | - | - | Visible | ✅ |
| Multiple transforms | With scale(0,0) | Self | - | - | - | Hidden | ✅ |
| Multiple transforms | With 90° rotation | Self | - | - | - | Hidden | ✅ |
| Transform + text content | Any value | Self | - | - | - | Visible | ✅ |
| Transform + zero dimensions | Any value | Self | - | - | - | Visible (with text) | ✅ |
| Transform + overflow | Any value | Self | - | - | - | Hidden | ✅ |
| `backface-visibility: hidden` | `rotateX(180deg)` | Self | - | - | - | Hidden | ✅ |
| `backface-visibility: hidden` | `rotateY(180deg)` | Self | - | - | - | Hidden | ✅ |
| `backface-visibility: hidden` | `rotateZ(180deg)` | Self | - | - | - | Visible | ✅ |
| `backface-visibility: hidden` | `rotate3d(180deg)` | Self | - | - | - | Hidden | ✅ |
| `backface-visibility: visible` | `rotateX(180deg)` | Self | - | - | - | Visible | ✅ |
| `backface-visibility: hidden` + `preserve-3d` | `rotateY(45deg)` | Self | - | - | - | Visible | ✅ |

## Clip-Path Matrix

| **Clip-Path Type** | **Element Location** | **Mode** | **Visibility** | **Display** | **Opacity** | **Expected Result** | **Status** |
|-------------------|---------------------|----------|----------------|-------------|-------------|---------------------|------------|
| `clip-path: polygon(0 0, 0 0, 0 0, 0 0)` | Outside path | Fast only | - | - | - | Hidden | ✅ |
| `clip-path: circle(100%)` | Inside path | Fast only | - | - | - | Visible | ✅ |
| `clip-path: inset(25% 25% 25% 25%)` | Outside path | Fast only | - | - | - | Hidden | ✅ |
| `clip-path: polygon(0% 0%, 100% 0%, 50% 100%)` | Inside path | Fast only | - | - | - | Visible | ✅ |
| `clip-path: ellipse(50% 50% at 50% 50%)` | Inside path | Fast only | - | - | - | Visible | ✅ |
| `clip-path: path('M 0 0 L 100 0 L 100 100 L 0 100 Z')` | Inside path | Fast only | - | - | - | Visible | ✅ |

## Special Cases Matrix

| **Category** | **Element** | **State** | **Visibility** | **Display** | **Opacity** | **Expected Result** | **Status** |
|--------------|-------------|-----------|----------------|-------------|-------------|---------------------|------------|
| HTML/Body | `<html>` | Default | - | - | - | Always visible | ✅ |
| HTML/Body | `<body>` | Default | - | - | - | Always visible | ✅ |
| HTML/Body | `<html>` | - | - | `none` | - | Still visible | ✅ |
| HTML/Body | `<body>` | - | - | `none` | - | Still visible | ✅ |
| Detached | Any element | Not in DOM | - | - | - | Hidden | ❌ |
| Backface | Any element | `backface-visibility: hidden` + `rotateX(180deg)` | - | - | - | Hidden | ✅ |
| Scroll | Any element | Requires scroll to be visible | - | - | - | Hidden (with scroll suggestion) | ✅ |

## Migration Summary

### ✅ **Fully Migrated Categories:**
- **Basic CSS Properties** - All visibility, display, opacity, and table collapse scenarios
- **Dimensions** - All dimensional scenarios including text content edge cases
- **Positioning** - All positioning scenarios (absolute, fixed, sticky)
- **Form Elements** - All form element scenarios including options outside select
- **Display Inline/Block Interactions** - Parent inline with child block
- **Overflow Clipping** - All overflow scenarios (hidden, auto, scroll, directional overflow)
- **Transform Effects** - All transform scenarios including scale, rotation, translation, skew, backface-visibility
- **Clip-Path** - All CSS clip-path scenarios (polygon, circle, inset, ellipse, path)
- **Special Cases** - HTML/body elements and scroll requirements (migrated to declarative format)

### 🔄 **Partially Migrated Categories:**
- None - All testable scenarios have been migrated

### ❌ **Not Yet Migrated Categories:**
- **Detached Elements** - Elements not in DOM (cannot be migrated due to technical constraints)

## Migration Notes

### Declarative Test Structure

The visibility tests have been migrated from imperative test cases to declarative HTML fixtures:

- **`basic-css-properties.html`** - Tests CSS visibility, display, and opacity properties ✅
- **`overflow.html`** - Tests dimensional scenarios, overflow clipping, and clip-path scenarios ✅
- **`positioning.html`** - Tests positioning scenarios (absolute, fixed, sticky) ✅
- **`form-elements.html`** - Tests form element visibility (select, option, optgroup) ✅
- **`transforms.html`** - Tests CSS transform effects including scale, rotation, translation, skew, and backface-visibility ✅

### Test Case Attributes

Each test case uses these attributes:
- `cy-expect="visible"` or `cy-expect="hidden"` - Expected visibility state
- `cy-fast-expect` / `cy-legacy-expect` - Mode-specific expectations when they differ
- `cy-label` - Descriptive label for test case identification
- `cy-section` - Groups related test cases together

### Mode Differences

Some test cases behave differently between fast and legacy visibility modes:
- Zero dimensions with overflow auto
- Positioning with zero dimensions
- Clip-path scenarios (fast mode only - legacy mode does not support clip-path)

### Coverage Completeness

This matrix ensures comprehensive coverage of:
- All CSS properties that affect visibility
- Dimensional edge cases with text content
- Positioning scenarios and their interactions
- Overflow clipping in various contexts
- Transform effects on visibility
- Form element special cases
- Browser-specific behaviors and edge cases
