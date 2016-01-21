slug: focused
excerpt: Get the element that is focused

# [cy.focused()](#usage)

Returns the current element that is focused.

If Cypress does not find *any* element with focus, `null` is returned.

***

# Options

Pass in an options object to change the default behavior of the command.

**cy.focused( *options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | Display command in command log

***

# Usage

## Get the element that is focused.

```javascript
cy.focused()
```

***

## Make an assertion on the focused element.

```javascript
cy.focused().should("have.attr", "name", "username")
```

***

# Command Log

## Make an assertion on the focused element.


```javascript
cy.focused().should("have.attr", "name").and("eq", "num")
```

The commands above will display in the command log as:

<img width="523" alt="screen shot 2015-11-27 at 1 01 51 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446780/f71fb350-9509-11e5-963a-a6940fbc63b6.png">

When clicking on the `focused` command within the command log, the console outputs the following:

<img width="407" alt="screen shot 2015-11-27 at 1 02 02 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446771/d104a6d0-9509-11e5-9464-2e397cb1eb24.png">

***

# Related

- [focus](https://on.cypress.io/api/focus)
- [blur](https://on.cypress.io/api/blur)