slug: siblings
excerpt: Get the siblings of elements

# [cy.siblings()](#usage)

Get the siblings of each element in the set of matched elements.

***

# [cy.siblings( *selector* )](#selector-usage)

Get the siblings of each element in the set of matched elements filtered by a selector.

***

# Usage

Get the siblings of each li.

```html
<ul>
  <li>Home</li>
  <li>Contact</li>
  <li class="active">Services</li>
  <li>Price</li>
</ul>
```

```javascript
// returns all other li's in list
cy.get(".active").siblings()
```

***

# Selector Usage

Get siblings of element with class `active`.

```javascript
// returns <li class="active">Services</li>
cy.get("li").siblings(".active")
```

***

# Command Log

```javascript
cy.get(".left-nav").find("li.active").siblings()
```

The commands above will display in the command log as:

<img width="561" alt="screen shot 2015-11-29 at 12 48 55 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458897/a93f2a1e-9697-11e5-8a5b-b131156e1aa4.png">

When clicking on `siblings` within the command log, the console outputs the following:

<img width="429" alt="screen shot 2015-11-29 at 12 49 09 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458898/ab940fd2-9697-11e5-96ab-a4c34efa3431.png">

***

# Related

1. [prev](http://on.cypress.io/api/prev)
2. [next](http://on.cypress.io/api/next)