slug: debugging-tools
excerpt: Debug Cypress

## DOM Events

TODO:

1. talk about simulated events vs native events
2. when each type of event is used
3. event strategy
4. known issues

## Page Events

Cypress will additionally log out when specific "page events" happen. These are events which alter the state of your application and can help provide insight and feedback into the logical order of what happened and when it happened.

For instance Cypress will log out the following:

* Whenever your URL changes (and the new url)
* Whenever the submit event is detected (from a traditional `<form>` submit)
* Whenever the page begins to load (after clicking on an `<a>` or navigating to another page)
* Whenever the page finishes loading
* Whenever an XHR is issued (when the `cy.server` has been started)

