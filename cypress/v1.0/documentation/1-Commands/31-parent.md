slug: parent
excerpt: Get the parent of elements

# [cy.parent()](#usage)

Get the parent of each element in the current set of matched elements.

***

# [cy.parent( *selector* )](#selector-usage)

Get the parent of each element in the current set of matched elements filtered by selector.

***

# Options

Pass in an options object to change the default behavior of `cy.parent`.

**cy.parent( *options* )**
**cy.parent( *selector*, *options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | Display command in command log

***

# Usage

## Get the parent of the active `li`

```javascript
cy.get("li.active").parent()
```

***

# Selector Usage

## Get the parent with class `nav` of the active `li`

```javascript
cy.get("li.active").parent(".nav")
```

***

# Command Log

## Assert on the parent of the active li

```javascript
cy.get("li.active").parent().should("have.class", "nav")
```

The commands above will display in the command log as:

<img width="531" alt="screen shot 2015-11-27 at 1 58 32 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447127/0d9ab5a8-950f-11e5-90ae-c317dd83aa65.png">

When clicking on the `parent` command within the command log, the console outputs the following:

<img width="440" alt="screen shot 2015-11-27 at 1 58 44 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447130/11b22c02-950f-11e5-9b82-cc3b2ff8548e.png">

***

# Related

- [parents](https://on.cypress.io/api/parents)
- [children](https://on.cypress.io/api/children)