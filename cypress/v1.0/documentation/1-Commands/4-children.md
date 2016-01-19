slug: children
excerpt: Get the children of elements

### [cy.children()](#usage)

Get the children of each element in the set of matched elements, optionally filtered by a selector.

### [cy.children( *selector* )](#selector-usage)

The `.children()` method optionally accepts a selector expression. If the selector is supplied, the elements will be filtered by testing whether they match it.

## Usage

```html
<ul class="level-1">
  <li class="item-i">I</li>
  <li class="item-ii">II
    <ul class="level-2">
      <li class="item-a">A</li>
      <li class="item-b">B
        <ul class="level-3">
          <li class="item-1">1</li>
          <li class="item-2">2</li>
          <li class="item-3">3</li>
        </ul>
      </li>
      <li class="item-c">C</li>
    </ul>
  </li>
  <li class="item-iii">III</li>
</ul>
```

```javascript
// returns [
//  <li class="item-a"></li>,
//  <li class="item-b"></li>,
//  <li class="item-c"></li>
// ]
cy.get("ul.level-2").children()
```

## Selector Usage

```html
<div>
  <span>Hello</span>
  <p class="selected">Hello Again</p>
  <div class="selected">And Again</div>
  <p>And One Last Time</p>
</div>
```

```javascript
// returns [<p class="selected">Hello Again</p>, <div class="selected">And Again</div>]
cy.get("div").children(".selected")
```

## Command Log

```javascript
cy.get(".left-nav>.nav").children().should("have.length", 8)
```

The commands above will display in the command log as:

<img width="521" alt="screen shot 2015-11-27 at 1 52 26 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447069/2b0f8a7e-950e-11e5-96b5-9d82d9fdddec.png">

When clicking on the `children` command within the command log, the console outputs the following:

<img width="542" alt="screen shot 2015-11-27 at 1 52 41 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447071/2e9252bc-950e-11e5-9a32-e5860da89160.png">

## Related
1. [parent](http://on.cypress.io/api/parent)
2. [parents](http://on.cypress.io/api/parents)
3. [next](http://on.cypress.io/api/next)
4. [siblings](http://on.cypress.io/api/siblings)