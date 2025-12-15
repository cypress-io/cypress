# Fast Visibility Algorithm Migration Guide

## Overview

This is an in-depth record of the differences between the experimental "fast" visibility algorithm, compared with the legacy algorithm.

The fast visibility algorithm is designed to resolve severe performance issues with DOM visibility detection while maintaining compatibility with existing test code. This guide helps you understand the differences between legacy and fast algorithms and provides solutions for any compatibility issues that arise.

## Why Migrate?

### Performance Benefits

Even if you are not regularly asserting on the visibility of elements, Cypress inherently uses the active visibility algorithm to determine _actionability_, as well. That means every time you `cy.click()` on an element, Cypress runs this visibility algorithm under the hood.

- **Significantly faster** visibility calculations for complex DOM structures
- **Reduced CPU usage** during test execution
- **Better scalability** for applications with many DOM elements
- **Improved test reliability** with more accurate geometric visibility detection

### When to Enable Fast Visibility
Enable fast visibility if you experience:
- Slow test execution with complex DOM structures
- High CPU usage during visibility checks
- Timeouts or flaky tests related to element visibility
- Performance degradation with many DOM elements

### When NOT to Enable Fast Visibility
**Do NOT enable fast visibility if:**
- Your tests rely heavily on Shadow DOM elements
- You have comprehensive Shadow DOM test coverage
- Your application uses Shadow DOM extensively
- You rely extensively on asserting the visibility of elements that are outside the browser's viewport
- You rely on asserting the visibility state of elements that have `pointer-events:none`

**Current Limitations**:
- The fast visibility algorithm does not yet fully support Shadow DOM elements. Tests that interact with Shadow DOM elements may fail or behave incorrectly.
- The fast visibility algorithm considers any element that is outside of the browser's viewport as hidden. While this is an incompatibility with the legacy visibility approach, it is aligned with the visibility behavior of elements that are scrolled out of view within a scrollable container.

## Algorithm Differences

While comprehensive, this list may not be complete. Additional discrepancies may be found and added to our test cases as they become known.

| Test Section and Fixture | Test Case Label | "Legacy" Considers Visible? | "Fast" Considers Visible? | Correct Behavior | Notes |
|---------|----------------|---------------------------|------------------------|------------------|-------|
| **[transforms](../../../cypress/fixtures/visibility/transforms.html)** | Perspective with rotateY | ✅ Yes | ❌ No | ✅  Yes | Certain transforms can cause elements to not be considered visible to the fast visibility algorithm if they transform an element in such a way that it is not present at the points that are sampled |
| **[positioning-with-zero-dimensions](../../../cypress/fixtures/visibility/positioning.html)** | Zero dimensions parent with absolute positioned child | ✅ Yes | ❌ No | ❌ No | Element that has `width: 0; height: 0` and an absolutely positioned child  |
| **[fixed-positioning-with-zero-dimensions](../../../cypress/fixtures/visibility/positioning.html)** | Zero dimensions ancestor with fixed positioned child | ✅ Yes | ❌ No | ❌ No | Element that has `width: 0; height: 0; position: relative` and a fixed positioned grand-child. |
| **[fixed-positioning-with-zero-dimensions](../../../cypress/fixtures/visibility/positioning.html)** | Parent under zero dimensions ancestor | ✅ Yes | ❌ No | ❌ No | Statically positioned element that is a child of an element with zero dimension, and whose only child is position:fixed |
| **[position-absolute-scenarios](../../../cypress/fixtures/visibility/positioning.html)** | Normal parent with absolute positioned child | ❌ No | ✅ Yes | ❌ No | Element that is hidden by its parents overflow, but has an absolutely positioned child element. |
| **[position-absolute-scenarios](../../../cypress/fixtures/visibility/positioning.html)** | Parent container for absolute child | ❌ No | ✅ Yes | ❌ No | Container element for the absolute positioned child  |
| **[position-absolute-scenarios](../../../cypress/fixtures/visibility/positioning.html)** | Normal ancestor with absolute positioned descendant | ❌ No | ✅ Yes | ✅ Yes | Ancestor has `width: 0; height: 100px; overflow: hidden` with absolute positioned descendant |
| **[positioning](../../../cypress/fixtures/visibility/positioning.html)** | Covered by an absolutely positioned cousin | ✅ Yes | ❌ No | ❌ No | Element covered by a sibling with `position: absolute` and higher z-index |
| **[overflow-auto-with-zero-dimensions](../../../cypress/fixtures/visibility/overflow.html)** | Zero dimensions with overflow auto | ✅ Yes | ❌ No | ❌ No | Element with `width: 0; height: 0px; overflow: auto`, but no absolutely positioned children |
| **[overflow-scroll-scenarios](../../../cypress/fixtures/visibility/overflow.html)** | Parent with clip-path polygon that clips everything | ✅ Yes | ❌ No | ❌ No | `clip-path: polygon(0 0, 0 0, 0 0, 0 0)`  |
| **[overflow-scroll-scenarios](../../../cypress/fixtures/visibility/overflow.html)** | Element outside clip-path polygon | ✅ Yes | ❌ No | ❌ No | Child element of polygon clip-path parent |
| **[overflow-scroll-scenarios](../../../cypress/fixtures/visibility/overflow.html)** | Element outside clip-path inset | ✅ Yes | ❌ No | ❌ No | Child element of `clip-path: inset(25% 25% 25% 25%)` |
| **[viewport-scenarios](../../../cypress/fixtures/visibility/overflow.html)** | Absolutely positioned element outside of the viewport | ✅ Yes | ❌ No | ❌ No | Elements that are outside of the viewport must be scrolled to before the fast algorithm will consider them visible. This is aligned with scroll-container visibility. |
| **[z-index-coverage](../../../cypress/fixtures/visibility/positioning.html)** | Covered by higher z-index element |  ✅ Yes | ❌ No | ❌ No | Element covered by another element with higher z-index |
| **[clip-scenarios](../../../cypress/fixtures/visibility/overflow.html)** | Element clipped by CSS clip property | ✅ Yes | ❌ No | ❌ No | Element with `clip: rect(0, 0, 0, 0)` or similar clipping |
| **[transform](../../../cypress/fixtures/visibility/transforms.html)** | Element transformed outside viewport | ✅ Yes | ❌ No | ❌ No | Element with `transform: translateX(-9999px)` or similar |
| **[contain](../../../cypress/fixtures/visibility/basic-css-properties.html)** | Element with CSS contain:paint property | ✅ Yes | ❌ No | ❌ No | Element positioned outside of a parent that has the `contain: paint` property |
| **[backdrop-filter](../../../cypress/fixtures/visibility/basic-css-properties.html)** | Element covered by an element with with backdrop-filter opacity(0) | ✅ Yes | ❌ No | ❌ No|  |
| **[pointer-events-none](../../../cypress/fixtures/visibility/basic-css-properties.html)** | Element with pointer-events: none | ✅ Yes | ❌ No | ❌ No | Element has dimensions and is visible to the user, but cannot receive pointer events. |

