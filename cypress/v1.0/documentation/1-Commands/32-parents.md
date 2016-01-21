slug: parents
excerpt: Get the parents of elements

# [cy.parents()](#usage)

Get the ancestors of each element in the current set of matched elements.

***

# [cy.parents( *selector* )](#selector-usage)

Get the ancestors of each element in the current set of matched elements filtered by selector

***

# Options

Pass in an options object to specify the conditions of the command.

**cy.parents( *options* )**
**cy.parents( *selector*, *options* )**

`cy.parents` supports these options:

Option | Default | Notes
--- | --- | ---
`log` | `true` | Display command in command log

***

# Usage

## Get the parents of the active `li`

```javascript
cy.get("li.active").parents()
```

***

# Selector Usage

## Get the parents with class `nav` of the active `li`

```javascript
cy.get("li.active").parents(".nav")
```

***

# Command Log

## Get the parents of the active `li`

```javascript
cy.get("li.active").parents()
```

<img width="531" alt="screen shot 2015-11-27 at 2 02 59 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447168/be286244-950f-11e5-82e8-9a2a6d1d08e8.png">

When clicking on the `parents` command within the command log, the console outputs the following:

<img width="537" alt="screen shot 2015-11-27 at 2 03 32 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447171/c1ba5ef8-950f-11e5-9f2d-7fbd0b142649.png">

***

# Related

- [parent](https://on.cypress.io/api/parent)
- [children](https://on.cypress.io/api/children)