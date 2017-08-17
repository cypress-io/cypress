---
title: eq
comments: false
---

Get A DOM element at a specific index in an array of elements.

{% note info %}
The querying behavior of this command matches exactly how {% url `.eq()` http://api.jquery.com/eq %} works in jQuery.
{% endnote %}

# Syntax

```javascript
.eq(index)
.eq(indexFromEnd)
.eq(index, options)
.eq(indexFromEnd, options)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.get('tbody>tr').eq(0)    // Yield first 'tr' in 'tbody'
cy.get('ul>li').eq('4')     // Yield fifth 'li' in 'ul'
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
cy.eq(0)                  // Errors, cannot be chained off 'cy'
cy.getCookies().eq('4')   // Errors, 'getCookies' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} index**  ***(Number)***

A number indicating the index to find the element at within an array of elements.

**{% fa fa-angle-right %} indexFromEnd**  ***(Number)***

A negative number indicating the index position from the end to find the element at within an array of elements.

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.eq()`.

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | {% usage_options timeout .eq %}

## Yields {% helper_icon yields %}

{% yields changes_dom_subject .eq %}

# Examples

## Index

***Find the 2nd element within the elements***

```html
<ul>
  <li>tabby</li>
  <li>siamese</li>
  <li>persian</li>
  <li>sphynx</li>
  <li>burmese</li>
</ul>
```

```javascript
cy.get('li').eq(1).should('contain', 'siamese') // true
```

## Index Form End

***Find the 2nd from the last element within the elements***

```html
<ul>
  <li>tabby</li>
  <li>siamese</li>
  <li>persian</li>
  <li>sphynx</li>
  <li>burmese</li>
</ul>
```

```javascript
cy.get('li').eq(-2).should('contain', 'sphynx') // true
```

# Rules

## Requirements {% helper_icon requirements %}

{% requirements dom .eq %}

## Assertions {% helper_icon assertions %}

{% assertions existence .eq %}

## Timeouts {% helper_icon timeout %}

{% timeouts existence .eq %}

# Command Log

***Find the 4th `<li>` in the navigation***

```javascript
cy.get('.left-nav.nav').find('>li').eq(3)
```

The commands above will display in the command log as:

![Command log eq](/img/api/eq/find-element-at-index.png)

When clicking on the `eq` command within the command log, the console outputs the following:

![console.log eq](/img/api/eq/see-element-and-list-when-using-eq.png)

# See also

- {% url `.first()` first %}
- {% url `.last()` last %}
- {% url `.next()` next %}
- {% url `.prev()` prev %}
