---
title: its
comments: false
---

Get a property's value on the previously yielded subject.

{% note info %}
If you want to call a function on the previously yielded subject, use {% url `.invoke()` invoke %}.
{% endnote %}

# Syntax

```javascript
.its(propertyName)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.wrap({width: '50'}).its('width') // Get the 'width' property
cy.window().its('angular')          // Get the 'angular' property
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
cy.its('window')                // Errors, cannot be chained off 'cy'
cy.clearCookies().its('length') // Errors, 'clearCookies' does not yield Object
```

## Arguments

**{% fa fa-angle-right %} propertyName**  ***(String)***

Name of property or nested properties (with dot notation) to get.

## Yields {% helper_icon yields %}

{% yields changes_subject .its 'yields the value of the property' %}

# Examples

## Plain Objects

***Get property***

```javascript
cy.wrap({age: 52}).its('age').should('eq', 52) // true
```

## DOM Elements

***Get the `length` property of a DOM element***

```javascript
cy
  .get('ul li')       // this yields us a jquery object
  .its('length')      // calls 'length' property returning that value
  .should('be.gt', 2) // ensure the length is greater than 2
})
```

## Strings

***Get `length` of title***

```javascript
cy.title().its('length').should('eq', 24)
```

## Functions

***Get function as property***

```javascript
var fn = function(){
  return 42
}

cy.wrap({getNum: fn}).its('getNum').should('be.a', 'function')
```

***Access function properties***

You can access functions to then drill into their own properties instead of invoking them.

```javascript
// Your app code
// a basic Factory constructor
var Factory = function(arg){
  // ...
}

Factory.create = function(arg){
  return new Factory(arg)
}

// assign it to the window
window.Factory = Factory
```

```javascript
cy
  .window()                 // yields window object
  .its('Factory')           // yields Factory function
  .invoke('create', 'arg')  // now invoke properties on it
```

***Use `.its()` to test `window.fetch`***

{% note info %}
{% url "Check out our example recipe on testing `window.fetch` using `.its()`" stubs-spies-and-clocks-recipe %}
{% endnote %}

## Nested Properties

You can drill into nested properties by using *dot notation*.

```javascript
var user = {
  contacts: {
    work: {
      name: 'Kamil'
    }
  }
}

cy.wrap(user).its('contacts.work.name').should('eq', 'Kamil') // true
```

# Rules

## Requirements {% helper_icon requirements %}

{% requirements child .its %}

## Assertions {% helper_icon assertions %}

{% assertions its .its %}

## Timeouts {% helper_icon timeout %}

{% timeouts its .its %}

# Command Log

***Get `responseBody` of aliased route***

```javascript
cy.server()
cy.route(/comments/, 'fixture:comments.json').as('getComments')
cy.get('#fetch-comments').click()
cy.wait('@getComments').its('responseBody').should('deep.eq', [
  {id: 1, comment: 'hi'},
  {id: 2, comment: 'there'}
])
```

The commands above will display in the command log as:

![Command Log](/img/api/its/xhr-response-its-response-body-for-testing.png)

When clicking on `its` within the command log, the console outputs the following:

![Console Log](/img/api/its/response-body-yielded-with-its-command-log.png)

# See also

- {% url `.invoke()` invoke %}
- {% url `.then()` then %}
- {% url `cy.wrap()` wrap %}
