excerpt: Get the previous sibling of elements
slug: prev

### [cy.prev()](#usage)

Get the immediately preceding sibling of each element in the set of matched elements.

***

### [cy.prev( *selector* )](#selector-usage)

Get the immediately preceding sibling of each element in the set of matched elements filtered by selector.

***

## Usage
```html
<ul>
  <li>list item 1</li>
  <li>list item 2</li>
  <li class="third-item">list item 3</li>
  <li>list item 4</li>
  <li>list item 5</li>
</ul>
```

```javascript
// returns <li>list item 2</li>
cy.get(".third-item").prev()
```

***

## Selector Usage

```html
<ul>
  <li>list item 1</li>
  <li>list item 2</li>
  <li class="third-item">list item 3</li>
  <li>list item 4</li>
  <li>list item 5</li>
</ul>
```

```javascript
// returns <li>list item 3</li>
cy.get("li").prev(".third-item")
```

***

## Command Log

```javascript
cy.get(".left-nav").find("li.active").prev()
```

The commands above will display in the command log as:

<img width="564" alt="screen shot 2015-11-29 at 12 46 57 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458884/5bb4da1e-9697-11e5-9172-762df10c9a6e.png">

When clicking on `prev` within the command log, the console outputs the following:

<img width="446" alt="screen shot 2015-11-29 at 12 47 09 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458886/5e20c63c-9697-11e5-9167-1b81f96e1906.png">

***

## Related
1. [next](http://on.cypress.io/api/next)