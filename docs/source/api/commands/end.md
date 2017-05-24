---
title: end
comments: true
description: ''
---

End a chain of commands.


# Syntax

```javascript
.end()
```

## Usage

`.end()` should be chained off another cy command.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.contains('ul').end()   // Yield 'null' instead of 'ul' element
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.end()                  // Does not make sense to chain off 'cy'
```

## Yields

`.end()` yields `null`.


# Examples

`.end()` is useful when you want to end a chain of commands and force the next command to not receive what was yielded in the previous command.

```javascript
cy
  .contains('User: Cheryl').click().end() // yield null
  .contains('User: Charles').click()      // contains looks for content in document now
```

# Command Log

**`end` does *not* log in the command log**

```javascript
cy
  .contains('.modal-title', 'Select Folder Type').end()
  .contains('li', 'Maintenance').should('have.class', 'active')
```

The commands above will display in the command log as:

![screen shot 2016-01-21 at 11 28 39 am](https://cloud.githubusercontent.com/assets/1271364/12486875/8aa69ff0-c032-11e5-815d-b29a5020271a.png)

# See also

- [root](https://on.cypress.io/api/root)
- [within](https://on.cypress.io/api/within)
