slug: uncheck
excerpt: Unselect a checkbox or radio

# [cy.uncheck()](#section-usage)

Unchecks checkboxes or radios. Triggers events associated with check.

***

# [cy.uncheck( *values* )](#section-values-usage)

Unchecks the checkboxes or radios matching the values. Triggers events associated with uncheck.

***

# Options

Pass in an options object to change the default behavior of `cy.uncheck`.

**cy.uncheck( *options* )**

Option | Default | Notes
--- | --- | ---
`interval` | `16` | Interval which to retry a uncheck
`timeout` | `4000` | Total time to retry the uncheck
`force` | `false` | Forces uncheck, disables error checking prior to uncheck
`log` | `true` | Display command in command log

***

# Usage

## Uncheck all checkboxes

```javascript
cy.get(":checkbox").uncheck()
```

***

## Uncheck all radios

```javascript
cy.get("[type='radio']").uncheck()
```

***

## Uncheck element with the id `saveUserName`

```javascript
cy.get("#saveUserName").uncheck()
```

***

# Values Usage

## Uncheck the checkbox with the value of "ga"

```javascript
cy.get("input[type='checkbox']").uncheck(["ga"])
```

***

# Command Log

## Uncheck the first checkbox

```javascript
cy
  .get("[data-js='choose-all']").click()
  .find("input[type='checkbox']").first().uncheck()
```

The commands above will display in the command log as:

<img width="584" alt="screen shot 2015-11-29 at 1 30 49 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459133/7bf25814-969d-11e5-9f03-9d2d4538fcd5.png">

When clicking on `uncheck` within the command log, the console outputs the following:

<img width="601" alt="screen shot 2015-11-29 at 1 31 04 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459134/7f29dea8-969d-11e5-9843-dfd07dfe888f.png">

***

# Related

- [check](https://on.cypress.io/api/check)
- [click](https://on.cypress.io/api/click)