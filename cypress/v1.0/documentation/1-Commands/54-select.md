slug: select
excerpt: Select an option in a select

Select an option within a `<select>` DOM element.

**The following events are fired during select:** `mousedown`, `focus`, `mouseup`, `click`

| | |
|--- | --- |
| **Returns** | the new DOM element(s) found by the command. |
| **Timeout** | `cy.select` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) or the duration of the `timeout` specified in the command's [options](#options). |

***

# [cy.select( *text* )](#text-usage)

Select an option within a `<select>` element based on the text content of the option.

***

# [cy.select( *value* )](#value-usage)

Select an option within a `<select>` element based on the value of the option.

***

# [cy.select( *texts* )](#texts-usage)

Select multiple options within a `<select>` element based on the text of the option.

***

# [cy.select( *values* )](#values-usage)

Select multiple options within a `<select>` element based on the value of the option.


***

# Options

Pass in an options object to change the default behavior of `cy.select`.

**cy.select( *text*, *options* )**
**cy.select( *value*, *options* )**
**cy.select( *array*, *options* )**

Option | Default | Notes
--- | --- | ---
`force` | `false` | Forces select, disables error checking prior to select
`interval` | `50` | Interval which to retry a select
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry the select
`log` | `true` | whether to display command in command log

***

# Text Usage

## Select the option with the text `apples`

```html
<select>
  <option value="456">apples</option>
  <option value="457">oranges</option>
  <option value="458">bananas</option>
</select>
```

```javascript
// returns <option value="456">apples</option>
cy.get("select").select("apples")
```

***

# Value Usage

## Select the option with the value "456"

```html
<select>
  <option value="456">apples</option>
  <option value="457">oranges</option>
  <option value="458">bananas</option>
</select>
```

```javascript
// returns <option value="456">apples</option>
cy.get("select").select("456")
```

***

# Texts Usage

## Select the options with the texts "apples" and "bananas"

```html
<select multiple>
  <option value="456">apples</option>
  <option value="457">oranges</option>
  <option value="458">bananas</option>
</select>
```

```javascript
cy.get("select").select(["apples", "bananas"])
```

***

# Values Usage

## Select the options with the values "456" and "457"

```html
<select multiple>
  <option value="456">apples</option>
  <option value="457">oranges</option>
  <option value="458">bananas</option>
</select>
```

```javascript
cy.get("select").select(["456", "457"])
```

***

# Command Log

## Select the option with the text "Homer Simpson"

```javascript
cy.get("select").select("Homer Simpson")
```

The commands above will display in the command log as:

<img width="575" alt="screen shot 2015-11-29 at 1 17 27 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459044/a2fd8fca-969b-11e5-8d23-3a118b82b5de.png">

When clicking on `select` within the command log, the console outputs the following:

<img width="560" alt="screen shot 2015-11-29 at 1 17 45 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459045/a6b3bde2-969b-11e5-9357-272ea9684987.png">

***

# Related

- [click](https://on.cypress.io/api/click)
