slug: children
excerpt: Get the children of elements

# [cy.children()](#usage)

Get the children of each element in the set of matched elements.

# [cy.children( *selector* )](#selector-usage)

The `.children()` method optionally accepts a selector expression. If the selector is supplied, the elements will be filtered by testing whether they match it.

# Usage

```html
<ul class="primary-nav">
  <li class="about">About</li>
  <li class="services">Services
    <ul class="secondary-nav">
      <li class="services-1">Web Design</li>
      <li class="services-2">Print Design
        <ul class="tertiary-nav">
          <li class="item-1">Signage</li>
          <li class="item-2">T-Shirt</li>
          <li class="item-3">Business Cards</li>
        </ul>
      </li>
      <li class="services-3">Logo Design</li>
    </ul>
  </li>
  <li class="Contact">Contact</li>
</ul>
```

```javascript
// returns [
//  <li class="services-1"></li>,
//  <li class="services-2"></li>,
//  <li class="services-3"></li>
// ]
cy.get("ul.secondary-nav").children()
```

# Selector Usage

```html
<div>
  <ul>
    <li class="active">Unit Testing</li>
    <li>Integration Testing</li>
  </ul>
</div>
```

```javascript
// returns [<li class="active">Unit Testing</li>]
cy.get("ul").children(".active")
```

# Command Log

```javascript
cy.get(".left-nav>.nav").children().should("have.length", 8)
```

The commands above will display in the command log as:

<img width="521" alt="screen shot 2015-11-27 at 1 52 26 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447069/2b0f8a7e-950e-11e5-96b5-9d82d9fdddec.png">

When clicking on the `children` command within the command log, the console outputs the following:

<img width="542" alt="screen shot 2015-11-27 at 1 52 41 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447071/2e9252bc-950e-11e5-9a32-e5860da89160.png">

# Related

1. [parent](https://on.cypress.io/api/parent)
2. [parents](https://on.cypress.io/api/parents)
3. [next](https://on.cypress.io/api/next)
4. [siblings](https://on.cypress.io/api/siblings)