---
title: invoke
comments: false
---

Invoke a function on the previously yielded subject.

{% note info %}
If you want to get a property that is not a function on the previously yielded subject, use {% url `.its()` its %}.
{% endnote %}

# Syntax

```javascript
.invoke(functionName)
.invoke(functionName, args...)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.wrap({animate: fn}).invoke('animate') // Invoke the 'animate' function
cy.get('.modal').invoke('show')          // Invoke the jQuery 'show' function
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
cy.invoke('convert')                   // Errors, cannot be chained off 'cy'
cy.wrap({name: 'Jane'}).invoke('name') // Errors, 'name' is not a function
```

## Arguments

**{% fa fa-angle-right %} functionName**  ***(String)***

Name of function to be invoked.

**{% fa fa-angle-right %} args...**

Additional arguments to be given to the function call. There is no limit to the number of arguments.

# Examples

## Function

***Assert on a function's return value***

```javascript
var fn = function(){
  return 'bar'
}

cy.wrap({foo: fn}).invoke('foo').should('eq', 'bar') // true
```

***Use `.invoke()` to test HTML content***

{% note info %}
{% url "Check out our example recipe where we use `cy.invoke('text')` to test against HTML content" working-with-the-backend-recipe %}
{% endnote %}

***Properties that are functions are invoked***

In the example below, we use `.invoke()` to force a hidden div to be `'display: block'` so we can interact with its children elements.

```javascript
cy.get('div.container').should('be.hidden') // true

  .invoke('show') // call jquery method 'show' on the '.container'
    .should('be.visible') // true
    .find('input').type('Cypress is great')
```

***Use `.invoke('show')` and `.invoke('trigger')`***

{% note info %}
{% url "Check out our example recipe where we use `cy.invoke('show')` and `cy.invoke('trigger')` to click an element that is only visible on hover" testing-the-dom-recipe %}
{% endnote %}

## Function with Arguments

***Send specific arguments to the function***

```javascript
var fn = function(a, b, c){
  return a + b + c
}

cy
  .wrap({sum: fn})
  .invoke('sum', 2, 4, 6)
    .should('be.gt', 10) // true
    .and('be.lt', 20)    // true
```

***Use `cy.invoke('removeAttr', 'target')` to get around new tab***

{% note info %}
{% url "Check out our example recipe where we use `cy.invoke('removeAttr', 'target')` to test clicking on a link without opening in a new tab" testing-the-dom-recipe %}%}
{% endnote %}

***Arguments are automatically forwarded to the function***

```javascript
cy
  .get('img').invoke('attr', 'src')
    .should('include', 'myLogo')
```

# Notes

## Third Party Plugins

***Using a Kendo DropDown***

If you are using `jQuery` then the `jQuery` wrapped elements will automatically have your 3rd party plugins available to be called.

```javascript
cy.get('input').invoke('getKendoDropDownList').then(function(dropDownList){
  // yields the return of $input.getKendoDropDownList()
  return dropDownList.select('apples')
})
```

We can rewrite the previous example in a more terse way and add an assertion.

```javascript
cy
  .get('input')
  .invoke('getKendoDropDownList')
  .invoke('select', 'apples')
  .invoke('val').should('match', /apples/)
```

# Rules

## Requirements {% helper_icon requirements %}

{% requirements child .invoke %}

## Assertions {% helper_icon assertions %}

{% assertions retry .invoke %}

## Timeouts {% helper_icon timeout %}

{% timeouts assertions .invoke %}

# Command Log

***Invoke jQuery show method on element***

```javascript
cy.get('.connectors-div').should('be.hidden')
  .invoke('show').should('be.visible')
```

The commands above will display in the command log as:

![Command Log invoke](/img/api/invoke/invoke-jquery-show-on-element-for-testing.png)

When clicking on `invoke` within the command log, the console outputs the following:

![Console log invoke](/img/api/invoke/log-function-invoked-and-return.png)

# See also

- {% url `.its()` its %}
- {% url `.then()` then %}
- {% url `cy.wrap()` wrap %}
