excerpt: Get the parents of elements
slug: parents

### [cy.parents()](#usage)

Get the ancestors of each element in the current set of matched elements.

***

### [cy.parents( *selector* )](#selector-usage)

Get the ancestors of each element in the current set of matched elements filtered by selector

***

## Usage

#### Get the parents of the active `li`

```javascript
cy.get("li.active").parents()
```

***

## Selector Usage

#### Get the parents with class `nav` of the active `li`

```javascript
cy.get("li.active").parents(".nav")
```

***

## Command Log

<img width="531" alt="screen shot 2015-11-27 at 2 02 59 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447168/be286244-950f-11e5-82e8-9a2a6d1d08e8.png">

When clicking on the `parents` command within the command log, the console outputs the following:

<img width="537" alt="screen shot 2015-11-27 at 2 03 32 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447171/c1ba5ef8-950f-11e5-9f2d-7fbd0b142649.png">

***

## Related
1. [parent](http://on.cypress.io/api/parent)
2. [children](http://on.cypress.io/api/children)