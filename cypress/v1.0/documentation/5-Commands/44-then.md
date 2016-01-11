slug: then

### [cy.then( *function* )](#usage)

`cy.then()` will yield you the current subject as the first argument.  Be sure to read about [commands](commands) in detail if this sounds unfamiliar.

`cy.then()` is modeled identically to the way `Promises` work in JavaScript.  Whatever is returned from the callback function becomes the new subject, and will flow into the next command, with the exception of `null` and `undefined`.

When `null` or `undefined` is returned by the callback function, the subject will not be modified and will instead carry over to next command.

Just like `Promises`, you can return any compatible `thenable` (anything that has a `.then()` interface) and Cypress will wait for that to resolve before continuing forward through the chain of commands.

***

## Usage

> The element `input` is yielded

```js
cy.get("form").find("input").then(function($input){
  // work with $input subject here
  // we can potentially use it within an assertion
  // or just call some methods on it and return a new subject
})
```

***

> Asserting explicitly about the subject `li`'s

```js
cy.get("#todos li").then(function($lis){
  expect($lis).to.have.length(3)
  expect($lis.eq(0)).to.contain("walk the dog")
  expect($lis.eq(1)).to.contain("feed the cat")
  expect($lis.eq(2)).to.contain("write javascript")
})
```

Normally you'd use implicit subject assertions via [should](should) or [and](and), but it's sometimes convenient to write explicit assertions about a given subject.

**Note:** *any errors raised by failed assertions will immediately bubble up and cause the test to fail.  This is the opposite of [`wait`](wait).*

***

> The subject is changed by returning `{foo: 'bar'}`

```js
cy.then(function(){
  return {foo: "bar"}
}).then(function(obj){
  // subject is now the obj {foo: "bar"}
})
```

***

> Cypress waits for the Promise to resolve before continuing

```js
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

> Returning `null` or `undefined` will not modify the subject

```js
cy.get("form").then(function($form){
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

## Related

1. [its](its)
2. [invoke](invoke)
3. [wait](wait)