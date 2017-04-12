slug: dblclick
excerpt: Double-click on a DOM element

Double-click on the DOM element in the previous command.

**The following events are fired during dblclick:** `dblclick`

| | |
|--- | --- |
| **Returns** | the new DOM element(s) found by the command. |
| **Timeout** | `cy.dblclick` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) |

***

# [cy.dblclick()](#usage)

Double-click the current subject.

***

# Options

Pass in an options object to change the default behavior of `cy.dblclick`.

**cy.dblclick(*options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log

***

# Usage

## Double click an anchor link

```html
<a href='#nav1'>Menu</a>
```

```javascript
// returns the <a> for further chaining
cy.get("#nav1").dblclick()
```

***

# Command Log

## Double click on a calendar schedule

```javascript
cy.get("[data-schedule-id='4529114']:first").dblclick()
```

The commands above will display in the command log as:

<img width="585" alt="screen shot 2015-11-29 at 1 12 02 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459013/035a6c5e-969b-11e5-935f-dce5c8efbdd6.png">

When clicking on `dblclick` within the command log, the console outputs the following:

<img width="836" alt="screen shot 2015-11-29 at 1 12 26 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459015/0755e216-969b-11e5-9f7e-ed04245d75ef.png">

***

# Related

- [click](https://on.cypress.io/api/click)
