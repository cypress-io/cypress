slug: last

### [cy.last()](#usage)

Reduce the set of matched elements to the final one in the set. This command does not accept any arguments.

***

## Usage

#### Get the last list item in a list.

```html
<ul>
  <li class="one">list item 1</li>
  <li class="two">list item 2</li>
  <li class="three">list item 3</li>
  <li class="four">list item 4</li>
</ul>
```

```js
// returns <li class="four"></li>
cy.get("ul").last()
```

***

## Command Log

```js
cy.get("form").find("button").last()
```

The commands above will display in the command log as:

<img width="560" alt="screen shot 2015-11-29 at 12 33 52 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458797/8e9abdf6-9695-11e5-8594-7044751d5199.png">

When clicking on `last` within the command log, the console outputs the following:

<img width="746" alt="screen shot 2015-11-29 at 12 34 07 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458799/91a115cc-9695-11e5-8569-93fbaa2704d4.png">

***

## Related
1. [first](first)