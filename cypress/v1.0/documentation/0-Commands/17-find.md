excerpt: Get descendants of elements
slug: find

### [cy.find( *selector* )](#selector-usage)

Gets the descendants of the each element in the current set of matched elements within the selector.

## Selector Usage

> Get li's within parent

```html
<ul id="parent">
  <li class="first"></li>
  <li class="second"></li>
</ul>
```

```javascript
// returns [<li class="first"></li>, <li class="second"></li>]
cy.get("#parent").find("li")
```

## Command Log


```javascript
cy.get(".left-nav>.nav").find(">li")
```

The commands above will display in the command log as:

<img width="522" alt="screen shot 2015-11-27 at 2 19 38 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447309/f6a9be4a-9511-11e5-84a5-a111215bf1e6.png">

When clicking on the `find` command within the command log, the console outputs the following:

<img width="516" alt="screen shot 2015-11-27 at 2 19 54 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447312/fa3679cc-9511-11e5-9bea-904f8c70063d.png">

## Related
1. [get](/v1.0/docs/get)