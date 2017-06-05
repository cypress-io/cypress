title: Dead Simple Debugging
comments: true
---

# What You'll Learn

- how Cypress runs in the runloop with your code, keeping debugging simple and understandable for modern web developers
- how Cypress embraces the standard DevTools
- how and when to use `debugger` and the shorthand `.debug()` command

# Using `debugger`

Your Cypress test code runs in the same run loop as your application. This means we have access to variables and the code running on the page, as well as the things the browser makes available to you, like `document`, `window`, and, of course, `debugger`.

## Debug Just Like You Always Do... _Almost_

Based on those statements, you might be tempted to just throw a `debugger` into your test, like so:

```js
it("let's me debug like a fiend", function() {
  cy.visit('/my/page/path')

  cy.get('.selector-in-question')

  debugger // Doesn't work
})
```

...alas, this will not work. As you may remember from [Core Concepts](/guides/cypress-basics/core-concepts.html), `cy.*` commands simply enqueue and action to be taken later. Can you see what this test will do given that perspective? `cy.visit()` and `cy.get()` will both return immediately, having enqueued their work to be done later, and `debugger` will be executed before anything has happened... which will result in an error!

Let's use `.then()` to tap into the Cypress command flow and execute `debugger` at the appropriate time:

```js
it("let's me debug like a fiend", function() {
  cy.visit('/my/page/path')

  cy.get('.selector-in-question')
    .then(function(selectedElement) {
      debugger // Works like you think!
    })
})
```

Now we're in business! The first time through, `cy.visit()` and the `cy.get()` chain (with its `.then()` attached) are enqueued for Cypress to execute. The `it` block exits, and Cypress starts its work:

1. The page is visited, and Cypress waits for it to load.
2. The element is selected, and Cypress automatically waits and retries for a few moments if it isn't found immediately.
3. The function passed to `.then()` is executed, with the found element yielded to it.
4. Within the context of this function, `debugger` is called, halting the browser and focusing on the DevTools.
5. You're in! Inspect the state of your application like you normally would if you'd dropped the `debugger` into your application code.

## Using `.debug()`

But that's a lot of typing just to call `debugger` in context, yeah? Cypress exposes a shortcut for this, `.debug()`. Let's rewrite the test using this helper method:

```js
it("let's me debug like a fiend", function() {
  cy.visit('/my/page/path')

  cy.get('.selector-in-question')
    .debug()
})
```

Ah, that's better! And functionally equivalent. This is just another example of how Cypress seeks elegance and expressivity for the modern web tester. Fewer keystrokes, more power, don't break standard assumptions, and we all win.

Use `.debug()` to quickly inspect any (or many!) part(s) of your application during the test. You can attach it to any Cypress chain of commands to have a look at the system state at that moment.

# Using the DevTools

Though Cypress has built out [an excellent GUI application](/guides/cypress-basics/overview-of-the-gui-tool.html) to help you understand what is happening in your app and your tests, there's simply no replacing all the amazing work browser teams have done on their built-in development tools. Once again, we see that Cypress goes _with_ the flow of the modern ecosystem, opting to leverage these tools wherever possible.

TODO: show how clicking commands populates the dev tools, demonstrate a few commands

![Using the DevTools](http://placehold.it/1920x1080)
