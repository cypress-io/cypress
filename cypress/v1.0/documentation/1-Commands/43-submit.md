slug: submit
excerpt: Submit a form

# [cy.submit()](#usage)

Submits the current subject if it is a form.

Follows all of the rules of form submission per the w3c spec.

***

# Usage

Submit a form

```html
<form id="contact">
  <input type="text" name="message">
  <button type="submit">Send</button>
</form>
```

```javascript
// submits the form and performs all default actions
// returns <form> for further chaining
cy.get("#contact").submit()
```

***

# Command Log

```javascript
cy.route("POST", /users/, "fixture:user").as("userSuccess")
cy.get("form").submit()
```

The commands above will display in the command log as:

<img width="594" alt="screen shot 2015-11-29 at 1 21 43 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459081/3149d9e6-969c-11e5-85b2-ba57638f02df.png">

When clicking on `submit` within the command log, the console outputs the following:

<img width="547" alt="screen shot 2015-11-29 at 12 42 22 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458858/b30b0a0a-9696-11e5-99b9-d785b597287c.png">

***

# Related

1. [click](https://on.cypress.io/api/click)