## Migration Steps

### Step 1: Enable Fast Visibility
```javascript
// cypress.config.js
module.exports = {
  experimentalFastVisibility: true
}
```

**Note**: Ensure your application under test does not extensively use custom Shadow DOM elements, as the fast visibility algorithm does not yet support Shadow DOM.

### Step 2: Run Your Tests
Run your existing test suite to identify any failures:

```bash
npx run cypress # or your specific cypress command
```

### Step 3: Analyze Failures
Look for tests that fail with visibility-related assertions. Common patterns:

```javascript
// These assertions may behave differently
.should('be.visible')
.should('not.be.hidden')
.is(':visible')
.is(':hidden')
```

### Step 4: Disable Fast Visibility for Failing Specs
For specs that fail due to Shadow DOM or other incompatibilities, disable fast visibility:

```javascript
// In failing spec files
describe('My Test Suite', { experimentalFastVisibility: false }, () => {
  it('should work with legacy visibility', () => {
    // Your test here
  })
})
```

This allows you to gradually migrate specs while keeping failing ones working.

### Step 5: Fix Tests with Visibility-Related Failures
For specs that fail due to visibility algorithm differences, visually inspect the application under test at the failing assertion. If you can both see and click on the element in the browser, this algorithm should consider it visible.

## Common Compatibility Issues and Solutions

### Issue 1: Elements Previously Considered Visible Are Now Hidden

**Problem**: Test expects element to be visible, but fast algorithm correctly identifies it as hidden.

**Solution**: Update your test expectations to match the correct behavior:

```javascript
// Before (incorrect expectation)
cy.get('.rotated-element').should('be.visible')

// After (correct expectation)
cy.get('.rotated-element').should('be.hidden')
```

**Note**: If the element should be visible, fix the CSS in your application code, not in the test. Tests should verify the actual behavior of your application.

### Issue 2: Elements Outside Viewport

**Problem**: Elements positioned outside the viewport are now correctly identified as hidden.

**Solution**: Scroll the element into view before testing:

```javascript
// Before
cy.get('.off-screen-element').should('be.visible')

// After
cy.get('.off-screen-element').scrollIntoView().should('be.visible')
```

### Issue 3: Covered Elements

**Problem**: Elements covered by other elements are now correctly identified as hidden.

**Solution**: Test the covering element instead, or test the user interaction that reveals the covered element:

```javascript
// Before
cy.get('.covered-element').should('be.visible')

// After - test the covering element
cy.get('.covering-element').should('be.visible')

// Or test the user action that reveals the element
cy.get('.toggle-button').click()
cy.get('.covered-element').should('be.visible')
```

**Note**: Don't modify the DOM structure in tests. Test the actual user interactions that reveal hidden elements.

### Issue 4: Zero-Dimension Containers

**Problem**: Containers with zero dimensions are now correctly identified as hidden, but child elements may still be visible.

**Solution**: Test the child element instead of the container:

