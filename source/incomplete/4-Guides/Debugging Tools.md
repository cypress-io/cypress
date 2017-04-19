slug: debugging-tools
excerpt: Debug Cypress

# DOM Events

# Page Events

Cypress will additionally log out when specific "page events" happen. These are events which alter the state of your application and can help provide insight and feedback into the logical order of what happened and when it happened.

For instance Cypress will log out the following:

* Whenever your URL changes (and the new url)
* Whenever the submit event is detected (from a traditional `<form>` submit)
* Whenever the page begins to load (after clicking on an `<a>` or navigating to another page)
* Whenever the page finishes loading
* Whenever an XHR is issued (when the `cy.server` has been started)

# Debugging Assertions

- When assertions fail
- Determining Subject Changes
- Clicking on an assertion for more information
- Inspecting Objects
- Making multiple assertions