excerpt: Remove elements from set
slug: not

### [cy.not( *selector* )](#selector-usage)

Remove elements from the set of matched elements. Opposite of [`.filter()`](https://github.com/cypress-io/cypress/wiki#filter)

***

## Selector Usage

> Filter the current subject to the elements that do not have class `active`.

```javascript
cy.get(".left-nav>.nav").find(">li").not(".active")
```

***

## Command Log

```javascript
cy.get("form").find("button").not("[type='submit']")
```

The commands above will display in the command log as:

<img width="572" alt="screen shot 2015-11-29 at 12 36 49 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458817/0a846c3c-9696-11e5-9901-5f4376629e75.png">

When clicking on `not` within the command log, the console outputs the following:

<img width="689" alt="screen shot 2015-11-29 at 12 37 39 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458819/0d6870f6-9696-11e5-9364-2685b8ffc71b.png">

***
## Related
1. [filter](http://on.cypress.io/api/filter)