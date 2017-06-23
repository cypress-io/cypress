---
title: select
comments: false
---

Select an `<option>` within a `<select>`.

# Syntax

```javascript
.select(value)
.select(values)
.select(value, options)
.select(values, options)
```

## Usage

`.select()` requires being chained off another cy command that *yields* a `<select>` DOM element.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('select').select('user-1') // Select the 'user-1' option
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.select('John Adams')  // Errors, cannot be chained off 'cy'
cy.location().select()   // Errors, 'location' does not yield <select> element
```

## Arguments

**{% fa fa-angle-right %} value**  ***(String)***

The `value` or text content of the `<option>` to be selected.

**{% fa fa-angle-right %} values**  ***(Array)***

An array of `values` or text contents of the `<option>`s to be selected.

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.select()`.

Option | Default | Notes
--- | --- | ---
`force` | `false` | Forces select, disables error checking prior to select
`interval` | `50` | Interval which to retry a select
`log` | `true` | Whether to display command in Command Log
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | Total time to retry the select


## Yields {% yields %}

`.select()` yields the new DOM elements selected.

## Timeout {% timeout %}

`.select()` will continue to select the options for the duration of the {% url `defaultCommandTimeout` configuration#Timeouts %}.

# Examples

## Text Content

**Select the option with the text `apples`**

```html
<select>
  <option value="456">apples</option>
  <option value="457">oranges</option>
  <option value="458">bananas</option>
</select>
```

```javascript
// yields <option value="456">apples</option>
cy.get('select').select('apples')
```

## Value

**Select the option with the value "456"**

```html
<select>
  <option value="456">apples</option>
  <option value="457">oranges</option>
  <option value="458">bananas</option>
</select>
```

```javascript
// yields <option value="456">apples</option>
cy.get('select').select('456')
```

## Select multiple options

**Select the options with the texts "apples" and "bananas"**

```html
<select multiple>
  <option value="456">apples</option>
  <option value="457">oranges</option>
  <option value="458">bananas</option>
</select>
```

```javascript
cy.get('select').select(['apples', 'bananas'])
```

**Select the options with the values "456" and "457"**

```html
<select multiple>
  <option value="456">apples</option>
  <option value="457">oranges</option>
  <option value="458">bananas</option>
</select>
```

```javascript
cy.get('select').select(['456', '457'])
```

# Command Log

**Select the option with the text "Homer Simpson"**

```javascript
cy.get('select').select('Homer Simpson')
```

The commands above will display in the command log as:

![Command Log select](/img/api/select/select-homer-option-from-browser-dropdown.png)

When clicking on `select` within the command log, the console outputs the following:

![Console Log select](/img/api/select/console-log-for-select-shows-option-and-any-events-caused-from-clicking.png)

# See also

- {% url `.click()` click %}
