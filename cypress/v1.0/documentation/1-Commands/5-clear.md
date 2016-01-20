slug: clear
excerpt: Clear a value of an input or textarea

# [cy.clear()](#usage)

Clears a value of an `<input>` or `<textarea>`.

Under the hood this is actually a shortcut for writing:

```javascript
.type("{selectall}{backspace}")
```

***

# Usage

Clear the input and type a new value.

```html
<input name="name" value="John Doe" />
```

```javascript
// clears the existing value first before typing
cy.get("input[name='name']").clear().type("Jane Lane")
```

***

# Command Log

```javascript
cy.get("input[name='name']").clear().type("Jane Lane")
```

The commands above will display in the command log as:

<img width="570" alt="screen shot 2015-11-29 at 12 56 58 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458939/bac1f4dc-9698-11e5-8e20-1ed9405f3d30.png">

When clicking on `clear` within the command log, the console outputs the following:

<img width="511" alt="screen shot 2015-11-29 at 12 57 07 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458940/bdc93a50-9698-11e5-8be7-ef6a0470c3ae.png">

***

# Related

1. [type](https://on.cypress.io/api/type)