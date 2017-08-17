---
title: and
comments: false
---

Create an assertion. Assertions are automatically retried until they pass or time out.

{% note info %}
An alias of {% url `.should()` should %}
{% endnote %}

{% note info %}
**Note:** `.and()` assumes you are already familiar with core concepts such as {% url 'assertions' introduction-to-cypress#Assertions %}
{% endnote %}

# Syntax

```javascript
.and(chainers)
.and(chainers, value)
.and(chainers, method, value)
.and(callbackFn)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.get('.error').should('be.empty').and('be.hidden')  // Assert '.error' is empty and hidden
cy.contains('Login').and('be.visible')                // Assert el is visible
cy.wrap({ foo: 'bar' })
  .should('have.property', 'foo')                     // Assert the 'foo' property exists
  .and('eq', 'bar')                                   // Assert the 'foo' property equals 'bar'
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
cy.and('eq', '42')   // Errors, cannot be chained off 'cy'
```

## Arguments

**{% fa fa-angle-right %} chainers** ***(String)***

Any valid chainer that comes from {% url 'Chai' assertions#Chai %} or {% url 'Chai-jQuery' assertions#Chai-jQuery %} or {% url 'Sinon-Chai' assertions#Sinon-Chai %}.

**{% fa fa-angle-right %} value** ***(String)***

Value to assert against chainer.

**{% fa fa-angle-right %} method** ***(String)***

A method to be called on the chainer.

**{% fa fa-angle-right %} callbackFn** ***(Function)***

Pass a function that can have any number of explicit assertions within it. Whatever was passed to the function is what is yielded.

## Yields {% helper_icon yields %}

{% yields assertion_indeterminate .and %}

```javascript
cy
  .get('nav')                       // yields <nav>
  .should('be.visible')             // yields <nav>
  .and('have.class', 'open')        // yields <nav>
```
However, some chainers change the subject. In the example below, `.and()` yields the string `sans-serif` because the chainer `have.css, 'font-family'` changes the subject.

```javascript
cy
  .get('nav')                       // yields <nav>
  .should('be.visible')             // yields <nav>
  .and('have.css', 'font-family')   // yields 'sans-serif'
  .and('match', /serif/)            // yields 'sans-serif'
```

# Examples

## Chainers

***Chain assertions on the same subject***

```javascript
cy.get('button').should('have.class', 'active').and('not.be.disabled')
```

## Value

***Chain assertions when yield changes***

```html
<!-- App Code -->
<ul>
  <li>
    <a href="users/123/edit">Edit User</a>
  </li>
</ul>
```

```javascript
cy
  .get('a')
  .should('contain', 'Edit User') // yields <a>
  .and('have.attr', 'href')       // yields string value of href
  .and('match', /users/)          // yields string value of href
  .and('not.include', '#')        // yields string value of href
```

## Method and Value

***Assert the href is equal to '/users'***

```javascript
cy
  .get('#header a')
  .should('have.class', 'active')
  .and('have.attr', 'href', '/users')
```

## Function

***Verify length, content, and classes from multiple `<p>`***

Passing a function to `.and()` enables you to assert on the yielded subject. This gives you the opportunity to *massage* what you'd like to assert.

Just be sure *not* to include any code that has side effects in your callback function.

The callback function will be retried over and over again until no assertions within it throw.

```html
<div>
  <p class="text-primary">Hello World</p>
  <p class="text-danger">You have an error</p>
  <p class="text-default">Try again later</p>
</div>
```

```javascript
cy
  .get('p')
  .should('not.be.empty')
  .and(function($p){
    // should have found 3 elements
    expect($p).to.have.length(3)

    // make sure the first contains some text content
    expect($p.first()).to.contain('Hello World')

    // use jquery's map to grab all of their classes
    // jquery's map returns a new jquery object
    var classes = $p.map(function(i, el){
      return Cypress.$(el).attr('class')
    })

    // call classes.get() to make this a plain array
    expect(classes.get()).to.deep.eq([
      'text-primary',
      'text-danger',
      'text-default'
    ])
  })
```

{% note info %}
Using a callback function {% urlHash 'will not change the subject' Subjects %}
{% endnote %}

# Notes

## Chai

***Similarities to Chai***

If you've worked in {% url "Chai" http://chaijs.com/ %} before, you will recognize that `.and()` matches the same fluent assertion syntax.

Take this *explicit* assertion for example:

```javascript
expect({foo: 'bar'}).to.have.property('foo').and.eq('bar')
```

`.and()` reproduces this same assertion behavior.

## Subjects

***How do I know which assertions change the subject and which keep it the same?***

The chainers that come from {% url 'Chai' bundled-tools#Chai %} or {% url 'Chai-jQuery' bundled-tools#Chai-jQuery %} will always document what they return.

***Using a callback function will not change what is yielded***

Whenever you use a callback function, its return value is always ignored. Cypress always forces the command to yield the value from the previous cy command's yield (which in the example below is `<button>`)

```javascript
cy
  .get('button')
  .should('be.active')
  .and(($button) => {
    expect({foo: 'bar'}).to.deep.eq({foo: 'bar'})
    return {foo: 'bar'} // return is ignored, .and() yields <button>
  })
  .then(($button) => {
    // do anything we want with <button>
  })
```

## Differences

{% partial then_should_difference %}

# Rules

## Requirements {% helper_icon requirements %}

{% requirements child .and %}

## Timeouts {% helper_icon timeout %}

{% timeouts timeouts .and %}

```javascript
cy.get('input', {timeout: 10000}).should('have.value', '10').and('have.class', 'error')
                         ↲
  // timeout here will be passed down to the '.and()'
  // and it will retry for up to 10 secs
```

```javascript
cy.get('input', {timeout: 10000}).should('have.value', 'US').and(($input) => {
                         ↲
  // timeout here will be passed down to the '.and()'
  // unless an assertion throws earlier,
  // ALL of the assertions will retry for up to 10 secs
  expect($input).to.not.be('disabled')
  expect($input).to.not.have.class('error')
})
```

# Command Log

**Chain assertions on the same subject**

```javascript
cy
  .get('.list')
  .find('input[type="checkbox"]')
    .should('be.checked')
    .and('not.be.disabled')
```

The commands above will display in the command log as:

![Command log for assertions](/img/api/and/cypress-and-command-log.png)

When clicking on `assert` within the command log, the console outputs the following:

![console.log for assertions](/img/api/and/cypress-assertions-console-log.png)

# See also

- {% url `.should()` should %}
- {% url 'Guide: Introduction to Cypress' introduction-to-cypress#Assertions %}
- {% url 'Reference: List of Assertions' assertions %}
