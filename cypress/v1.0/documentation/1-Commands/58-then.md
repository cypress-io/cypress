slug: then
excerpt: Invokes a callback function with the current subject

`cy.then()` will yield you the current subject as the first argument.

`cy.then()` is modeled identically to the way Promises work in JavaScript.  Whatever is returned from the callback function becomes the new subject, and will flow into the next command, with the exception of `null` and `undefined`.

When `null` or `undefined` is returned by the callback function, the subject will not be modified and will instead carry over to the next command.

Just like Promises, you can return any compatible "thenable" (anything that has a `.then()` interface) and Cypress will wait for that to resolve before continuing forward through the chain of commands.

| | |
|--- | --- |
| **Returns** | the return of the callback function |
| **Timeout** | `cy.then` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) or the duration of the `timeout` specified in the command's [options](#options). |

***

# [cy.then( *function* )](#usage)

Yield the current subject as the first argument.

***

# Usage

## The element `input` is yielded

```html
<form id="todos">
  <input type="text" class="addTodo" />
</form>
```

```javascript
cy.get("form").find("input").then(function($input){
  // work with $input subject here
  // we can potentially use it within an assertion
  // or just call some methods on it and return a new subject
})
```

***

# Options

Pass in an options object to change the default behavior of `cy.then`.

**[cy.click( *options*,  *function* )](#options-usage)**

Option | Default | Notes
--- | --- | ---
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry the click

***

# Usage

## Assert explicitly about the subject `<li>`'s

```html
<div id="todos">
  <li>Walk the dog</li>
  <li>Feed the cat</li>
  <li>Write JavaScript</li>
</div>
```

```javascript
cy.get("#todos li").then(function($lis){
  expect($lis).to.have.length(3)
  expect($lis.eq(0)).to.contain("Walk the dog")
  expect($lis.eq(1)).to.contain("Feed the cat")
  expect($lis.eq(2)).to.contain("Write JavaScript")
})
```

Normally you'd use implicit subject assertions via [should](https://on.cypress.io/api/should) or [and](https://on.cypress.io/api/and), but it's sometimes it's more convenient to write explicit assertions about a given subject.

[block:callout]
{
  "type": "warning",
  "body": "Any errors raised by failed assertions will immediately bubble up and cause the test to fail."
}
[/block]

***

## The subject is changed by returning `{foo: 'bar'}`

```javascript
cy.then(function(){
  return {foo: "bar"}
}).then(function(obj){
  // subject is now the obj {foo: "bar"}
  expect(obj).to.deep.eq({foo: "bar"}) // true
})
```

***

## Cypress waits for the Promise to resolve before continuing

```javascript
// if using Q
cy.get("button").click().then(function($button){
  var p = Q.defer()

  setTimeout(function(){
    p.resolve()
  }, 5000)

  return p.promise
})


// if using bluebird
cy.get("button").click().then(function($button){
  return Promise.delay(5000)
})


// if using jQuery deferred's
cy.get("button").click().then(function($button){
  var df = $.Deferred()

  setTimeout(function(){
    df.resolve()
  }, 5000)

  return df
})
```

***

## Returning `null` or `undefined` will not modify the subject

```javascript
cy
  .get("form").then(function($form){
    console.log("form is:", $form)
    // undefined is returned here, therefore
    // the $form subject will automatically
    // carry over and allow for continued chaining
  }).find("input").then(function($input){
    // we have our real $input element here since
    // our form element carried over and we called
    // .find("input") on it
  })
```

***

# Options Usage

```javascript
cy.then({timeout: 7000}, function(){
  // code here
})
```

***

# Related

- [its](https://on.cypress.io/api/its)
- [invoke](https://on.cypress.io/api/invoke)
- [Issuing Commands](https://on.cypress.io/guides/issuing-commands)
