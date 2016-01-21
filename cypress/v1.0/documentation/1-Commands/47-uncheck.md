slug: uncheck
excerpt: Unselect a checkbox or radio

# [cy.uncheck()](#usage)

Unchecks checkboxes or radios.

***

# Options

Pass in an options object to specify the conditions of the command.

**cy.uncheck( *options* )**

`cy.uncheck` supports these options:

Option | Default | Notes
--- | --- | ---
`interval` | `16` | Interval which to retry a uncheck
`timeout` | `4000` | Total time to retry the uncheck
`force` | `false` | Forces uncheck, disables error checking prior to uncheck
`log` | `true` | Display command in command log

***

# Usage

Uncheck the checkbox

```javascript
cy.get(":checkbox").uncheck()
```

Uncheck element with the id `saveUserName`

```javascript
cy.get("#saveUserName").uncheck()
```

***

# Command Log

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

1. [check](https://on.cypress.io/api/check)
1. [click](https://on.cypress.io/api/click)