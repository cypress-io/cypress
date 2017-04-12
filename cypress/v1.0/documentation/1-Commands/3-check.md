slug: check
excerpt: Select a checkbox or radio

Check the checkboxes or radios within the current subject.

**The following events are fired during check:** `mousedown`, `focus`, `mouseup`, `click`

| | |
|--- | --- |
| **Returns** | the new DOM element(s) found by the command. |
| **Timeout** | `cy.check` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) or the duration of the `timeout` specified in the command's [options](#options). |

***

# [cy.check()](#usage)

Checks checkboxes or radios.

***

# [cy.check( *value* )](#value-usage)

Checks the checkbox or radio with the matching value.

***

# [cy.check( *values* )](#values-usage)

Checks the checkboxes or radios with the matching values.

***

# Options

Pass in an options object to change the default behavior of `cy.check`.

**cy.check( *options* )**

Option | Default | Notes
--- | --- | ---
`interval` | `16` | Interval which to retry a check
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry the check
`force` | `false` | Forces check, disables error checking prior to check
`log` | `true` | whether to display command in command log
`multiple` | `false` | Enables serially checking multiple elements

***

# Usage

## Check all checkboxes

```javascript
cy.get("[type='checkbox']").check()
```

***

## Check all radios

```javascript
cy.get("[type='radio']").check()
```

***

## Check the element with id of `saveUserName` and check it

```javascript
cy.get("#saveUserName").check()
```

***

# Value Usage

## Check the checkbox with the value of "US"

```javascript
cy.get("input[type='checkbox']").check("US")
```

***

# Values Usage

## Check the checkbox with the value of "ga" and "ca"

```javascript
cy.get("input[type='checkbox']").check(["ga", "ca"])
```

***

# Command Log

## check the element with name of emailUser

```javascript
cy.get("form").find("[name='emailUser']").check()
```

The commands above will display in the command log as:

<img width="582" alt="screen shot 2015-11-29 at 12 53 25 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458925/6226b39e-9698-11e5-9a2a-debf91f5989a.png">

When clicking on `check` within the command log, the console outputs the following:

<img width="547" alt="screen shot 2015-11-29 at 12 53 48 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458927/65a2526c-9698-11e5-8b33-f59e666170e2.png">

***

# Related

- [uncheck](https://on.cypress.io/api/uncheck)
- [click](https://on.cypress.io/api/click)
