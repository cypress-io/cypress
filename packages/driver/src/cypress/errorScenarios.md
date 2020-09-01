
The various error scenarios Cypress can encounter and how to address them
- Error: err.name
- Uncaught: whether it's an uncaught error
- Codeframe: what the code frame should display
- Original stack: what does the error stack include before we've modified it at all
- Replace: whether we should replace the stack with the user invocation stack
- Translate: whether we should translate the stack to point to source files instead of the built files served to the browser
- Append: whether we should append all or part of the original error stack to the newly replaced stack

Scenario 1: command assertion errors
====
```
cy.wrap({ foo: 'foo' })
  .should('have.property', 'foo')
  .should('equal', 'bar')
//

cy.get('#non-existent') // default assertion
```
- Error: AssertionError
- Uncaught: false
- Codeframe: cy.should, cy.get
- Original Stack: cypress internals
- Replace: yes, with command invocation stack
- Translate: yes
- Append: no

Scenario 2: exceptions
====
```
// at root level
foo.bar()
// in test
foo.bar()
// at root or in test
setTimeout(() => {
  foo.bar()
}, 20)
cy.wait(10000)
//
cy.wrap({}).should(() => {
  foo.bar()
})
//
Cypress.Commands.add('foo', () => {
  foo.bar()
})
cy.foo()
```
- Error: ReferenceError, etc
- Uncaught: true/false
- Codeframe: foo.bar()
- Original Stack: spec callsite
- Replace: no
- Translate: yes
- Append: no

Scenario 3: assertion errors
====
```
// at root
expect(true).to.be.false
// in test
expect(true).to.be.false
//
cy.wrap({}).then(() => {
  expect(true).to.be.false
})
//
cy.wrap({}).should(() => {
  expect(true).to.be.false
})
```
- Error: AssertionError
- Uncaught: true/false
- Codeframe: expect()
- Original Stack: cypress internals
- Replace: yes, with assertion invocation stack
- Translate: yes
- Append: no

Scenario 4: validation errors
====
async:
```
cy.viewport() // invalid args
// double visit
cy.visit('/test.html')
cy.visit('https://google.com')
cy.get('div:first').then(($el) => {
  $el.hide()
})
.click()
```

sync:
```
beforeEach(()=>{
  beforeEach(()=>{})
})

expect(true).to.be.nope
```

- Error: CypressError, Error<Chai validation>
- Uncaught: false
- Codeframe: cy.viewport
- Original Stack: cypress internals / chai internals
- Replace: yes
- Translate: yes
- Append: yes

Scenario 5: app sync uncaught errors
====
```
cy.visit('/visit_error.html') // error synchronously
cy
.visit('/error_on_click.html')
.get('p').click() // error on click event
```
- Error: ReferenceError, etc
- Uncaught: true
- Codeframe: none (but want to show app code + maybe cy.visit/cy.click)
- Original Stack: app code
- Replace: no
- Translate: yes (but can't now)
- Append: no

Scenario 6: app async uncaught errors
====
```
cy.visit('/html/visit_error.html') // error asynchronously
```
- Error: ReferenceError, etc
- Uncaught: true
- Codeframe: none (but want to show app code, don't show cy.visit)
- Original Stack: app code
- Replace: no
- Translate: yes (but can't now)
- Append: no

Scenario 7: network errors
====
```
cy.visit('/404')
cy.request('http://localhost:12345')
```
- Error: RequestError, etc - wrapped in CypressError
- Uncaught: false
- Codeframe: cy.visit
- Original Stack: node, cypress internals
- Replace: yes, with command invocation stack
- Translate: yes
- Append: yes, append both node and cypress internals

Rules:
====
- if assertion error, don't append original stack because the rules of why it errored are explicit
- if internal cypress error, append original stack so users can use it to understand the source of the error
- if internal cypress error originating from node, append node stack and internal cypress stack

TODO:
===
- if visit synchronously fails in app code, point to cy.visit in spec code
  - add 2nd code frame that points to app code
- don't hide stack trace by default, because now it's actually useful and not overly verbose with internal crud
- profile how much time Bluebird spends when we enable longStackTraces (cypress.js) and maybe turn it always off or always on
- splice out cypress internals when there's a user error (Scenario 2 when error is in a command callback)
- 
