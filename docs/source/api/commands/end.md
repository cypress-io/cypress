---
title: end
comments: false
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

## Yields {% helper_icon yields %}

`.end()` yields `null`.


# Examples

`.end()` is useful when you want to end a chain of commands and force the next command to not receive what was yielded in the previous command.

```javascript
cy
  .contains('User: Cheryl').click().end() // yield null
  .contains('User: Charles').click()      // contains looks for content in document now
```

Alternatively, you can always start a new chain of commands of of `cy`.


```javascript
cy.contains('User: Cheryl').click()
cy.contains('User: Charles').click()  // contains looks for content in document now
```

# Command Log

**`.end()` does *not* log in the command log**

# See also

- {% url `.root()` root %}
- {% url `.within()` within %}
