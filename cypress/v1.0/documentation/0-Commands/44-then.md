slug: then

### [cy.then( *function* )](#usage)

`cy.then()` will yield you the current subject as the first argument.  Be sure to read about [commands](commands) in detail if this sounds unfamiliar.

`cy.then()` is modeled identically to the way `Promises` work in JavaScript.  Whatever is returned from the callback function becomes the new subject, and will flow into the next command, with the exception of `null` and `undefined`.

When `null` or `undefined` is returned by the callback function, the subject will not be modified and will instead carry over to next command.

Just like `Promises`, you can return any compatible `thenable` (anything that has a `.then()` interface) and Cypress will wait for that to resolve before continuing forward through the chain of commands.

***

## Usage

> The element `input` is yielded

[block:code]
{
    "codes": [
        {
            "code": "cy.get(\"form\").find(\"input\").then(function($input){\n  // work with $input subject here\n  // we can potentially use it within an assertion\n  // or just call some methods on it and return a new subject\n})\n",
            "language": "js"
        }
    ]
}
[/block]

***

> Asserting explicitly about the subject `li`'s

[block:code]
{
    "codes": [
        {
            "code": "cy.get(\"#todos li\").then(function($lis){\n  expect($lis).to.have.length(3)\n  expect($lis.eq(0)).to.contain(\"walk the dog\")\n  expect($lis.eq(1)).to.contain(\"feed the cat\")\n  expect($lis.eq(2)).to.contain(\"write javascript\")\n})\n",
            "language": "js"
        }
    ]
}
[/block]

Normally you'd use implicit subject assertions via [should](should) or [and](and), but it's sometimes convenient to write explicit assertions about a given subject.

**Note:** *any errors raised by failed assertions will immediately bubble up and cause the test to fail.  This is the opposite of [`wait`](wait).*

***

> The subject is changed by returning `{foo: 'bar'}`

[block:code]
{
    "codes": [
        {
            "code": "cy.then(function(){\n  return {foo: \"bar\"}\n}).then(function(obj){\n  // subject is now the obj {foo: \"bar\"}\n})\n",
            "language": "js"
        }
    ]
}
[/block]

***

> Cypress waits for the Promise to resolve before continuing

[block:code]
{
    "codes": [
        {
            "code": "// if using Q\ncy.get(\"button\").click().then(function($button){\n  var p = Q.defer()\n\n  setTimeout(function(){\n    p.resolve()\n  }, 5000)\n\n  return p.promise\n})\n\n\n// if using bluebird\ncy.get(\"button\").click().then(function($button){\n  return Promise.delay(5000)\n})\n\n\n// if using jQuery deferred's\ncy.get(\"button\").click().then(function($button){\n  var df = $.Deferred()\n\n  setTimeout(function(){\n    df.resolve()\n  }, 5000)\n\n  return df\n})\n",
            "language": "js"
        }
    ]
}
[/block]

***

> Returning `null` or `undefined` will not modify the subject

[block:code]
{
    "codes": [
        {
            "code": "cy.get(\"form\").then(function($form){\n  console.log(\"form is:\", $form)\n  // undefined is returned here, therefore\n  // the $form subject will automatically\n  // carry over and allow for continued chaining\n}).find(\"input\").then(function($input){\n  // we have our real $input element here since\n  // our form element carried over and we called\n  // .find(\"input\") on it\n})\n",
            "language": "js"
        }
    ]
}
[/block]

## Related

1. [its](its)
2. [invoke](invoke)
3. [wait](wait)