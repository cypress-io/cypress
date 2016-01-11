slug: first

### [cy.first()](#usage)

Reduce the set of matched elements to the first in the set. This method does not accept any arguments.

***

## Usage

#### Get the first list item in a list.

```html
<ul>
  <li class="one">list item 1</li>
  <li class="two">list item 2</li>
  <li class="three">list item 3</li>
  <li class="four">list item 4</li>
</ul>
```

```js
// returns <li class="one"></li>
cy.get("ul").first()
```

***

## Command Log

```js
cy.get("form").find("input").first()
```

The commands above will display in the command log as:

<img width="527" alt="screen shot 2015-11-29 at 12 28 08 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458770/d9439ee6-9694-11e5-8754-b2641ba44883.png">

When clicking on `first` within the command log, the console outputs the following:

<img width="616" alt="screen shot 2015-11-29 at 12 28 23 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458771/db8cb516-9694-11e5-86c2-cf3bbb9a666d.png">

***

## Related
1. [last](last)