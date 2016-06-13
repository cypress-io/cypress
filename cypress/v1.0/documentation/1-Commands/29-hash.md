slug: hash
excerpt: Get the current URL hash

Get the current URL hash. This is the same as [`cy.location().hash`](https://on.cypress.io/api/location)

| | |
|--- | --- |
| **Returns** | the current URL hash as a string, including the `#` character. If no `#` character is present, an empty string will be returned. |
| **Timeout** | *cannot timeout* |

***

# [cy.hash()](#section-usage)

Get the current URL hash.

***

# Options

Pass in an options object to change the default behavior of `cy.hash`.

**cy.hash( *options* )**
**cy.hash( *options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log

***

# Usage

## Assert that the hash is `#/users/1` given the remote URL: `http://localhost:8000/app/#/users/1`

```javascript
// Hash returns #/users/1
cy.hash().should("eq", "#/users/1") // => true
```

***

## Assert that the hash matches via RegExp

```html
<ul id="users">
  <li>
    <a href="#/users/8fc45b67-d2e5-465a-b822-b281d9c8e4d1">Fred</a>
  </li>
</ul>
```

```javascript
cy
  .get("#users li").find("a")
  .hash().should("match", /users\/.+$/) // => true
```

***

# Notes

## Hash is a shortcut for `cy.location().hash`

These 3 assertions are all the same.

```javascript
// 1. verbose
cy.location().then(function(location){
  expect(location.hash).to.eq("#/users/1")
})

// 2. better
cy.location().its("hash").should("eq", "#/users/1")

// 3. best
cy.hash().should("eq", "#/users/1")
```

***

# Command Log

## Assert that the hash matches `#users/new`

```javascript
cy.hash().should("eq", "#users/new")
```

The commands above will display in the command log as:

<img width="581" alt="screen shot 2015-11-29 at 1 34 12 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459152/ed737be4-969d-11e5-823e-1d12cd7d03b1.png">

When clicking on `hash` within the command log, the console outputs the following:

<img width="472" alt="screen shot 2015-11-29 at 1 34 17 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459153/f0aa6476-969d-11e5-9851-302957f9eb0f.png">


***

# Related

- [location](https://on.cypress.io/api/location)
- [url](https://on.cypress.io/api/url)