```javascript
// Before - testing the container
cy.get('.zero-dimension-container').should('be.visible')

// After - test the child element that should be visible
cy.get('.zero-dimension-container .child-element').should('be.visible')

// Or test the user action that gives the container dimensions
cy.get('.expand-button').click()
cy.get('.zero-dimension-container').should('be.visible')
```

**Note**: If the container should have dimensions, fix this in your application code. If testing child elements, assert on the child elements directly.

### Issue 5: Clipped Elements

**Problem**: Elements clipped by CSS are now correctly identified as hidden.

**Solution**: Update your test expectations or test the user interaction that reveals the element:

```javascript
// Before
cy.get('.clipped-element').should('be.visible')

// After - test that the element is hidden (correct behavior)
cy.get('.clipped-element').should('be.hidden')

// Or test the user action that reveals the element
cy.get('.show-content-button').click()
cy.get('.clipped-element').should('be.visible')

// Or test the container that controls the clipping
cy.get('.clipping-container').should('be.visible')
```

**Note**: If elements should be visible, fix the clipping in your application code. Tests should verify the actual user experience.

### Issue 6: Pointer Events

**Problem**: Elements with `pointer-events: none` or that have parents with `pointer-events:none` may be detected as hidden when they are visible.

**Solution**: Do not assert visibility on elements with `pointer-events:none`, as they cannot be interacted with.

### Issue 7: Shadow DOM incompatibilities

**Problem:**: Elements inside a Shadow DOM may not be detected properly as visible or hidden.

**Solution:**: Disable the `experimentalFastVisibility` setting for Shadow DOM tests.

## Rollback Plan

If you encounter issues that can't be easily resolved:

### Temporary Rollback
```javascript
// cypress.config.js
module.exports = {
  experimentalFastVisibility: false // Disable fast visibility
}
```

### Gradual Migration
Enable fast visibility for specific test suites:

```javascript
// Enable only for performance-critical tests
describe('Performance Tests', { experimentalFastVisibility: true }, () => {
  it('should handle complex DOM efficiently', () => {
    // Your performance tests here
  })
})
```

## Best Practices

### 1. Never Modify the Application Under Test (AUT)
**❌ Bad Practice**: Modifying CSS or DOM structure in tests
```javascript
// DON'T DO THIS - Modifying the AUT
cy.get('.element').invoke('css', 'display', 'block')
cy.get('.element').invoke('remove')
cy.get('.element').invoke('css', 'transform', 'none')
```

**✅ Good Practice**: Test the actual application behavior
```javascript
// DO THIS - Test real user interactions
cy.get('.toggle-button').click()
cy.get('.element').should('be.visible')
```

### 2. Test Element Functionality, Not Just Visibility
```javascript
// Good: Test if element is interactive
cy.get('.button').should('be.enabled').click()

// Avoid: Testing visibility alone
cy.get('.button').should('be.visible')
```

### 3. Use Semantic Selectors
```javascript
// Good: Use semantic selectors
cy.get('[data-testid="submit-button"]').should('be.visible')

// Avoid: Relying on CSS classes that might change
cy.get('.btn-primary').should('be.visible')
```

### 4. Test User Interactions
```javascript
// Good: Test user interactions
cy.get('.modal').should('be.visible')
cy.get('.modal .close-button').click()
cy.get('.modal').should('not.exist')

// Avoid: Testing CSS properties directly
cy.get('.modal').should('have.css', 'display', 'block')
```

## Troubleshooting

**If the element should be visible, but Cypress determines that it is hidden:**
- Verify that the element is actually visible, and within the browser viewport. If you have to scroll to view the element, Cypress will not consider it visible.
- Verify that the element has proper dimensions. If either its height or width are zero, re-assess if this is the best element to be interacting with.
- Verify that the element does not have `pointer-events:none`
- In some extreme CSS `transform` scenarios, the element can be so distorted that Cypress fails to sample a visible point. If you hit this edge case, re-assess the usefulness of the assertion and/or interaction.

**Shadow DOM Related Errors**

Shadow DOM support is not yet available in the fast algorithm. Disable fast visibility for tests that rely on Shadow DOM support.

### Debug Visibility Issues
```javascript
// Debug element visibility
cy.get('.element').then(($el) => {
  console.log('Element dimensions:', $el[0].getBoundingClientRect())
  console.log('Element styles:', $el[0].computedStyleMap())
  console.log('Element visibility:', Cypress.dom.isVisible($el[0]))
})
```

## Final Words

The fast visibility algorithm is an experimental feature that provides significant performance improvements for applications with complex DOM structures. While we try to align compatibility with the legacy algorithm, we err on the side of accuracy: the fast algorithm provides more geometrically correct visibility detection.

**Important Notes:**
- This is an **experimental feature** - if it proves beneficial, we may invest time in supporting Shadow DOM
- **Shadow DOM support is not yet available** - disable fast visibility for specs that rely heavily on Shadow DOM
- **Some compatibility differences exist** - when tests fail, the fast algorithm is likely correct and tests should be updated
- **Performance benefits are significant** - especially for applications with many DOM elements or complex layouts

By following this migration guide, you can resolve compatibility issues and benefit from faster, more accurate visibility detection while understanding the current limitations.
