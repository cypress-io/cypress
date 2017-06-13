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

`.invoke()` requires being chained off another cy command that *yields* an object with function properties.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.wrap({animate: fn}).invoke('animate') // Invoke the 'animate' function
cy.get('.modal').invoke('show')          // Invoke the jQuery 'show' function
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.invoke('convert')                   // Errors, cannot be chained off 'cy'
cy.wrap({name: 'Jane'}).invoke('name') // Errors, 'name' is not a function
```

## Arguments

**{% fa fa-angle-right %} functionName**  ***(String)***

Name of function to be invoked.

**{% fa fa-angle-right %} args...**

Additional arguments to be given to the function call. There is no limit to the number of arguments.

## Yields

`.invoke()` yields the return value of the invoked property.

## Timeout

# Examples

## Function

**Assert on a function's return value**

```javascript
var fn = function(){
  return 'bar'
}

cy.wrap({foo: fn}).invoke('foo').should('eq', 'bar') // true
```

**Use `.invoke()` to test HTML content**

{% note info %}
[Check out our example recipe where we use cy.invoke('text') to test against HTML content](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/bootstrapping_app_test_data_spec.js)
{% endnote %}

**Properties that are functions are invoked**

In the example below, we use `.invoke()` to force a hidden div to be `'display: block'` so we can interact with its children elements.

```javascript
cy.get('div.container').should('be.hidden') // true

  .invoke('show') // call jquery method 'show' on the '.container'
    .should('be.visible') // true
    .find('input').type('Cypress is great')
```

**Use `.invoke('show')` and `.invoke('trigger')`**

{% note info %}
[Check out our example recipe where we use cy.invoke('show') and cy.invoke('trigger') to click an element that is only visible on hover](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/hover_hidden_elements_spec.js)
{% endnote %}

## Third Party Plugins

**Using a Kendo DropDown**

Invoke functions available from 3rd party plugins included in your app.

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
  .its('val').should('match', /apples/)
```

## Function with Arguments

**Send specific arguments to the function**

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

**Use `cy.invoke('removeAttr', 'target')` to get around new tab**

{% note info %}
[Check out our example recipe where we use cy.invoke('removeAttr', 'target') to test clicking on a link without opening in a new tab](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/tab_handling_anchor_links_spec.js)
{% endnote %}

**Arguments are automatically forwarded to the function**

```javascript
cy
  .get('img').invoke('attr', 'src')
    .should('include', 'myLogo')
```

# Command Log

**Invoke jQuery show method on element**

```javascript
cy.get('.connectors-div').should('be.hidden')
  .invoke('show').should('be.visible')
```

The commands above will display in the command log as:

![Command Log invoke](https://cloud.githubusercontent.com/assets/1271364/26691729/3a75b3c8-46cc-11e7-835d-68200388ddf2.png)

When clicking on `invoke` within the command log, the console outputs the following:

![Console log invoke](https://cloud.githubusercontent.com/assets/1271364/26691730/3a9baeca-46cc-11e7-8519-9e4a04490601.png)

# See also

- {% url `.its()` its %}
- {% url `cy.spy()` spy %}
- {% url `cy.stub()` stub %}
- {% url `.then()` then %}
- {% url `cy.wrap()` wrap %}
