---
title: should
comments: false
---

Create an assertion. Assertions are automatically retried until they pass or time out.

{% note info %}
An alias of {% url `.and()` and %}
{% endnote %}

{% note info %}
**Note:** `.should()` assumes you are already familiar with core concepts such as {% url 'assertions' introduction-to-cypress#Assertions %}
{% endnote %}

# Syntax

```javascript
.should(chainers)
.should(chainers, value)
.should(chainers, method, value)
.should(callbackFn)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.get('.error').should('be.empty')                    // Assert that '.error' is empty
cy.contains('Login').should('be.visible')              // Assert that el is visible
cy.wrap({ foo: 'bar' }).its('foo').should('eq', 'bar') // Assert the 'foo' property equals 'bar'

```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
cy.should('eq', '42')   // Errors, cannot be chained off 'cy'
```

## Arguments

**{% fa fa-angle-right %} chainers** ***(String)***

Any valid chainer that comes from {% url 'Chai' assertions#Chai %} or {% url 'Chai-jQuery' assertions#Chai-jQuery %} or {% url 'Sinon-Chai' assertions#Sinon-Chai %}.

**{% fa fa-angle-right %} value** ***(String)***

Value to assert against chainer.

**{% fa fa-angle-right %} method** ***(String)***

A method to be called on the chainer.

**{% fa fa-angle-right %} callback function** ***(Function)***

Pass a function that can have any number of explicit assertions within it. Whatever was passed to the function is what is yielded.

## Yields {% helper_icon yields %}

{% yields assertion_indeterminate .should %}

```javascript
cy.get('nav')                       // yields <nav>
  .should('be.visible')             // yields <nav>
```

However, some chainers change the subject. In the example below, the second `.should()` yields the string `sans-serif` because the chainer `have.css, 'font-family'` changes the subject.

```javascript
cy.get('nav')                       // yields <nav>
  .should('be.visible')             // yields <nav>
  .and('have.css', 'font-family')   // yields 'sans-serif'
  .and('match', /serif/)            // yields 'sans-serif'
```

# Examples

## Chainers

***Assert the checkbox is disabled***

```javascript
cy.get(':checkbox').should('be.disabled')
```

***The current DOM element is yielded***

```javascript
cy.get('option:first').should('be.selected').then(($option) => {
  // $option is yielded
})
```

## Value

***Assert the class is 'form-horizontal'***

```javascript
cy.get('form').should('have.class', 'form-horizontal')
```

***Assert the value is not 'Jane'***

```javascript
cy.get('input').should('not.have.value', 'Jane')
```

***The current subject is yielded***

```javascript
cy.get('button').should('have.id', 'new-user').then(($button) =>{
  // $button is yielded
})
```

## Method and Value

***Assert the href is equal to '/users'***

```javascript
// have.attr comes from chai-jquery
cy.get('#header a').should('have.attr', 'href', '/users')
```

## Callback function

***Verify length, content, and classes from multiple `<p>`***

Passing a function to `.should()` enables you to make multiple assertions on the yielded subject. This also gives you the opportunity to *massage* what you'd like to assert on. The callback function will be retried over and over again until no assertions within it throw. You should use explicit assertions inside the `should()` callback function.

```html
<div>
  <p class="text-primary">Hello World</p>
  <p class="text-danger">You have an error</p>
  <p class="text-default">Try again later</p>
</div>
```

```javascript
cy.get('p')
  .should(($p) =>{
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

***Any thrown error will cause `should()` to wait and retry***

Any errors raised inside the callback function will bubble up after `timeout` and cause the test to fail. For example, the test below has an invalid variable reference, but will fail only after `timeout` period has passed.

```javascript
cy.get('body')
  .should(function($body){
    foo // ReferenceError on purpose
  })
// CypressError: Timed out retrying: foo is not defined
```

## Multiple Assertions

***Chaining multiple assertions***

Cypress makes it easy to chain assertions together.

In this example we use {% url `.and()` and %} which is identical to `.should()`.

```javascript
// our subject is not changed by our first assertion,
// so we can continue to use DOM based assertions
cy.get('option:first').should('be.selected').and('have.value', 'Metallica')
```

## Wait until the assertions pass

Cypress won't resolve your commands until all of its assertions pass.

```javascript
// Application Code
$('button').click(() => {
  $button = $(this)

  setTimeout(() => {
    $button.removeClass('inactive').addClass('active')
  }, 1000)
})
```

```javascript
cy.get('button').click()
  .should('have.class', 'active')
  .and('not.have.class', 'inactive')
```

# Notes

## Subjects

***How do I know which assertions change the subject and which keep it the same?***

The chainers that come from {% url 'Chai' bundled-tools#Chai %} or {% url 'Chai-jQuery' bundled-tools#Chai-jQuery %} will always document what they return.

***Using a callback function will not change what is yielded***

Whatever is returned in the function is ignored. Cypress always forces the command to yield the value from the previous cy command's yield (which in the example below is `<button>`)

```javascript
cy.get('button')
  .should(($button) =>{
    expect({foo: 'bar'}).to.deep.eq({foo: 'bar'})
    return {foo: 'bar'} // return is ignored, .should() yields <button>
  })
  .then(($button) => {
    // do anything we want with <button>
  })
```

## Differences

{% partial then_should_difference %}

## Antipattern

Be sure *not* to include any code that has side effects in your callback function, because the callback function can be called multiple times before it passes without exceptions.

Make sure to throw errors to keep waiting and *not* return `false` value. For example see the difference in the code below:

```html
<div id="todos">
  <li>Walk the dog</li>
  <li>Feed the cat</li>
  <li>Write JavaScript</li>
</div>
```

```javascript
// BAD, the test passes despite list having only 3 items
cy.get('#todos li').should(($lis) => $lis.length === 10)
// GOOD, the test fails because we have 3 items and not 10
cy.get('#todos li').should(($lis) => {
  expect($lis.length).to.equal(10)
})
```

# Rules

## Requirements {% helper_icon requirements %}

{% requirements child .should %}

## Timeouts {% helper_icon timeout %}

{% timeouts timeouts .should %}

```javascript
cy.get('input', {timeout: 10000}).should('have.value', '10')
  //                    ↲
  // timeout here will be passed down to the '.should()'
  // and it will retry for up to 10 secs
```

```javascript
cy.get('input', {timeout: 10000}).should(($input) => {
  //                    ↲
  // timeout here will be passed down to the '.should()'
  // unless an assertion throws earlier,
  // ALL of the assertions will retry for up to 10 secs
  expect($input).to.not.be('disabled')
  expect($input).to.not.have.class('error')
  expect($input).to.have.value('US')
})
```

# Command Log

***Assert that there should be 8 children in a nav***

```javascript
cy.get('.left-nav>.nav').children().should('have.length', 8)
```

The commands above will display in the command log as:

![Command Log should](/img/api/should/should-command-shows-up-as-assert-for-each-assertion.png)

When clicking on `assert` within the command log, the console outputs the following:

![Console Log should](/img/api/should/assertion-in-console-log-shows-actual-versus-expected-data.png)

# See also

- {% url `.and()` and %}
- {% url 'Guide: Introduction to Cypress' introduction-to-cypress#Assertions %}
- {% url 'Reference: List of Assertions' assertions %}
