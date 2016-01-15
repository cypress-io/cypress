slug: next
excerpt: Get the next sibling of elements

### [cy.next()](#usage)

Get the immediately following sibling of each element in the set of matched elements. If a selector is provided, it retrieves the next sibling only if it matches that selector.

***

### [cy.next( *selector* )](#selector-usage)

Get the immediately following sibling of each element in the set of matched elements. If a selector is provided, it retrieves the next sibling only if it matches that selector.

***

## Usage

#### Find the element next to `.second`

```html
<ul>
  <li>apples</li>
  <li class="second">oranges</li>
  <li>bananas</li>
</ul>
```

```javascript
//returns <li>bananas</li>
cy.get(".second").next()
```

***

## Selector Usage

#### Find the very next sibling of each li. Keep only the ones with a class `selected`.

```html
<ul>
  <li>apples</li>
  <li>oranges</li>
  <li>bananas</li>
  <li class="selected">pineapples</li>
</ul>
```

```javascript
//returns <li>pineapples</li>
cy.get("li").next(".selected")
```

***

## Command Log

```javascript
cy.get(".left-nav").find("li.active").next()
```

The commands above will display in the command log as:

<img width="563" alt="screen shot 2015-11-29 at 12 42 07 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458857/afcfddf2-9696-11e5-9405-0cd994f70d45.png">

When clicking on `next` within the command log, the console outputs the following:

<img width="547" alt="screen shot 2015-11-29 at 12 42 22 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458858/b30b0a0a-9696-11e5-99b9-d785b597287c.png">

***

## Related
1. [prev](http://on.cypress.io/api/prev)